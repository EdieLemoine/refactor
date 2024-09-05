import type {CommandContext} from '../types.ts';
import path from 'node:path';

export const toRelative = (context: CommandContext, filePath: string) => {
  if (path.isAbsolute(filePath)) {
    return path.relative(context.inputPath, filePath);
  }

  return filePath.replace(new RegExp(`^${context.inputPath}/?`), '');
};
