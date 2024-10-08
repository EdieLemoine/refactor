import {type LiftoffEnv} from 'liftoff';
import {program} from 'commander';
import {executeRefactor} from './executeRefactor.ts';
import {TITLE} from './constants.ts';
import type {RefactorOptions} from './types.ts';
import path from 'node:path';

export const runProgram = (env: LiftoffEnv, argv: string[]): void => {
  program.name(TITLE).description('Refactor barrel files.');

  program
    .command('refactor')
    .argument('[path]', 'The path to the directory to refactor.', (input) => path.resolve(input), process.cwd())
    .option('--barrel-filename <filename>', 'The name of the barrel file.', 'index.ts')
    .option('--tsconfig-filename <filename>', 'The name of the root tsconfig file.', 'tsconfig.json')
    .option('--delete', 'Delete the barrel files after refactoring.', false)
    .option('--source-glob', 'The glob pattern to match source files.', '**/*.{ts,vue}')
    .option('--all-exports', 'Generate * exports if all entries from a file are exported.', false)
    .option('-d, --dry-run', 'Run the refactor without writing to disk.', false)
    .option('-v, --verbose', 'Log verbosity.', (_: string, prev: number) => prev + 1, 0)
    .option('-q, --quiet', 'Suppress output.', false)
    .option('--line-width <number>', 'The maximum line width.', '120')
    .option('--single-quotes', 'Use single quotes.', false)
    .action((inputPath: string, options: RefactorOptions) => executeRefactor(env, inputPath, options));

  program.parse(argv);
};
