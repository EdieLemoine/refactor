import type {LiftoffEnv} from 'liftoff';
import type {RefactorOptions, FileUpdateDefinition} from './types.ts';
import {createDebugger} from './utils/createDebugger.ts';
import {TITLE, FileChange} from './constants.ts';
import {createContext} from './utils/createContext.ts';
import {scan} from './functions/scan.ts';
import {scanImports} from './functions/scanImports.ts';
import {write} from './functions/write.ts';
import {scanExports} from './functions/scanExports.ts';
import {deleteBarrelFiles} from './functions/deleteBarrelFiles.ts';

export const executeRefactor = async (env: LiftoffEnv, inputPath: string, options: RefactorOptions): Promise<void> => {
  const debug = createDebugger(TITLE, options);
  const context = createContext(env, inputPath, options, debug);

  const { barrels, variables } = scan(context);

  const importUpdates = scanImports(context, barrels, variables);
  const exportUpdates = scanExports(context, barrels, variables);

  const fileUpdates: FileUpdateDefinition[] = [...importUpdates, ...exportUpdates].filter((update) => update.type ===
    FileChange.Update);

  write(context, fileUpdates);

  deleteBarrelFiles(context, barrels);
};

