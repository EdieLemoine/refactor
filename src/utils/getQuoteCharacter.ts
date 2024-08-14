import type {CommandContext} from '../types.ts';

export const getQuoteCharacter = (context: CommandContext): string => context.options.singleQuotes ? '\'' : '"';
