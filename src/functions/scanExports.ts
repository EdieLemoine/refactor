import type {
  CommandContext,
  FileUpdateDefinition,
  FileModificationDefinition,
  RefactorOptions,
  NamedImportOrExportStatement,
  ExportStatementDefinition,
} from '../types.ts';
import {extendContext} from '../utils/extendContext.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import * as ts from 'typescript';
import {resolveExportPath} from '../utils/resolveExportPath.ts';
import {extendDebugger} from '../utils/extendDebugger.ts';
import {toRelative} from '../utils/toRelative.ts';
import chalk from 'chalk';
import {parseImportOrExportClause} from '../utils/parseImportOrExportClause.ts';
import {addToMapSet} from '../utils/addToMapSet.ts';
import {formatImportOrExportPath} from '../utils/formatImportOrExportPath.ts';
import {getExportsFromBarrel} from '../utils/getExportsFromBarrel.ts';
import {FileChange, ImportExportStatementType} from '../constants.ts';
import {createBoxPrefix} from '../utils/createBoxPrefix.ts';
import {formatExportStatements} from '../utils/formatExportStatements.ts';

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

    const newExports = new Map<string, Set<ExportStatementDefinition>>();

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

        console.log({ newExportPath, name, isType });

        addToMapSet(newExportPath, { type: ImportExportStatementType.Named, name, isType }, newExports);
        nestedDebug.debug(chalk.green('found file for', name, '->', newExportPath));
      });
    } else {
      matchingExports.forEach((exportedVariables, filePath) => {
        const newExportPath = formatImportOrExportPath(toRelative(context, filePath));

        let i = 0;

        nestedDebug.debug(chalk.green('exporting from'), chalk.cyan(filePath));

        const foundExports: NamedImportOrExportStatement[] = [];

        exportedVariables.forEach((variable) => {
          const boxPrefix = createBoxPrefix(i, exportedVariables.size);

          console.log({ newExportPath, variable });

          foundExports.push({ type: ImportExportStatementType.Named, isType: false, name: variable });
          nestedDebug.debug(boxPrefix, chalk.blue('export'), chalk.yellow(variable));

          i++;
        });

        // if everything was exported, export '*' instead
        if (context.options.allExports && foundExports.length === exportedVariables.size) {
          const isType = foundExports.every((value) => value.isType);

          addToMapSet(newExportPath, {
            type: ImportExportStatementType.All,
            isType,
          }, newExports);

          nestedDebug.debug(chalk.green(`exporting all ${isType ? 'as type ' : ''}from`), chalk.cyan(filePath));
        } else {
          foundExports.forEach((value) => addToMapSet(newExportPath, value, newExports));
        }
      });
    }

    return {
      type: FileChange.Update,
      path: rootBarrelPath,
      oldContent: node.getText(),
      newContent: formatExportStatements(context, newExports).join('\n'),
    } satisfies FileUpdateDefinition;
  }).filter(Boolean) as FileUpdateDefinition[];
};
