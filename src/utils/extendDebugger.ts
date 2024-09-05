import type {CustomDebugger, CommandContext, BaseOptions} from '../types.ts';
import {extendDebuggerFunctions} from './extendDebuggerFunctions.ts';

export const extendDebugger = <Options extends BaseOptions>(context: CommandContext<Options>, identifier: string): CustomDebugger => {
  const extended = context.debug.extend(identifier);

  extended.enabled = context.debug.enabled;

  return extendDebuggerFunctions(context.options, extended);
};
