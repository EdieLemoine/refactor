import type {
  CommandContext,
  RefactorOptions,
  ExportStatementDefinition,
  AllExportStatement,
  NamedImportOrExportStatement,
} from '../types.ts';
import {formatNamedImportsOrExports} from './formatNamedImportsOrExports.ts';
import {ImportExportStatementType} from '../constants.ts';
import {getQuoteCharacter} from './getQuoteCharacter.ts';

export const formatExportStatements = (
  context: CommandContext<RefactorOptions>,
  exportStatements: Map<string, Set<ExportStatementDefinition>>,
): string[] => {
  const quoteCharacter = getQuoteCharacter(context);

  const all: [string, Set<AllExportStatement>][] = [];
  const named: [string, Set<NamedImportOrExportStatement>][] = [];

  exportStatements.forEach((set, name) => {
    const firstEntry = [...set][0];

    if (set.size === 1 && firstEntry?.type === ImportExportStatementType.All) {
      all.push([name, set as Set<AllExportStatement>]);
    } else {
      named.push([name, set as Set<NamedImportOrExportStatement>]);
    }
  });

  const allExports = all.map(([name, set]) => {
    const firstEntry = [...set][0];

    if (!firstEntry) {
      return '';
    }

    return `export * from ${quoteCharacter}${name}${quoteCharacter};`;
  });

  return [...allExports, ...formatNamedImportsOrExports(context, 'export', named)];
};
