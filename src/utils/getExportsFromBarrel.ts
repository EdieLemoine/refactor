import type {BarrelSet, VariableMap, CommandContext} from '../types.ts';
import chalk from 'chalk';
import {relativePath} from './relativePath.ts';

export const getExportsFromBarrel = (context: CommandContext, variables: VariableMap, barrel: BarrelSet | undefined): Map<string, Set<string>> => {
  const matchingExports = new Map<string, Set<string>>();

  barrel?.forEach((barrelPath) => {
    const value = variables.get(barrelPath);

    if (!value) {
      context.debug.warn(chalk.red('no exported variables found in'), chalk.yellow(relativePath(context, barrelPath)));
      return;
    }

    context.debug.debug('found exports in', chalk.yellow(relativePath(context, barrelPath)), value);

    matchingExports.set(barrelPath, value);
  });

  return matchingExports;
};
