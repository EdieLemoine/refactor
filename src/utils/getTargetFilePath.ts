import type {CommandContext} from '../types.ts';
import path from 'node:path';
import {toAbsolute} from './toAbsolute.ts';
import {getCompilerOptions} from './ts/getCompilerOptions.ts';
import ts from 'typescript';
import {memoize} from './memoize.ts';

const memoized = memoize(((context, moduleTextPath, file) => {
  const compilerOptions = getCompilerOptions(context);
  const absolutePath = toAbsolute(context, file);

  const moduleName = ts.resolveModuleName(moduleTextPath, absolutePath, compilerOptions, ts.sys);

  const resolvedFilePath = moduleName?.resolvedModule?.resolvedFileName;

  if (!resolvedFilePath) {
    const dirname = path.dirname(file);
    const manualPath = path.resolve(dirname, moduleTextPath);

    context.debug.debug('manually resolved path:', manualPath);
    return manualPath;
  }

  return resolvedFilePath;
}) satisfies typeof getTargetFilePath, (_, moduleTextPath, file) => `${moduleTextPath}:${file}`);

export const getTargetFilePath = (context: CommandContext, moduleTextPath: string, file: string): string => {
  return memoized(context, moduleTextPath, file);
};
