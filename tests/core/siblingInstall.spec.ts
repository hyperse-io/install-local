import { promises as fs } from 'fs';
import path from 'path';
import { Mock, MockInstance } from 'vitest';
import * as helpers from '../../src/helpers.js';
import { InstallTarget, PackageJson } from '../../src/index.js';
import * as localInstallerModule from '../../src/LocalInstaller.js';
import * as progressModule from '../../src/progress.js';
import { siblingInstall } from '../../src/siblingInstall.js';

describe('siblingInstall', () => {
  let readdirStub: MockInstance<() => Promise<string[]>>;
  let readPackageJson: MockInstance<(from: string) => Promise<PackageJson>>;
  let localInstallerStub: {
    install: Mock<() => Promise<InstallTarget[]>>;
    on: Mock;
  };

  beforeEach(() => {
    localInstallerStub = { install: vi.fn(), on: vi.fn() };
    // LocalInstaller is a class, so we need to mock the constructor, use `MockReturnValue` to mock the return value
    vi.spyOn(localInstallerModule, 'LocalInstaller').mockReturnValue(
      localInstallerStub as any
    );
    readdirStub = vi.spyOn(fs, 'readdir') as any;
    readPackageJson = vi.spyOn(helpers, 'readPackageJson');
    vi.spyOn(progressModule, 'progress');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should install packages from sibling dirs if they exist', async () => {
    // Arrange
    const currentDirName = path.basename(process.cwd());
    readdirStub.mockResolvedValue(['a', 'b', 'c', 'd']);
    const siblings = {
      a: path.resolve('..', 'a'),
      b: path.resolve('..', 'b'),
      c: path.resolve('..', 'c'),
      d: path.resolve('..', 'd'),
    };
    readPackageJson.mockResolvedValue(
      createPackageJson({
        localDependencies: { someName: `../${currentDirName}` },
      })
    );
    readPackageJson.mockImplementation(((from: string) => {
      if (from === siblings.a) {
        return Promise.resolve(
          createPackageJson({
            localDependencies: { someName: `../${currentDirName}` },
          })
        );
      }

      if (from === siblings.b) {
        return Promise.reject();
      }

      if (from === siblings.c) {
        return Promise.resolve(
          createPackageJson({
            localDependencies: { someOtherName: process.cwd() },
          })
        );
      }
      if (from === siblings.d) {
        return Promise.resolve(
          createPackageJson({
            localDependencies: { someOtherName: 'some/other/localDep' },
          })
        );
      }
    }) as any);

    localInstallerStub.install.mockResolvedValue([]);

    // Act
    await siblingInstall();

    // Assert
    expect(readdirStub).toBeCalledWith('..');
    expect(localInstallerModule.LocalInstaller).toBeCalledWith({
      [siblings.a]: ['.'],
      [siblings.c]: ['.'],
    });
    expect(localInstallerModule.LocalInstaller).toHaveBeenCalledOnce();
    expect(localInstallerStub.install).toBeCalled();
    expect(progressModule.progress).toBeCalledWith(localInstallerStub);
  });

  it('should reject when install rejects', async () => {
    // Arrange
    readdirStub.mockResolvedValue(['a']);
    readPackageJson.mockResolvedValue(
      createPackageJson({ localDependencies: { b: process.cwd() } })
    );
    localInstallerStub.install.mockRejectedValue(new Error('some error'));
    await expect(siblingInstall()).rejects.toThrowError('some error');
  });

  function createPackageJson(overrides?: Partial<PackageJson>): PackageJson {
    return {
      name: 'a',
      version: '1.2.0',
      localDependencies: {},
      ...overrides,
    };
  }
});
