import { readPackageJson } from './helpers.js';
import { LocalInstaller, progress, saveIfNeeded } from './index.js';
import type { Options } from './Options.js';

export async function currentDirectoryInstall(options: Options): Promise<void> {
  const localDependencies = await readLocalDependencies(options.dependencies);
  const installer = new LocalInstaller({ '.': localDependencies });
  progress(installer);
  const targets = await installer.install();
  await saveIfNeeded(targets, options);
}

async function readLocalDependencies(
  dependenciesFromArguments: string[]
): Promise<string[]> {
  if (dependenciesFromArguments.length) {
    return dependenciesFromArguments;
  } else {
    const pkg = await readPackageJson('.');
    if (pkg.localDependencies) {
      return Object.values(pkg.localDependencies);
    } else {
      return [];
    }
  }
}
