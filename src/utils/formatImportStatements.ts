import type {ImportOrExportStatementDefinition} from '../types.ts';
import * as ts from 'typescript';

export const formatImportStatements = (newImports: Map<string, Set<ImportOrExportStatementDefinition>>): string[] => {
  return [...newImports].map(([importPath, importedValues]) => {
    const imports = [...importedValues]
      .toSorted(((a, b) => {
        if (a.isType && !b.isType) {
          return -1;
        }

        if (!a.isType && b.isType) {
          return 1;
        }

        return a.name.localeCompare(b.name);
      }))
      .map(({ name, isType }) => ts.factory.createImportSpecifier(isType, name, name));

    return ts.factory.createImportDeclaration(
      undefined,
      undefined,
      ts.factory.createNamedImports(imports),
      ts.factory.createStringLiteral(importPath),
    ).getText();

    return `import {${imports.join(', ')}} from '${importPath}';`;
  });
};
