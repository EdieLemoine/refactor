import type {LiftoffEnv} from 'liftoff';
import type {RefactorOptions, CommandContext, CustomDebugger} from '../types.ts';

export const createContext = (env: LiftoffEnv, inputPath: string, options: RefactorOptions, debug: CustomDebugger): CommandContext => ({
  inputPath,
  debug,
  env,
  options,
});

