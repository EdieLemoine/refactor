import type {
  CommandContext,
  ImportOrExportStatementDefinition,
  FileUpdateDefinition,
  FileModificationDefinition,
  RefactorOptions,
} from '../types.ts';
import {extendContext} from '../utils/extendContext.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import * as ts from 'typescript';
import {resolveExportPath} from '../utils/resolveExportPath.ts';
import {extendDebugger} from '../utils/extendDebugger.ts';
import {toRelative} from '../utils/toRelative.ts';
import chalk from 'chalk';
import {parseImportOrExportClause} from '../utils/parseImportOrExportClause.ts';
import {formatImportOrExportStatements} from '../utils/formatImportOrExportStatements.ts';
import {addToMapSet} from '../utils/addToMapSet.ts';
import {formatImportOrExportPath} from '../utils/formatImportOrExportPath.ts';
import {getExportsFromBarrel} from '../utils/getExportsFromBarrel.ts';
import {FileChange} from '../constants.ts';
import {createBoxPrefix} from '../utils/createBoxPrefix.ts';

export const scanExports = (inputContext: CommandContext<RefactorOptions>, barrels: Map<string, Set<string>>, variables: Map<string, Set<string>>): FileModificationDefinition[] => {
  const context = extendContext(inputContext, 'scanExports');
  const rootBarrelPath = context.options.rootBarrel ?? '';

  const { debug } = context;

  if (!barrels.has(toRelative(context, rootBarrelPath))) {
    debug.debug(chalk.gray('no entry barrel file'));
    return [];
  }

  const sourceFile = createSourceFile(context, rootBarrelPath);

  const exports = sourceFile.statements.filter(ts.isExportDeclaration);

  // rewrite the exports to not use barrels
  return exports.map((node) => {
    const exportPath = resolveExportPath(context, node, rootBarrelPath);

    if (!exportPath) {
      debug.debug(chalk.gray('skipping export without source'));
      return;
    }

    if (!exportPath.startsWith(toRelative(context, context.inputPath))) {
      debug.debug(chalk.gray('skipping external export'));
      return;
    }

    const nestedDebug = extendDebugger(context, exportPath);
    const newExportPath = formatImportOrExportPath(exportPath);

    nestedDebug.debug('exporting from', chalk.yellowBright(newExportPath));

    const newExports = new Map<string, Set<ImportOrExportStatementDefinition>>();

    const barrel = barrels.get(exportPath);
    const matchingExports = getExportsFromBarrel(context, variables, barrel);

    nestedDebug.debug(chalk.yellow('parsing:'), chalk.cyan(node.getText()));

    // Named exports
    if (node.exportClause) {
      node.exportClause?.forEachChild((childNode) => {
        const { name, isType } = parseImportOrExportClause(childNode);

        // Search in the barrels and the variables to find the matching file
        const matchingFile = [
          ...Array.from(matchingExports.entries()),
          ...Array.from(variables.entries()),
        ].find(([, value]) => value.has(name));

        if (!matchingFile) {
          nestedDebug.error(chalk.red('(exports) no matching file found for', name));

          return;
        }

        const newExportPath = formatImportOrExportPath(toRelative(context, matchingFile[0]));

        addToMapSet(newExportPath, { name, isType }, newExports);
        nestedDebug.debug(chalk.green('found file for', name, '->', newExportPath));
      });
    } else {
      matchingExports.forEach((exportedVariables, filePath) => {
        const newExportPath = formatImportOrExportPath(toRelative(context, filePath));

        let i = 0;

        nestedDebug.debug(chalk.green('exporting from'), chalk.cyan(filePath));

        exportedVariables.forEach((variable) => {
          const boxPrefix = createBoxPrefix(i, exportedVariables.size);

          addToMapSet(newExportPath, { name: variable, isType: false }, newExports);
          nestedDebug.debug(boxPrefix, chalk.blue('export'), chalk.yellow(variable));

          i++;
        });
      });
    }

    return {
      type: FileChange.Update,
      path: rootBarrelPath,
      oldContent: node.getText(),
      newContent: formatImportOrExportStatements(context, 'export', newExports).join('\n'),
    } satisfies FileUpdateDefinition;
  }).filter(Boolean) as FileUpdateDefinition[];
};
