import type {CommandContext} from '../../types.ts';
import ts, {type CompilerOptions} from 'typescript';
import {COMPILER_OPTIONS} from '../../constants.ts';
import {memoize} from '../memoize.ts';

const getAllCompilerOptions = (filename: string): CompilerOptions => {
  const config = ts.readConfigFile(filename, ts.sys.readFile).config;
  let compilerOptions = { ...config.compilerOptions };

  const extended: string[] = Array.isArray(config.extends) ? config.extends : [config.extends];

  if (extended.length) {
    extended.forEach((extend) => {
      if (!extend.startsWith('.')) {
        return;
      }

      const requirePath = require.resolve(extend);

      compilerOptions = {
        ...compilerOptions,
        ...getAllCompilerOptions(requirePath),
      };
    });
  }

  return {
    ...compilerOptions,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    allowArbitraryExtensions: true,
  };
};

const memoized = memoize(((context) => {
  const existingTsConfig = ts.findConfigFile(context.inputPath, ts.sys.fileExists);

  return existingTsConfig
    ? getAllCompilerOptions(existingTsConfig)
    : COMPILER_OPTIONS;
}) satisfies typeof getCompilerOptions, (context) => context.inputPath);

export const getCompilerOptions = (context: CommandContext): CompilerOptions => memoized(context);

