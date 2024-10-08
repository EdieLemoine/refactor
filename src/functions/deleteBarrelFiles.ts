import type {CommandContext, RefactorOptions} from '../types.ts';
import {extendDebugger} from '../utils/extendDebugger.ts';
import fs from 'node:fs';
import {extendContext} from '../utils/extendContext.ts';
import {createSourceFile} from '../utils/ts/createSourceFile.ts';
import * as ts from 'typescript';
import chalk from 'chalk';
import {isRootBarrel} from '../utils/isRootBarrel.ts';
import {toAbsolute} from '../utils/toAbsolute.ts';

export const deleteBarrelFiles = (inputContext: CommandContext<RefactorOptions>, barrels: Map<string, Set<string>>): void => {
  const context = extendContext(inputContext, 'delete');

  const { dryRun } = context.options;
  const { debug } = context;

  if (dryRun) {
    debug.debug('Dry run enabled, not actually making changes');
  }

  barrels.forEach((_, barrelFile) => {
    const absoluteBarrelPath = toAbsolute(context, barrelFile);
    const nestedDebug = extendDebugger(context, barrelFile);

    if (isRootBarrel(context, barrelFile)) {
      nestedDebug.debug(chalk.gray('skipping entry barrel file'));
      return;
    }

    // determine if this barrel is safe to delete
    const sourceFile = createSourceFile(context, barrelFile);

    const statementsToKeep = sourceFile.statements.filter((statement) => {
      if (!ts.isExportDeclaration(statement)) {
        nestedDebug.debug(chalk.gray('keeping non-export statement'));
        return true;
      }

      if (statement.exportClause) {
        nestedDebug.debug(chalk.gray('keeping non-* export clause'));
        return true;
      }

      return false;
    });

    if (statementsToKeep.length > 0) {
      nestedDebug.debug(chalk.yellow('removing barrel exports from file'));

      if (dryRun) {
        return;
      }

      // rewrite files with only these lines
      const newSourceFile = ts.factory.updateSourceFile(sourceFile, statementsToKeep);

      fs.writeFileSync(absoluteBarrelPath, newSourceFile.getText());

      return;
    }

    nestedDebug.info(chalk.red('deleting file'));

    if (dryRun) {
      return;
    }

    fs.rmSync(absoluteBarrelPath);
  });
};
