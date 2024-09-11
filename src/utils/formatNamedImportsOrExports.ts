import type {NamedImportOrExportStatement, CommandContext, RefactorOptions} from '../types.ts';
import {getQuoteCharacter} from './getQuoteCharacter.ts';

export const formatNamedImportsOrExports = (context: CommandContext<RefactorOptions>, keyword: 'import' | 'export', statements: [string, Set<NamedImportOrExportStatement>][]): string[] => {
  const quoteCharacter = getQuoteCharacter(context);

  // sort by whether it's a single import/export or multiple, and then by filename
  const sorted = statements
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

    const isTypeOnly = valuesArray.every(({ isType }) => isType);
    const typeKeyword = isTypeOnly ? ' type' : '';

    const imports = valuesArray
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name, isType }) => {
        if (isTypeOnly) {
          return name;
        }

        return isType ? `type ${name}` : name;
      });

    const prefix = `${keyword}${typeKeyword} {`;
    const suffix = `} from ${quoteCharacter}${filePath}${quoteCharacter};`;

    const newString = `${prefix}${imports.join(', ')}${suffix}`;

    if (newString.length <= context.options.lineWidth) {
      return newString;
    }

    return [prefix, ...imports.map((name) => `  ${name},`), suffix].join('\n');
  });
};
