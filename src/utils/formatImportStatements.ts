import type {CommandContext, RefactorOptions, ImportStatementDefinition} from '../types.ts';
import {formatNamedImportsOrExports} from './formatNamedImportsOrExports.ts';

export const formatImportStatements = (
  context: CommandContext<RefactorOptions>,
  importStatements: Map<string, Set<ImportStatementDefinition>>,
): string[] => {
  return formatNamedImportsOrExports(context, 'import', [...importStatements]);
};
