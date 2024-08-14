import type {CommandContext, ImportOrExportStatementDefinition} from '../types.ts';
import {getQuoteCharacter} from './getQuoteCharacter.ts';

export const formatImportOrExportStatements = (
  context: CommandContext,
  keyword: 'export' | 'import',
  importsOrExports: Map<string, Set<ImportOrExportStatementDefinition>>,
): string[] => {
  const quoteCharacter = getQuoteCharacter(context);

  const sorted = [...importsOrExports]
    .toSorted(([filePathA], [filePathB]) => filePathA.localeCompare(filePathB));

  return sorted.map(([filePath, importedValues]) => {
    const isTypeOnly = [...importedValues].every(({ isType }) => isType);

    const imports = [...importedValues]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name, isType }) => {
        if (isTypeOnly) {
          return name;
        }

        return isType ? `type ${name}` : name;
      });

    if (isTypeOnly) {
      keyword += ' type';
    }

    return `${keyword} {${imports.join(', ')}} from ${quoteCharacter}${filePath}${quoteCharacter};`;
  });
};
