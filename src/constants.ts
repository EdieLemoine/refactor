import type {CompilerOptions} from 'typescript';

export const TITLE = 'Refactinator';

export const COMPILER_OPTIONS: CompilerOptions = {
  allowArbitraryExtensions: true,
};
export const BASE_IGNORES: string[] = ['**/node_modules/**', '**/dist/**', '**/*.d.ts'];

export enum FileChange {
  Update = 'update',
  Delete = 'delete',
}
