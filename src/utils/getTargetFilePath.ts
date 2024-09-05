import type {CommandContext} from '../types.ts';
import * as ts from 'typescript';
import path from 'node:path';
import {COMPILER_OPTIONS} from '../constants.ts';
import {toAbsolute} from './toAbsolute.ts';

export const getTargetFilePath = (context: CommandContext, moduleTextPath: string, file: string): string => {

  const resolvedFilePath = ts.resolveModuleName(moduleTextPath, toAbsolute(context, file), COMPILER_OPTIONS, ts.sys).resolvedModule?.resolvedFileName;

  if (!resolvedFilePath) {
    const dirnamed = path.dirname(file);

    const manualPath = path.resolve(dirnamed, moduleTextPath);

    context.debug.debug('manually resolved path:', manualPath);
    return manualPath;
  }

  return resolvedFilePath;
};
