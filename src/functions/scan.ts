import type {CommandContext, BarrelsAndVariables, RefactorOptions} from '../types.ts';
import {glob} from 'fast-glob';
import {BASE_IGNORES} from '../constants.ts';
import {extendContext} from '../utils/extendContext.ts';
import {toRelative} from '../utils/toRelative.ts';
import chalk from 'chalk';

import {scanFileExports} from './scan/scanFileExports.ts';

export const scan = (inputContext: CommandContext<RefactorOptions>): BarrelsAndVariables => {
  const context = extendContext(inputContext, 'scan');

  const barrelFiles = glob.sync(`./**/${context.options.barrelFilename}`, {
    absolute: true,
    cwd: context.inputPath,
    ignore: BASE_IGNORES,
  });

  const allBarrels = new Map<string, Set<string>>();
  const allVariables = new Map<string, Set<string>>();

  if (!barrelFiles.length) {
    context.debug.info(chalk.yellow('no barrel files found'));

    return {
      barrels: allBarrels,
      variables: allVariables,
    };
  }

  context.options.rootBarrel = barrelFiles[0];

  barrelFiles.forEach((filePath) => {
    const relativeFilePath = toRelative(context, filePath);

    const { barrels, variables } = scanFileExports(context, filePath);

    allBarrels.set(relativeFilePath, barrels);

    variables.forEach((value, key) => {
      allVariables.set(key, new Set([...(allVariables.get(key) || []), ...value]));
    });
  });

  return {
    barrels: allBarrels,
    variables: allVariables,
  };
};
