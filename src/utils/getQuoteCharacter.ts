import type {CommandContext, RefactorOptions} from '../types.ts';

export const getQuoteCharacter = (context: CommandContext<RefactorOptions>): string => context.options.singleQuotes
  ? '\''
  : '"';
