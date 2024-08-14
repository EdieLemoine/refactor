import type {CustomDebugger, CommandContext} from '../types.ts';
import {extendDebuggerFunctions} from './extendDebuggerFunctions.ts';

export const extendDebugger = (context: CommandContext, identifier: string): CustomDebugger => {
  const extended = context.debug.extend(identifier);

  extended.enabled = context.debug.enabled;

  return extendDebuggerFunctions(context.options, extended);
};
