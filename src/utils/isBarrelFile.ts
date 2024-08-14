import type {CommandContext} from '../types.ts';

export const isBarrelFile = (context: CommandContext, targetFilePath: string): boolean => targetFilePath.endsWith(context.options.barrelFilename);
