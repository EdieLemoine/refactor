import type {CommandContext} from '../types.ts';
import {relativePath} from '../utils/relativePath.ts';
import chalk from 'chalk';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import * as ts from 'typescript';
import {resolveExportPath} from '../utils/resolveExportPath.ts';
import {extendContext} from '../utils/extendContext.ts';

const scanFile = (context: CommandContext, file: string): {
  barrels: Set<string>,
  variables: Map<string, Set<string>>
} => {
  const barrels = new Set<string>();
  const variables = new Map<string, Set<string>>();

  const sourceFile = createSourceFile(file);

  if (file.endsWith('.vue')) {
    context.debug.debug(chalk.yellow('setting "default" as vue sfc export'));
    variables.set(file, new Set(['default']));

    return { barrels, variables };
  }

  sourceFile.statements.forEach((node) => {
    // Standalone export statements
    if (ts.isExportDeclaration(node)) {
      if (!node.moduleSpecifier) {
        context.debug.debug(chalk.gray('skipping export without module specifier'));
        return;
      }

      const targetFilePath = resolveExportPath(context, node, file);

      if (targetFilePath.endsWith(context.options.barrelFilename)) {
        const { barrels: nestedBarrels, variables: nestedVariables } = scanFile(context, targetFilePath);

        nestedBarrels.forEach(barrels.add, barrels);

        nestedVariables.forEach((value, key) => {
          variables.set(key, new Set([...(variables.get(key) || []), ...value]));
        });

        return;
      }

      const resolvedExportPath = resolveExportPath(context, node, file);

      context.debug.debug('exports from:', chalk.yellowBright(relativePath(context, resolvedExportPath)));

      barrels.add(resolvedExportPath);
    } else {
      // Any other statement. Check if it is an exported variable.
      const nodeText = node.getText();
      const match = /^export (const|let|var|type|interface|class|abstract class|function|enum) (\w+)/.exec(nodeText);
      const isExported = !!match;

      if (!isExported) {
        return undefined;
      }

      const type = match[1];
      const name = match[2];

      context.debug.debug('exported node:', chalk.red(type), chalk.yellowBright(name));

      variables.set(file, new Set([...(variables.get(file) || []), name]));
    }
  });

  return { barrels, variables };
};

export const scanFileExports = (inputContext: CommandContext, file: string): {
  barrels: Set<string>,
  variables: Map<string, Set<string>>
} => {
  const context = extendContext(inputContext, relativePath(inputContext, file));

  if (file.endsWith('.d.ts')) {
    context.debug.info(chalk.gray('skipping declaration file'));

    return { barrels: new Set(), variables: new Map<string, Set<string>>() };
  }

  const { barrels, variables } = scanFile(context, file);

  barrels.forEach((barrelPath) => {
    const nestedContext = extendContext(context, relativePath(context, barrelPath));

    nestedContext.debug.info(chalk.cyan('parsing nested barrel:', relativePath(nestedContext, barrelPath)));

    const { barrels: nestedBarrels, variables: nestedVariables } = scanFile(nestedContext, barrelPath);

    nestedBarrels.forEach(barrels.add, barrels);

    nestedVariables.forEach((value, key) => {
      variables.set(key, new Set([...(variables.get(key) || []), ...value]));
    });
  });

  return { barrels, variables };
};
