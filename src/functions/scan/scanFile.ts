import type {CommandContext, RefactorOptions} from '../../types.ts';
import {createSourceFile} from '../../utils/ts/createSourceFile.ts';
import {toRelative} from '../../utils/toRelative.ts';
import chalk from 'chalk';
import * as ts from 'typescript';
import {resolveExportPath} from '../../utils/resolveExportPath.ts';
import {createBoxPrefix} from '../../utils/createBoxPrefix.ts';
import {isExportNode} from '../../utils/ts/isExportNode.ts';

export const scanFile = (context: CommandContext<RefactorOptions>, file: string): {
  barrels: Set<string>,
  variables: Map<string, Set<string>>
} => {
  const barrels = new Set<string>();
  const variables = new Map<string, Set<string>>();

  const sourceFile = createSourceFile(context, file);
  const relativePath = toRelative(context, file);

  if (file.endsWith('.vue')) {
    context.debug.debug(chalk.yellow('setting "default" as vue sfc export'));
    variables.set(relativePath, new Set(['default']));

    return { barrels, variables };
  }

  sourceFile.statements.forEach((node, index) => {
    const nodeText = node.getText();
    const boxPrefix = createBoxPrefix(index, sourceFile.statements.length);

    // Standalone export statements
    if (ts.isExportDeclaration(node)) {
      if (!node.moduleSpecifier) {
        context.debug.debug(chalk.gray('skipping export without module specifier'));
        return;
      }

      const resolvedExportPath = resolveExportPath(context, node, file);

      if (!resolvedExportPath) {
        context.debug.debug(chalk.gray('skipping export without source'));
        return;
      }

      if (resolvedExportPath.endsWith(context.options.barrelFilename)) {
        const { barrels: nestedBarrels, variables: nestedVariables } = scanFile(context, resolvedExportPath);

        nestedBarrels.forEach(barrels.add, barrels);

        nestedVariables.forEach((value, key) => {
          variables.set(key, new Set([...(variables.get(key) || []), ...value]));
        });

        context.debug.debug('exporting from barrel:', chalk.yellowBright(resolvedExportPath));

        return;
      }

      context.debug.debug(boxPrefix, 'exports from:', chalk.yellowBright(resolvedExportPath));

      barrels.add(resolvedExportPath);
    } else if (isExportNode(node)) {
      const isExported = node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

      if (!isExported) {
        context.debug.debug(chalk.gray('skipping non-exported node:', nodeText.slice(0, 50)));
        return;
      }

      const declarations = ts.isVariableStatement(node) ? node.declarationList.declarations : [node];

      declarations.forEach((declaration) => {
        const name = declaration.name.getText();

        context.debug.debug('exported node:', chalk.yellowBright(name));

        variables.set(relativePath, new Set([...(variables.get(file) || []), name]));
      });
    } else {
      context.debug.debug(chalk.gray('skipping non-export statement:', nodeText.replace(/\n/g, ' ').slice(0, 50)));
    }
  });

  return { barrels, variables };
};
