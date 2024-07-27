import { Mock } from 'vitest';
import { MockInstance } from 'vitest';
import { currentDirectoryInstall } from '../../src/currentDirectoryInstall.js';
import * as helpers from '../../src/helpers.js';
import { InstallTarget, PackageJson, saveIfNeeded } from '../../src/index.js';
import * as localInstallerModule from '../../src/LocalInstaller.js';
import * as progressModule from '../../src/progress.js';
import * as saveModule from '../../src/save.js';
import { options, packageJson } from '../helpers/producers.js';

describe('currentDirectoryInstall', () => {
  let localInstallerStub: {
    install: Mock<() => Promise<InstallTarget[]>>;
    on: Mock;
  };

  let saveIfNeededStub: MockInstance<typeof saveIfNeeded>;
  let readPackageJsonStub: MockInstance<(from: string) => Promise<PackageJson>>;
  let progressStub: MockInstance<typeof progressModule.progress>;
  beforeEach(() => {
    localInstallerStub = { install: vi.fn(), on: vi.fn() };
    // LocalInstaller is a class, so we need to mock the constructor, use `MockReturnValue` to mock the return value
    vi.spyOn(localInstallerModule, 'LocalInstaller').mockReturnValue(
      localInstallerStub as any
    );
    saveIfNeededStub = vi.spyOn(saveModule, 'saveIfNeeded');
    progressStub = vi.spyOn(progressModule, 'progress');
    readPackageJsonStub = vi.spyOn(helpers, 'readPackageJson');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should install the local dependencies if none were provided', async () => {
    readPackageJsonStub.mockResolvedValue(
      packageJson({ localDependencies: { a: '../a', b: '../b' } })
    );
    const expectedOptions = options({ dependencies: [] });
    const expectedTargets: InstallTarget[] = [
      { directory: '../a', packageJson: packageJson(), sources: [] },
    ];
    localInstallerStub.install.mockResolvedValue(expectedTargets);
    await currentDirectoryInstall(expectedOptions);
    expect(localInstallerModule.LocalInstaller).toBeCalledWith({
      '.': ['../a', '../b'],
    });
    expect(localInstallerModule.LocalInstaller).toBeCalled();
    expect(localInstallerStub.install).toBeCalled();
    expect(progressStub).toHaveBeenCalledWith(localInstallerStub);
    expect(readPackageJsonStub).toHaveBeenCalledWith('.');
    expect(saveIfNeededStub).toHaveBeenCalledWith(
      expectedTargets,
      expectedOptions
    );
  });

  it('should install given dependencies', async () => {
    localInstallerStub.install.mockResolvedValue([]);
    await currentDirectoryInstall(options({ dependencies: ['a', 'b'] }));
    expect(readPackageJsonStub).not.toBeCalled();
    expect(localInstallerModule.LocalInstaller).toBeCalledWith({
      '.': ['a', 'b'],
    });
    expect(localInstallerStub.install).toBeCalled();
  });

  it('should reject if install rejects', async () => {
    readPackageJsonStub.mockResolvedValue(packageJson());
    localInstallerStub.install.mockRejectedValue(new Error('some error'));
    await expect(currentDirectoryInstall(options())).rejects.toThrowError(
      'some error'
    );
  });

  it('should not install anything when no arguments nor local dependencies are provided', async () => {
    localInstallerStub.install.mockResolvedValue([]);
    readPackageJsonStub.mockResolvedValue(packageJson({}));
    const expectedOptions = options({ dependencies: [] });
    await currentDirectoryInstall(expectedOptions);
    expect(localInstallerModule.LocalInstaller).toBeCalledWith({ '.': [] });
    expect(localInstallerModule.LocalInstaller).toBeCalled();
    expect(localInstallerStub.install).toBeCalled();
    expect(progressStub).toHaveBeenCalledWith(localInstallerStub);
    expect(readPackageJsonStub).toHaveBeenCalledWith('.');
    expect(saveIfNeededStub).toHaveBeenCalledWith([], expectedOptions);
  });
});
