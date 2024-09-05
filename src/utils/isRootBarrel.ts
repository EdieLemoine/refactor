import type {CommandContext, RefactorOptions} from '../types.ts';
import {toRelative} from './toRelative.ts';

export const isRootBarrel = (context: CommandContext<RefactorOptions>, barrelFile: string): boolean => {
  if (!context.options.rootBarrel) {
    return false;
  }

  return toRelative(context, barrelFile) === toRelative(context, context.options.rootBarrel);
};
