/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CustomDebugger, BaseOptions} from '../types.ts';
import {type Debugger} from 'debug';

export const extendDebuggerFunctions = <Options extends BaseOptions>(options: Options, debug: Debugger): CustomDebugger => {
  const logFromVerbosity = (verbosity: number): (formatter: any, ...args: any[]) => void => {
    return (formatter: any, ...args: any[]): void => {

      const filterString = (string: string): boolean => {
        return debug.namespace.includes(string) ||
          formatter?.toString().includes(string) ||
          args.toString().includes(string);
      };

      // TODO REMOVE THIS!
      if (!filterString('PdkPlatformName')) {
        return;
      }

      if (options.verbose < verbosity) {
        return;
      }

      debug(formatter, ...args);
    };
  };

  const newDebug = debug as CustomDebugger;

  newDebug.error = logFromVerbosity(0);
  newDebug.warn = logFromVerbosity(1);
  newDebug.info = logFromVerbosity(2);
  newDebug.debug = logFromVerbosity(3);

  return newDebug;
};
