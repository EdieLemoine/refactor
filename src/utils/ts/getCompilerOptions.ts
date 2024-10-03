import type {CommandContext, RefactorOptions} from '../../types.ts';
import ts, {type CompilerOptions} from 'typescript';
import {COMPILER_OPTIONS} from '../../constants.ts';
import {memoize} from '../memoize.ts';
import path from 'node:path';

const getCompilerOptionsRecursive = (filename: string): CompilerOptions => {
  const config = ts.readConfigFile(filename, ts.sys.readFile).config;

  if (!config.extends) {
    return config.compilerOptions;
  }

  const allExtends: string[] = Array.isArray(config.extends) ? config.extends : [config.extends];

  return allExtends.reduce((acc, extend) => {
    // No way to resolve non-relative paths currently
    if (!extend.startsWith('.')) {
      return acc;
    }

    const requirePath = path.resolve(path.dirname(filename), extend);

    return {
      ...acc,
      ...getCompilerOptionsRecursive(requirePath),
    };
  }, config.compilerOptions as CompilerOptions);
};

const memoized = memoize(((context) => {
  console.log(context.inputPath);

  const existingTsConfig = ts.findConfigFile(context.inputPath, (filename) => {
    console.log('file exists?', filename, ts.sys.fileExists(filename));

    return ts.sys.fileExists(filename);
  }, context.options.tsconfigFilename);

  return existingTsConfig
    ? getCompilerOptionsRecursive(existingTsConfig)
    : COMPILER_OPTIONS;
}) satisfies typeof getCompilerOptions, (context) => context.inputPath);

export const getCompilerOptions = (context: CommandContext<RefactorOptions>): CompilerOptions => memoized(context);

