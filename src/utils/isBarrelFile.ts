import type {CommandContext, RefactorOptions} from '../types.ts';

export const isBarrelFile = (context: CommandContext<RefactorOptions>, targetFilePath: string): boolean => targetFilePath.endsWith(context.options.barrelFilename);
