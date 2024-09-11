import type {CommandContext, RefactorOptions} from '../../types.ts';
import {createSourceFile} from '../../utils/ts/createSourceFile.ts';
import {toRelative} from '../../utils/toRelative.ts';
import chalk from 'chalk';
import * as ts from 'typescript';
import {resolveExportPath} from '../../utils/resolveExportPath.ts';
import {createBoxPrefix} from '../../utils/createBoxPrefix.ts';
import {isExportNode} from '../../utils/ts/isExportNode.ts';
import {trimText} from '../../utils/trimText.ts';

export const scanFile = (context: CommandContext<RefactorOptions>, file: string, prefix: string = ''): {
  barrels: Set<string>,
  variables: Map<string, Set<string>>
} => {
  const barrels = new Set<string>();
  const variables = new Map<string, Set<string>>();

  const sourceFile = createSourceFile(context, file);
  const relativePath = toRelative(context, file);

  const { debug } = context;

  if (file.endsWith('.vue')) {
    debug.debug(prefix + chalk.cyan('setting "default" as vue sfc export'));
    variables.set(relativePath, new Set(['default']));

    return { barrels, variables };
  }

  debug.debug(prefix + chalk.magenta('scanning file:'), chalk.yellowBright(relativePath));

  sourceFile.statements.forEach((node, index) => {
    const nodeText = node.getText();
    const boxPrefix = prefix + createBoxPrefix(index, sourceFile.statements.length);

    // Standalone export statements
    if (ts.isExportDeclaration(node)) {
      if (!node.moduleSpecifier) {
        debug.debug(boxPrefix, chalk.gray('skipping export without module specifier'));
        return;
      }

      const resolvedExportPath = resolveExportPath(context, node, file);

      if (!resolvedExportPath) {
        debug.debug(boxPrefix, chalk.gray('skipping export without source'));
        return;
      }

      if (resolvedExportPath.endsWith(context.options.barrelFilename)) {
        const { barrels: nestedBarrels, variables: nestedVariables } = scanFile(context, resolvedExportPath);

        nestedBarrels.forEach(barrels.add, barrels);

        nestedVariables.forEach((value, key) => {
          variables.set(key, new Set([...(variables.get(key) || []), ...value]));
        });

        debug.debug(boxPrefix, chalk.green('exporting from barrel:'), chalk.cyanBright(resolvedExportPath));

        return;
      }

      debug.debug(boxPrefix, chalk.green('exports from:'), chalk.cyanBright(resolvedExportPath));

      barrels.add(resolvedExportPath);
    } else if (isExportNode(node)) {
      const isExported = node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

      if (!isExported) {
        debug.debug(boxPrefix, chalk.gray('skipping non-exported node:', trimText(nodeText)));
        return;
      }

      const declarations = ts.isVariableStatement(node) ? [...node.declarationList.declarations] : [node];

      declarations.forEach((declaration) => {
        const name = declaration.name.getText();

        debug.debug(boxPrefix, chalk.green('exports'), chalk.yellowBright(name));

        variables.set(relativePath, new Set([...(variables.get(file) || []), name]));
      });
    } else {
      debug.debug(boxPrefix, chalk.gray('skipping non-export statement:', trimText(nodeText)));
    }
  });

  return { barrels, variables };
};
