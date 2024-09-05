import type {CommandContext, BaseOptions} from '../types.ts';
import {extendDebugger} from './extendDebugger.ts';

export const extendContext = <Options extends BaseOptions>(context: CommandContext<Options>, debuggerNamespace: string): CommandContext<Options> => ({
  ...context,
  debug: extendDebugger(context, debuggerNamespace),
});
