import type { Options } from './index.js';
import { currentDirectoryInstall, siblingInstall } from './index.js';

export function execute(options: Options): Promise<void> {
  if (options.targetSiblings) {
    return siblingInstall();
  } else {
    return currentDirectoryInstall(options);
  }
}
