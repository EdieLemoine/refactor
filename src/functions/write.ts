import * as ts from 'typescript';
import chalk from 'chalk';
import type {CommandContext, FileUpdateDefinition} from '../types.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import {extendDebugger} from '../utils/extendDebugger.ts';
import {relativePath} from '../utils/relativePath.ts';
import {extendContext} from '../utils/extendContext.ts';
import {addToMapArray} from '../utils/addToMapArray.ts';
import fs from 'node:fs';

export const write = (inputContext: CommandContext, fileChanges: FileUpdateDefinition[]): void => {
  const context = extendContext(inputContext, 'write');

  const { debug } = context;

  if (context.options.dryRun) {
    debug.debug('Dry run enabled, not actually writing files');
  }

  const groupedByFile = new Map<string, FileUpdateDefinition[]>();

  fileChanges.forEach((fileChange) => {
    addToMapArray(fileChange.path, fileChange, groupedByFile);
  });

  groupedByFile.forEach((fileChanges, file) => {
    const nestedDebug = extendDebugger(context, relativePath(context, file));
    const sourceFile = createSourceFile(file);

    const oldSource = sourceFile.getText();
    let newSource = oldSource;

    fileChanges.forEach(({ oldContent: oldContent, newContent: newImportStatement }) => {
      newSource = newSource.replace(oldContent, newImportStatement);

      nestedDebug.debug(chalk.gray(oldContent), '->', chalk.yellow(newImportStatement));
    });

    if (context.options.dryRun) {
      return;
    }

    // Remove extra newlines
    newSource = newSource.replace(/\n{3,}/g, '\n\n');

    if (file.endsWith('.vue')) {
      const fullSource = fs.readFileSync(file, 'utf8');

      fs.writeFileSync(file, fullSource.replace(oldSource, newSource));
    } else {
      ts.sys.writeFile(file, newSource);
    }

    nestedDebug.info('changes written to file');
  });
};
