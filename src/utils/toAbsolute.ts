import type {CommandContext} from '../types.ts';
import path from 'node:path';

export const toAbsolute = (context: CommandContext, file: string): string => path.resolve(context.inputPath, file);
