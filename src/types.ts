export interface Package {
  directory: string;
  packageJson: PackageJson;
}

export interface InstallTarget extends Package {
  sources: Package[];
}

export interface PackageJson {
  name: string;
  version: string;
  localDependencies?: Dependencies;
  devDependencies?: Dependencies;
  dependencies?: Dependencies;
}

export interface Dependencies {
  [name: string]: string;
}
