/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Debugger} from 'debug';
import type {LiftoffEnv} from 'liftoff';
import {FileChange, ImportExportStatementType} from './constants.ts';

export interface BaseOptions {
  quiet: boolean;
  verbose: number;
}

export interface RefactorOptions extends BaseOptions {
  allExports: boolean;
  barrelFilename: string;
  dryRun: boolean;
  lineWidth: number;
  rootBarrel?: string;
  singleQuotes: boolean;
  sourceGlob: string;
}

interface BaseFileModificationDefinition<Type extends FileChange> {
  path: string;
  type: Type;
}

export type FileDeleteDefinition = BaseFileModificationDefinition<FileChange.Delete>

export interface FileUpdateDefinition extends BaseFileModificationDefinition<FileChange.Update> {
  newContent: string,
  oldContent: string,
}

export type FileModificationDefinition = FileDeleteDefinition | FileUpdateDefinition;

export interface CommandContext<Options extends BaseOptions = BaseOptions> {
  debug: CustomDebugger,
  env: LiftoffEnv,
  inputPath: string;
  options: Options
}

export interface BarrelsAndVariables {
  barrels: Map<string, Set<string>>,
  variables: Map<string, Set<string>>
}

interface BaseImportOrExportStatement {
  isType: boolean;
}

export interface NamedImportOrExportStatement extends BaseImportOrExportStatement {
  name: string,
  type: ImportExportStatementType.Named,
}

export interface AllExportStatement extends BaseImportOrExportStatement {
  type: ImportExportStatementType.All,
}

export type ImportStatementDefinition = NamedImportOrExportStatement

export type ExportStatementDefinition = AllExportStatement | NamedImportOrExportStatement

export type ImportOrExportStatementDefinition = AllExportStatement | NamedImportOrExportStatement

export interface CustomDebugger extends Debugger {
  debug(formatter: any, ...args: any[]): void;

  error(formatter: any, ...args: any[]): void;

  info(formatter: any, ...args: any[]): void;

  warn(formatter: any, ...args: any[]): void;
}

export type FileChangeMap = Map<string, FileModificationDefinition[]>;

export type BarrelSet = Set<string>;

export type VariableSet = Set<string>;

export type BarrelMap = Map<string, BarrelSet>;

export type VariableMap = Map<string, VariableSet>;
