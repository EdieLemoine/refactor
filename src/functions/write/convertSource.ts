import type {CommandContext, RefactorOptions, FileUpdateDefinition} from '../../types.ts';
import chalk from 'chalk';

export const convertSource = ({ debug }: CommandContext<RefactorOptions>, source: string, fileUpdates: FileUpdateDefinition[]): string => {
  let newSource = source;

  fileUpdates.forEach(({ oldContent, newContent }) => {
    newSource = newSource.replace(oldContent, newContent);

    if (newContent === oldContent) {
      debug.info(chalk.yellow('no changes to make'));
    } else if (newContent === '') {
      debug.info(chalk.red('removing statement:', chalk.gray(oldContent)));
    } else {
      debug.debug(chalk.gray(oldContent), '->', chalk.yellow(newContent));
    }
  });

  // Remove extra newlines
  return newSource.replace(/\n{3,}/g, '\n\n');
};
