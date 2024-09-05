import type {LiftoffEnv} from 'liftoff';
import type {CommandContext, CustomDebugger, BaseOptions} from '../types.ts';

export const createContext = <Options extends BaseOptions>(env: LiftoffEnv, inputPath: string, options: Options, debug: CustomDebugger): CommandContext<Options> => ({
  inputPath,
  debug,
  env,
  options,
});

