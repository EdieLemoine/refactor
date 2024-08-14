import {type LiftoffEnv} from 'liftoff';
import {program} from 'commander';
import {executeRefactor} from './executeRefactor.ts';
import {TITLE} from './constants.ts';
import type {RefactorOptions} from './types.ts';

export const runProgram = (env: LiftoffEnv, argv: string[]): void => {
  program.name(TITLE).description('Refactor barrel files.');

  program
    .argument('[path]', 'The path to the directory to refactor.', process.cwd())
    .option('--barrel-filename', 'The glob pattern to match barrel files.', 'index.ts')
    .option('--delete', 'Delete the barrel files after refactoring.', false)
    .option('--source-glob', 'The glob pattern to match source files.', '**/*.{ts,vue}')
    .option('-d, --dry-run', 'Run the refactor without writing to disk.', false)
    .option('-v, --verbose', 'Log verbosity.', (_: string, prev: number) => prev + 1, 0)
    .option('-q, --quiet', 'Suppress output.', false)
    .option('--single-quotes', 'Use single quotes.', false)
    .action((inputPath: string, options: RefactorOptions) => executeRefactor(env, inputPath, options));

  program.parse(argv);
};
