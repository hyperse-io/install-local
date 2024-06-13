import { currentDirectoryInstall, Options, siblingInstall } from './index.js';

export function execute(options: Options): Promise<void> {
  if (options.targetSiblings) {
    return siblingInstall();
  } else {
    return currentDirectoryInstall(options);
  }
}
