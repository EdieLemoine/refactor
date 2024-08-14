/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Debugger} from 'debug';
import type {LiftoffEnv} from 'liftoff';

export interface RefactorOptions {
  barrelFilename: string;
  dryRun: boolean;
  quiet: boolean;
  sourceGlob: string;
  verbose: number;
}

export type FileChangeDefinition = { old: string; new: string; };

export interface CommandContext {
  debug: CustomDebugger,
  env: LiftoffEnv,
  inputPath: string;
  options: RefactorOptions
}

export interface BarrelsAndVariables {
  barrels: Map<string, Set<string>>,
  variables: Map<string, Set<string>>
}

export interface ImportOrExportStatementDefinition {
  isType: boolean
  name: string,
}

export interface CustomDebugger extends Debugger {
  debug(formatter: any, ...args: any[]): void;

  error(formatter: any, ...args: any[]): void;

  info(formatter: any, ...args: any[]): void;

  warn(formatter: any, ...args: any[]): void;
}

export type FileChangeMap = Map<string, FileChangeDefinition[]>;
