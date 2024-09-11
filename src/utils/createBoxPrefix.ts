import chalk from 'chalk';

export const createBoxPrefix = (index: number, max: number): string => {
  return chalk.gray((index + 1) === max ? '┗━' : '┣━');
};

