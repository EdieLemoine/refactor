import type {CommandContext, FileChangeMap, FileChangeDefinition} from '../types.ts';
import {extendContext} from '../utils/extendContext.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import type {ExportSpecifier} from 'typescript';
import * as ts from 'typescript';
import {resolveExportPath} from '../utils/resolveExportPath.ts';
import {extendDebugger} from '../utils/extendDebugger.ts';
import {relativePath} from '../utils/relativePath.ts';
import chalk from 'chalk';
import {parseImportOrExportClause} from '../utils/parseImportOrExportClause.ts';

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

    const newExportPath = `./${relativePath(context, exportPath)}`;

    nestedDebug.debug('exporting from', chalk.yellowBright(newExportPath));

    const exports: ExportSpecifier[] = [];

    node.exportClause?.forEachChild((childNode) => {
      const { name, isType } = parseImportOrExportClause(childNode);

      nestedDebug.debug('child', name);

      exports.push(ts.factory.createExportSpecifier(isType, name, name));
    });

    const newExport = ts.factory.createExportDeclaration(
      undefined,
      exports.every((item) => item.isTypeOnly),
      ts.factory.createNamedExports(exports),
      ts.factory.createStringLiteral(newExportPath, true),
    );

    return {
      old: node.getText(),
      new: newExport.getText(),
    };
  }).filter(Boolean) as FileChangeDefinition[]);

  return fileChanges;
};
