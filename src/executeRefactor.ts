import type {LiftoffEnv} from 'liftoff';
import type {RefactorOptions, FileChangeDefinition} from './types.ts';
import {createDebugger} from './utils/createDebugger.ts';
import {TITLE} from './constants.ts';
import {createContext} from './utils/createContext.ts';
import {scan} from './functions/scan.ts';
import {scanImportUpdates} from './functions/scanImportUpdates.ts';
import {write} from './functions/write.ts';
import {deleteBarrelFiles} from './functions/deleteBarrelFiles.ts';
import {scanExportUpdates} from './functions/scanExportUpdates.ts';

export const executeRefactor = async (env: LiftoffEnv, inputPath: string, options: RefactorOptions): Promise<void> => {
  const debug = createDebugger(TITLE, options);
  const context = createContext(env, inputPath, options, debug);

  const { barrels, variables } = scan(context);

  const importUpdates = scanImportUpdates(context, barrels, variables);
  const exportUpdates = scanExportUpdates(context, barrels, variables);

  process.exit(0);

  const fileUpdates: Map<string, FileChangeDefinition[]> = new Map([...importUpdates, ...exportUpdates]);

  write(context, fileUpdates);

  deleteBarrelFiles(context, barrels);
};

