import * as ts from 'typescript';
import chalk from 'chalk';
import type {CommandContext, FileChangeMap} from '../types.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import {extendDebugger} from '../utils/extendDebugger.ts';
import {relativePath} from '../utils/relativePath.ts';
import {extendContext} from '../utils/extendContext.ts';

export const write = (inputContext: CommandContext, fileChanges: FileChangeMap): void => {
  const context = extendContext(inputContext, 'write');

  const { debug } = context;

  if (context.options.dryRun) {
    debug.debug('Dry run enabled, not actually writing files');
  }

  fileChanges.forEach((fileChanges, file) => {
    const nestedDebug = extendDebugger(context, relativePath(context, file));

    const sourceFile = createSourceFile(file);
    let newSource = sourceFile.getText();

    nestedDebug.info('writing changes...');

    fileChanges.forEach(({ old, new: newImportStatement }) => {
      newSource = newSource.replace(old, newImportStatement);

      nestedDebug.debug(chalk.gray(old), '->', chalk.yellow(newImportStatement));
    });

    if (context.options.dryRun) {
      return;
    }

    ts.sys.writeFile(file, newSource);

    nestedDebug.info('changes written to file');
  });
};
