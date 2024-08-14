import type {
  CommandContext,
  ImportOrExportStatementDefinition,
  VariableMap,
  BarrelMap,
  FileModificationDefinition,
} from '../types.ts';
import {relativePath} from '../utils/relativePath.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import * as ts from 'typescript';
import {getTargetFilePath} from '../utils/getTargetFilePath.ts';
import {isBarrelFile} from '../utils/isBarrelFile.ts';
import chalk from 'chalk';
import path from 'node:path';
import {extendContext} from '../utils/extendContext.ts';
import {addToMapSet} from '../utils/addToMapSet.ts';
import {glob} from 'fast-glob';
import {BASE_IGNORES, FileChange} from '../constants.ts';
import {parseImportOrExportClause} from '../utils/parseImportOrExportClause.ts';
import {formatImportOrExportStatements} from '../utils/formatImportOrExportStatements.ts';
import {formatImportOrExportPath} from '../utils/formatImportOrExportPath.ts';
import {getExportsFromBarrel} from '../utils/getExportsFromBarrel.ts';

export const scanImportUpdates = (
  inputContext: CommandContext,
  barrels: BarrelMap,
  variables: VariableMap,
): FileModificationDefinition[] => {
  const context = extendContext(inputContext, 'scanImports');

  context.debug.debug('calculating file updates');

  const sourceFiles = glob.sync(`${context.inputPath}/${context.options.sourceGlob}`, {
    ignore: [
      ...BASE_IGNORES,
      `**/${context.options.barrelFilename}`,
    ],
  });

  const fileChanges: FileModificationDefinition[] = [];

  sourceFiles.forEach((file) => {
    const nestedContext = extendContext(context, relativePath(context, file));
    const sourceFile = createSourceFile(file);

    const imports = sourceFile.statements.filter(ts.isImportDeclaration);

    imports.forEach((node) => {
      const importPath = node.moduleSpecifier.getText().replace(/['"]/g, '');

      // if it is not a relative import, skip
      if (!importPath.startsWith('.')) {
        nestedContext.debug.debug(chalk.gray('skipping non-relative import'), importPath);
        return;
      }

      const targetFilePath = getTargetFilePath(nestedContext, importPath, file);

      // check if it is a barrel import by comparing the actual targetFilePath to the importText
      const isBarrelImport = isBarrelFile(nestedContext, targetFilePath);

      if (!isBarrelImport) {
        return;
      }

      const importedValues = node.importClause?.namedBindings;

      if (!importedValues) {
        nestedContext.debug.warn(chalk.red('no imports', importPath, 'in', relativePath(nestedContext, file)));
        return;
      }

      const newImports = new Map<string, Set<ImportOrExportStatementDefinition>>();

      const matchingExports = getExportsFromBarrel(nestedContext, variables, barrels.get(targetFilePath));

      node.importClause?.namedBindings?.forEachChild((childNode) => {
        const { isType, name } = parseImportOrExportClause(childNode);

        const matchingFile = Array.from(matchingExports.entries()).find(([, value]) => value.has(name));

        if (!matchingFile) {
          nestedContext.debug.error(chalk.red('no matching file found for', name));
          return;
        }

        const newImportPath = formatImportOrExportPath(path.relative(path.dirname(file), matchingFile[0]));

        nestedContext.debug.debug(chalk.green('replace:'), chalk.gray(importPath), '->', chalk.green(newImportPath));

        addToMapSet(newImportPath, { name, isType }, newImports);
      });

      const newStatements = formatImportOrExportStatements(context, 'import', newImports);

      if (newStatements.length === 0) {
        nestedContext.debug.warn(chalk.red('EMPTY REPLACEMENT!'));
        return;
      }

      fileChanges.push({
        type: FileChange.Update,
        path: file,
        oldContent: node.getText(),
        newContent: newStatements.join('\n'),
      });
    });
  });

  return fileChanges;
};
