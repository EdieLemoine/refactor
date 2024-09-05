import type {
  CommandContext,
  ImportOrExportStatementDefinition,
  VariableMap,
  BarrelMap,
  FileModificationDefinition,
  RefactorOptions,
} from '../types.ts';
import {toRelative} from '../utils/toRelative.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import * as ts from 'typescript';
import {getTargetFilePath} from '../utils/getTargetFilePath.ts';
import {isBarrelFile} from '../utils/isBarrelFile.ts';
import chalk from 'chalk';
import {extendContext} from '../utils/extendContext.ts';
import {addToMapSet} from '../utils/addToMapSet.ts';
import {glob} from 'fast-glob';
import {BASE_IGNORES, FileChange} from '../constants.ts';
import {parseImportOrExportClause} from '../utils/parseImportOrExportClause.ts';
import {formatImportOrExportStatements} from '../utils/formatImportOrExportStatements.ts';
import {formatImportOrExportPath} from '../utils/formatImportOrExportPath.ts';
import {getExportsFromBarrel} from '../utils/getExportsFromBarrel.ts';
import path from 'node:path';
import {toAbsolute} from '../utils/toAbsolute.ts';

export const scanImports = (
  inputContext: CommandContext<RefactorOptions>,
  barrels: BarrelMap,
  variables: VariableMap,
): FileModificationDefinition[] => {
  const context = extendContext(inputContext, 'scanImports');

  context.debug.debug('calculating file updates');

  const sourceFiles = glob.sync(context.options.sourceGlob, {
    absolute: true,
    cwd: context.inputPath,
    ignore: BASE_IGNORES,
  });

  const fileChanges: FileModificationDefinition[] = [];

  sourceFiles.forEach((filePath) => {
    const nestedContext = extendContext(context, toRelative(context, filePath));

    const sourceFile = createSourceFile(context, filePath);
    const { debug } = nestedContext;

    const imports = sourceFile.statements.filter(ts.isImportDeclaration);

    imports.forEach((node) => {
      const importPath = node.moduleSpecifier.getText().replace(/['"]/g, '');

      // if it is not a relative import, skip
      if (!importPath.startsWith('.')) {
        debug.debug(chalk.gray('skipping non-relative import'), importPath);
        return;
      }

      const targetFilePath = getTargetFilePath(nestedContext, importPath, filePath);

      // check if it is a barrel import by comparing the actual targetFilePath to the importText
      const isBarrelImport = isBarrelFile(nestedContext, targetFilePath);

      if (!isBarrelImport) {
        return;
      }

      const importedValues = node.importClause?.namedBindings;

      if (!importedValues) {
        debug.warn(chalk.red('no imports', importPath, 'in', toRelative(nestedContext, filePath)));
        return;
      }

      const newImports = new Map<string, Set<ImportOrExportStatementDefinition>>();

      const barrelKey = toRelative(nestedContext, targetFilePath);
      const matchingExports = getExportsFromBarrel(nestedContext, variables, barrels.get(barrelKey));

      node.importClause?.namedBindings?.forEachChild((childNode) => {
        const { isType, name } = parseImportOrExportClause(childNode);

        const matchingFile = Array.from(matchingExports.entries()).find(([, value]) => value.has(name));

        if (!matchingFile) {
          debug.error(chalk.red('(imports) no matching file found for', name));
          return;
        }

        const absolutePath = toAbsolute(nestedContext, matchingFile[0]);
        const newImportPath = formatImportOrExportPath(path.relative(path.dirname(filePath), absolutePath));

        debug.debug(chalk.green('replace:'), chalk.gray(importPath), '->', chalk.green(newImportPath));

        addToMapSet(newImportPath, { name, isType }, newImports);
      });

      const newStatements = formatImportOrExportStatements(context, 'import', newImports);

      if (newStatements.length === 0) {
        debug.warn(chalk.red('EMPTY REPLACEMENT!'));
        return;
      }

      fileChanges.push({
        type: FileChange.Update,
        path: filePath,
        oldContent: node.getText(),
        newContent: newStatements.join('\n'),
      });
    });
  });

  return fileChanges;
};
