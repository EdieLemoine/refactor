import * as ts from 'typescript';
import fs from 'node:fs';
import {memoize} from '../memoize.ts';

const realCreateSourceFile = (file: string): ts.SourceFile => {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file).toString(),
    ts.ScriptTarget.Latest,
    true,
  );
};

export const createSourceFile = memoize(realCreateSourceFile);
