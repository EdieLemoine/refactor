import * as ts from 'typescript';
import {type Statement, type NodeArray, type ModifierLike, type Identifier} from 'typescript';

interface NodeWithNameAndModifiers extends Statement {
  readonly modifiers?: NodeArray<ModifierLike>;
  readonly name: Identifier;
}

export const isExportNode = (node: ts.Statement): node is NodeWithNameAndModifiers => {
  if (ts.isFunctionDeclaration(node)) {
    return node.name !== undefined;
  }

  return ts.isVariableStatement(node) ||
    ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) ||
    ts.isEnumDeclaration(node) || ts.isModuleDeclaration(node);
};
