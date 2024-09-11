import ts from 'typescript';
import fs from 'node:fs';
import {parse} from '@vue/compiler-sfc';
import type {CommandContext, RefactorOptions} from '../../types.ts';
import {toAbsolute} from '../toAbsolute.ts';
import {memoize} from '../memoize.ts';

const memoized = memoize(((context, file) => {
  const resolvedPath = toAbsolute(context, file);

  let sourceText: string;
  const fileContents = fs.readFileSync(resolvedPath, 'utf-8').toString();

  if (resolvedPath.endsWith('.vue')) {
    // Parse Vue SFC components
    const result = parse(fileContents);

    sourceText = result.descriptor.scriptSetup?.content ?? result.descriptor.script?.content ?? '';
  } else {
    sourceText = fileContents;
  }

  return ts.createSourceFile(
    resolvedPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );
}) satisfies typeof createSourceFile, (context, file) => `${context.inputPath}:${file}`);

export const createSourceFile = (context: CommandContext<RefactorOptions>, file: string): ts.SourceFile => {
  return memoized(context, file);
};
