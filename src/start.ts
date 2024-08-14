import Liftoff from 'liftoff';
import {jsVariants} from 'interpret';
import {runProgram} from './runProgram.ts';
import {TITLE} from './constants';

export const start = (): void => {
  const extensions = {
    ...jsVariants,
    ...Object.entries(jsVariants).reduce((acc, [key, value]) => ({ ...acc, [`.config${key}`]: value }), {}),
  };

  const app = new Liftoff({
    name: TITLE,
    configName: TITLE.toLowerCase(),
    processTitle: TITLE,
    extensions,
  });

  function onExecute(this: Liftoff, env: Liftoff.LiftoffEnv, argv: string[]) {
    runProgram(env, argv);
  }

  app.prepare({}, (env: Liftoff.LiftoffEnv): void => {
    app.execute(env, onExecute);
  });
};
