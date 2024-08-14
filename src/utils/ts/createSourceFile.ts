import * as ts from 'typescript';
import fs from 'node:fs';
import {memoize} from '../memoize.ts';
import {parse} from '@vue/compiler-sfc';

const realCreateSourceFile = (file: string): ts.SourceFile => {
  let sourceText: string;
  const fileContents = fs.readFileSync(file, 'utf-8').toString();

  if (file.endsWith('.vue')) {
    // Parse Vue SFC components
    const result = parse(fileContents);

    sourceText = result.descriptor.scriptSetup?.content ?? result.descriptor.script?.content ?? '';
  } else {
    sourceText = fileContents;
  }

  return ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );
};

export const createSourceFile = memoize(realCreateSourceFile);
