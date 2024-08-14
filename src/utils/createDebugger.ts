import createDebug from 'debug';
import type {RefactorOptions, CustomDebugger} from '../types.ts';
import {extendDebuggerFunctions} from './extendDebuggerFunctions.ts';

export const createDebugger = (namespace: string, options: RefactorOptions): CustomDebugger => {
  const debug = createDebug(namespace);

  debug.enabled = !options.quiet;

  return extendDebuggerFunctions(options, debug);
};
