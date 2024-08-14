import type {CommandContext, BarrelsAndVariables} from '../types.ts';
import {scanFileExports} from './parseFile.ts';
import {glob} from 'fast-glob';
import {BASE_IGNORES} from '../constants.ts';
import {extendContext} from '../utils/extendContext.ts';

export const scan = (inputContext: CommandContext): BarrelsAndVariables => {
  const context = extendContext(inputContext, 'scan');

  const barrelFiles = glob.sync(`${context.inputPath}/**/${context.options.barrelFilename}`, { ignore: BASE_IGNORES });

  const allBarrels = new Map<string, Set<string>>();
  const allVariables = new Map<string, Set<string>>();

  barrelFiles.forEach((file) => {
    const { barrels, variables } = scanFileExports(context, file);

    allBarrels.set(file, barrels);

    variables.forEach((value, key) => {
      allVariables.set(key, new Set([...(allVariables.get(key) || []), ...value]));
    });
  });

  return {
    barrels: allBarrels,
    variables: allVariables,
  };
};
