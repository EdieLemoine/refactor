import type {CommandContext} from '../types.ts';
import * as ts from 'typescript';
import {getTargetFilePath} from './getTargetFilePath.ts';
import {toRelative} from './toRelative.ts';

export const resolveExportPath = (context: CommandContext, node: ts.ExportDeclaration, file: string): string | null => {
  if (!node.moduleSpecifier) {
    return null;
  }

  const textPath = node.moduleSpecifier?.getText()
    .replace(/['"]/g, '');

  if (!textPath) {
    throw new Error('could not resolve module path: ' + node.getText());
  }

  return toRelative(context, getTargetFilePath(context, textPath, file));
};
