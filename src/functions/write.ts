import chalk from 'chalk';
import type {CommandContext, FileUpdateDefinition, RefactorOptions} from '../types.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import {extendDebugger} from '../utils/extendDebugger.ts';
import {extendContext} from '../utils/extendContext.ts';
import {addToMapArray} from '../utils/addToMapArray.ts';
import {executeFileWrite} from './write/executeFileWrite.ts';
import {convertSource} from './write/convertSource.ts';

export const write = (inputContext: CommandContext<RefactorOptions>, fileUpdates: FileUpdateDefinition[]): void => {
  const context = extendContext(inputContext, 'write');

  const { debug } = context;

  if (context.options.dryRun) {
    debug.debug('Dry run enabled, not actually writing files');
  }

  const groupedByFile = new Map<string, FileUpdateDefinition[]>();

  fileUpdates.forEach((fileChange) => {
    addToMapArray(fileChange.path, fileChange, groupedByFile);
  });

  groupedByFile.forEach((fileChanges, filePath) => {
    const nestedDebug = extendDebugger(context, filePath);
    const sourceFile = createSourceFile(context, filePath);

    const oldSource = sourceFile.getText();

    const newSource = convertSource(context, oldSource, fileChanges);

    if (!context.options.dryRun) {
      debug.debug('writing changes to file:', filePath);
      executeFileWrite(filePath, oldSource, newSource);
    }

    nestedDebug.debug(chalk.green('done writing changes to file'));
  });
};
