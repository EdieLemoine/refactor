import createDebug from 'debug';
import type {CustomDebugger, BaseOptions} from '../types.ts';
import {extendDebuggerFunctions} from './extendDebuggerFunctions.ts';

export const createDebugger = (namespace: string, options: BaseOptions): CustomDebugger => {
  const debug = createDebug(namespace);

  debug.enabled = !options.quiet;

  return extendDebuggerFunctions(options, debug);
};
