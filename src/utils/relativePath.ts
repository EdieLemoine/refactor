import type {CommandContext} from '../types.ts';
import path from 'node:path';

export const relativePath = (context: CommandContext, filePath: string) => path.relative(context.inputPath, filePath);
