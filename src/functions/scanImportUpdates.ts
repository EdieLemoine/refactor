import type {CommandContext, FileChangeDefinition, ImportOrExportStatementDefinition} from '../types.ts';
import {relativePath} from '../utils/relativePath.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import * as ts from 'typescript';
import {getTargetFilePath} from '../utils/getTargetFilePath.ts';
import {isBarrelFile} from '../utils/isBarrelFile.ts';
import chalk from 'chalk';
import path from 'node:path';
import {extendContext} from '../utils/extendContext.ts';
import {formatImportStatements} from '../utils/formatImportStatements.ts';
import {addToMapSet} from '../utils/addToMapSet.ts';
import {addToMapArray} from '../utils/addToMapArray.ts';
import {glob} from 'fast-glob';
import {BASE_IGNORES} from '../constants.ts';
import {parseImportOrExportClause} from '../utils/parseImportOrExportClause.ts';

export const scanImportUpdates = (
  inputContext: CommandContext,
  barrels: Map<string, Set<string>>,
  variables: Map<string, Set<string>>,
): Map<string, FileChangeDefinition[]> => {
  const context = extendContext(inputContext, 'scanImports');

  context.debug.debug('calculating file updates');

  const sourceFiles = glob.sync(`${context.inputPath}/${context.options.sourceGlob}`, {
    ignore: [
      ...BASE_IGNORES,
      `**/${context.options.barrelFilename}`,
    ],
  });

  const fileChanges = new Map<string, FileChangeDefinition[]>();

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

      const barrel = barrels.get(targetFilePath);

      const matchingExports = new Map<string, Set<string>>();

      barrel?.forEach((barrelPath) => {
        const value = variables.get(barrelPath);

        if (!value) {
          nestedContext.debug.warn(chalk.red('no exported variables found in'), chalk.yellow(relativePath(nestedContext, barrelPath)));
          return;
        }

        nestedContext.debug.info(chalk.green('match found in'), chalk.yellow(relativePath(nestedContext, barrelPath)));

        matchingExports.set(barrelPath, value);
      });

      node.importClause?.namedBindings?.forEachChild((node) => {
        const { isType, name } = parseImportOrExportClause(node);

        const matchingFile = Array.from(matchingExports.entries()).find(([, value]) => value.has(name));

        if (!matchingFile) {
          nestedContext.debug.error(chalk.red('no matching file found for', name));
          return;
        }

        let newImportPath = path.relative(path.dirname(file), matchingFile[0]).replace(/.ts$/, '');

        // if it does not start with ., add ./ to make it relative
        if (!newImportPath.startsWith('.')) {
          newImportPath = `./${newImportPath}`;
        }

        nestedContext.debug.debug(chalk.green('replace:'), chalk.gray(importPath), '->', chalk.green(newImportPath));

        addToMapSet(newImportPath, { name, isType }, newImports);
      });

      const fileChange: FileChangeDefinition = {
        old: node.getText(),
        new: formatImportStatements(newImports).join('\n'),
      };

      if (fileChange.new === '') {
        nestedContext.debug.warn(chalk.red('EMPTY REPLACEMENT!'));
        return;
      }

      addToMapArray(file, fileChange, fileChanges);
    });
  });

  return fileChanges;
};
