import type {BarrelSet, VariableMap, CommandContext} from '../types.ts';
import chalk from 'chalk';
import {toRelative} from './toRelative.ts';

export const getExportsFromBarrel = (context: CommandContext, variables: VariableMap, barrel: BarrelSet | undefined): Map<string, Set<string>> => {
  const matchingExports = new Map<string, Set<string>>();

  barrel?.forEach((barrelPath) => {
    const value = variables.get(barrelPath);

    if (!value) {
      context.debug.warn(chalk.red('no exported variables found in'), chalk.yellow(toRelative(context, barrelPath)));
      return;
    }

    context.debug.debug(chalk.green(`found ${value.size} exports in`, chalk.yellow(toRelative(context, barrelPath))));

    matchingExports.set(barrelPath, value);
  });

  return matchingExports;
};
