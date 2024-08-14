import type {CommandContext, FileChangeMap, FileChangeDefinition, ImportOrExportStatementDefinition} from '../types.ts';
import {extendContext} from '../utils/extendContext.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import * as ts from 'typescript';
import {resolveExportPath} from '../utils/resolveExportPath.ts';
import {extendDebugger} from '../utils/extendDebugger.ts';
import {relativePath} from '../utils/relativePath.ts';
import chalk from 'chalk';
import {parseImportOrExportClause} from '../utils/parseImportOrExportClause.ts';
import {formatImportOrExportStatements} from '../utils/formatImportOrExportStatements.ts';
import {addToMapSet} from '../utils/addToMapSet.ts';
import {formatImportOrExportPath} from '../utils/formatImportOrExportPath.ts';
import {getExportsFromBarrel} from '../utils/getExportsFromBarrel.ts';

export const scanExportUpdates = (inputContext: CommandContext, barrels: Map<string, Set<string>>, variables: Map<string, Set<string>>): FileChangeMap => {
  const context = extendContext(inputContext, 'scanExports');
  const rootBarrelPath = `${context.inputPath}/${context.options.barrelFilename}`;

  const fileChanges = new Map<string, FileChangeDefinition[]>();

  if (!barrels.has(rootBarrelPath)) {
    context.debug.debug(chalk.gray('no entry barrel file'));
    return fileChanges;
  }

  const sourceFile = createSourceFile(rootBarrelPath);

  const exports = sourceFile.statements.filter(ts.isExportDeclaration);

  // rewrite the exports to not use barrels
  fileChanges.set(rootBarrelPath, exports.map((node) => {
    const exportPath = resolveExportPath(context, node, rootBarrelPath);
    const nestedDebug = extendDebugger(context, relativePath(context, exportPath));

    if (!exportPath.startsWith(context.inputPath)) {
      return;
    }

    const newExportPath = formatImportOrExportPath(relativePath(context, exportPath));

    nestedDebug.debug('exporting from', chalk.yellowBright(newExportPath));

    const newExports = new Map<string, Set<ImportOrExportStatementDefinition>>();

    const matchingExports = getExportsFromBarrel(context, variables, barrels.get(exportPath));

    node.exportClause?.forEachChild((childNode) => {
      const { name, isType } = parseImportOrExportClause(childNode);

      const matchingFile = Array.from(matchingExports.entries()).find(([, value]) => value.has(name));

      if (!matchingFile) {
        context.debug.error(chalk.red('no matching file found for', name));
        return;
      }

      const newExportPath = formatImportOrExportPath(relativePath(context, matchingFile[0]));

      addToMapSet(newExportPath, { name, isType }, newExports);
    });

    return {
      old: node.getText(),
      new: formatImportOrExportStatements(context, 'export', newExports).join('\n'),
    };
  }).filter(Boolean) as FileChangeDefinition[]);

  return fileChanges;
};
