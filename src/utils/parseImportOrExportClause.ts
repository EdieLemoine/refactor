import * as ts from 'typescript';
import type {ImportOrExportStatementDefinition} from '../types.ts';

export const parseImportOrExportClause = (node: ts.Node): ImportOrExportStatementDefinition => {
  const nodeText = node.getText();
  const match = /^(type )?(\w+)/.exec(nodeText);
  const isType = Boolean(match?.[1]?.trim());
  const name = match?.[2]?.trim();

  if (!name) {
    throw new Error('could not extract name from ' + nodeText);
  }

  return { isType, name };
};
