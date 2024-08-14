/* eslint-disable @typescript-eslint/no-explicit-any */
import type {RefactorOptions, CustomDebugger} from '../types.ts';
import {type Debugger} from 'debug';

export const extendDebuggerFunctions = (options: RefactorOptions, debug: Debugger): CustomDebugger => {
  const logFromVerbosity = (verbosity: number): (formatter: any, ...args: any[]) => void => {
    return (formatter: any, ...args: any[]): void => {
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
