import type {CommandContext} from '../types.ts';
import * as ts from 'typescript';
import path from 'node:path';
import {COMPILER_OPTIONS} from '../constants.ts';

export const getTargetFilePath = (context: CommandContext, moduleTextPath: string, file: string): string => {
  const resolvedFilePath = ts.resolveModuleName(moduleTextPath, file, COMPILER_OPTIONS, ts.sys).resolvedModule?.resolvedFileName;

  if (!resolvedFilePath) {
    const manualPath = path.resolve(path.dirname(file), moduleTextPath);
    context.debug.debug('manually resolved path:', manualPath);
    return manualPath;
  }

  return resolvedFilePath;
};
