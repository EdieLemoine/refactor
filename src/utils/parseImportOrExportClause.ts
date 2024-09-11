import * as ts from 'typescript';
import type {NamedImportOrExportStatement} from '../types.ts';
import {ImportExportStatementType} from '../constants.ts';

export const parseImportOrExportClause = (node: ts.Node): NamedImportOrExportStatement => {
  const parentTypeMatch = node.parent?.parent?.getText().match(/^(?:import|export)\s+type/);

  const nodeText = node.getText();
  const match = /^(type )?(\w+)/.exec(nodeText);

  const isType = Boolean(parentTypeMatch?.[0] || match?.[1]?.trim());
  const name = match?.[2]?.trim();

  if (!name) {
    throw new Error('could not extract name from ' + nodeText);
  }

  return { type: ImportExportStatementType.Named, isType, name };
};
