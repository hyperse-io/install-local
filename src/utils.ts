import os from 'os';
import path from 'path';
import { rimraf } from 'rimraf';
import uniqid from 'uniqid';
import { type ExecOptions, execute } from '@hyperse/exec-program';

export function del(filename: string) {
  return rimraf(filename);
}

export function getRandomTmpDir(prefix: string): string {
  return path.resolve(os.tmpdir(), uniqid(prefix));
}

/**
 * redefined execa function, in order to we can mock it in test
 * @returns
 */
export function execa<T extends ExecOptions>(
  file: string,
  args?: readonly string[] | undefined,
  options?: T | undefined
) {
  return execute(file, args, options);
}
