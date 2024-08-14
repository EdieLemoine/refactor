import type {CommandContext} from '../types.ts';
import {extendDebugger} from './extendDebugger.ts';

export const extendContext = (context: CommandContext, debuggerNamespace: string): CommandContext => ({
  ...context,
  debug: extendDebugger(context, debuggerNamespace),
});
