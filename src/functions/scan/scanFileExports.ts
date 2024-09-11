import type {CommandContext, RefactorOptions} from '../../types.ts';
import {extendContext} from '../../utils/extendContext.ts';
import {toRelative} from '../../utils/toRelative.ts';
import chalk from 'chalk';
import {scanFile} from './scanFile.ts';
import {createBoxPrefix} from '../../utils/createBoxPrefix.ts';
import {createFlatBoxPrefix} from '../../utils/createFlatBoxPrefix.ts';

export const scanFileExports = (inputContext: CommandContext<RefactorOptions>, file: string): {
  barrels: Set<string>,
  variables: Map<string, Set<string>>
} => {
  const context = extendContext(inputContext, toRelative(inputContext, file));

  if (file.endsWith('.d.ts')) {
    context.debug.info(chalk.gray('skipping declaration file'));

    return { barrels: new Set(), variables: new Map<string, Set<string>>() };
  }

  const { barrels, variables } = scanFile(context, file);

  let index = 1;

  barrels.forEach((barrelPath) => {
    const boxPrefix = createBoxPrefix(index, barrels.size);

    context.debug.info(boxPrefix, chalk.cyan('parsing nested file:', barrelPath));

    const { barrels: nestedBarrels, variables: nestedVariables } = scanFile(context, barrelPath, createFlatBoxPrefix());

    nestedBarrels.forEach(barrels.add, barrels);

    nestedVariables.forEach((value, key) => {
      variables.set(key, new Set([...(variables.get(key) || []), ...value]));
    });

    index++;
  });

  return { barrels, variables };
};
