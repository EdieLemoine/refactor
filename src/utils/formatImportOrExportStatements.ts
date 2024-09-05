import type {CommandContext, ImportOrExportStatementDefinition, RefactorOptions} from '../types.ts';
import {getQuoteCharacter} from './getQuoteCharacter.ts';

export const formatImportOrExportStatements = (
  context: CommandContext<RefactorOptions>,
  keyword: 'export' | 'import',
  importsOrExports: Map<string, Set<ImportOrExportStatementDefinition>>,
): string[] => {
  const quoteCharacter = getQuoteCharacter(context);

  // sort by whether it's a single import/export or multiple, and then by filename
  const sorted = [...importsOrExports]
    .toSorted(([filePathA, valuesA], [filePathB, valuesB]) => {
      if (valuesA.size === 1 && valuesB.size > 1) {
        return -1;
      }

      if (valuesA.size > 1 && valuesB.size === 1) {
        return 1;
      }

      return filePathA.localeCompare(filePathB);
    });

  return sorted.map(([filePath, importedValues]) => {
    const valuesArray = [...importedValues];

    const isTypeOnly = keyword === 'export' && valuesArray.every(({ isType }) => isType);
    const typeKeyword = isTypeOnly ? ' type' : '';

    const imports = valuesArray
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name, isType }) => {
        if (isTypeOnly) {
          return name;
        }

        return isType ? `type ${name}` : name;
      });

    const newString = `${keyword}${typeKeyword} {${imports.join(', ')}} from ${quoteCharacter}${filePath}${quoteCharacter};`;

    if (newString.length <= context.options.lineWidth) {
      return newString;
    }

    return [
      `${keyword}${typeKeyword} {`,
      ...imports.map((name) => `  ${name},`),
      `} from ${quoteCharacter}${filePath}${quoteCharacter};`,
    ].join('\n');
  });
};
