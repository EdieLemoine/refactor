import type {CommandContext, RefactorOptions} from '../types.ts';
import path from 'node:path';
import {toAbsolute} from './toAbsolute.ts';
import ts from 'typescript';
import {getCompilerOptions} from './ts/getCompilerOptions.ts';
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

  if (!resolvedFilePath.startsWith('/')) {
    // Resolve the absolute path
    return toAbsolute({ ...context, inputPath: path.dirname(context.inputPath) }, resolvedFilePath);
  }

  return resolvedFilePath;
}) satisfies typeof getTargetFilePath, (_, moduleTextPath, file) => `${moduleTextPath}:${file}`);

export const getTargetFilePath = (context: CommandContext<RefactorOptions>, moduleTextPath: string, file: string): string => {
  return memoized(context, moduleTextPath, file);
};
