import fs from 'node:fs';
import * as ts from 'typescript';

export const executeFileWrite = (filePath: string, oldSource: string, newSource: string): void => {
  if (filePath.endsWith('.vue')) {
    const fullSource = fs.readFileSync(filePath, 'utf8');

    fs.writeFileSync(filePath, fullSource.replace(oldSource, newSource));
  } else {

    ts.sys.writeFile(filePath, newSource);
  }
};
