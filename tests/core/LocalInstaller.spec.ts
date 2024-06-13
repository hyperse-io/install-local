import { promises as fs } from 'fs';
import os from 'os';
import { resolve } from 'path';
import { LocalInstaller } from '../../src/LocalInstaller.js';
import * as utils from '../../src/utils.js';

const TEN_MEGA_BYTE = 1024 * 1024 * 10;

describe('LocalInstaller install', () => {
  const tmpDir = resolve(os.tmpdir(), 'node-local-install-5a6s4df65asdas');

  class TestHelper {
    public execStub = vi.spyOn(utils, 'execa');
    public mkdirStub = vi.spyOn(fs, 'mkdir');
    public readFileStub = vi.spyOn(fs, 'readFile');
    public rimrafStub = vi.spyOn(utils, 'del');
    public getRandomTmpDirStub = vi
      .spyOn(utils, 'getRandomTmpDir')
      .mockReturnValue(tmpDir);
  }

  let sut: LocalInstaller;
  let helper: TestHelper;

  function createExecaResult(overrides?: any) {
    return {
      command: '',
      exitCode: 0,
      isCanceled: false,
      failed: false,
      killed: false,
      stderr: '',
      stdout: '',
      timedOut: false,
      ...overrides,
    };
  }

  beforeEach(() => {
    helper = new TestHelper();
    // Call callback
    helper.mkdirStub.mockResolvedValue('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with some normal packages', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b', 'c'], d: ['/e'] });
      stubPackageJson({ '/a': 'a', b: 'b', c: 'c', d: 'd', '/e': 'e' });
      helper.execStub.mockResolvedValue(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' })
      );
      helper.rimrafStub.mockResolvedValue(true);
    });

    it('should create a temporary directory', async () => {
      await sut.install();
      expect(helper.getRandomTmpDirStub).toBeCalledWith('node-local-install-');
      expect(helper.mkdirStub).toBeCalledWith(tmpDir);
    });

    it('should pack correct packages', async () => {
      await sut.install();
      expect(helper.execStub).toBeCalledWith('npm', ['pack', resolve('b')], {
        cwd: tmpDir,
        maxBuffer: TEN_MEGA_BYTE,
      });
      expect(helper.execStub).toBeCalledWith('npm', ['pack', resolve('c')], {
        cwd: tmpDir,
        maxBuffer: TEN_MEGA_BYTE,
      });
      expect(helper.execStub).toBeCalledWith('npm', ['pack', resolve('/e')], {
        cwd: tmpDir,
        maxBuffer: TEN_MEGA_BYTE,
      });
    });

    it('should install correct packages', async () => {
      await sut.install();
      expect(helper.execStub).toBeCalledWith(
        'npm',
        [
          'i',
          '--no-save',
          '--no-package-lock',
          tmp('b-0.0.1.tgz'),
          tmp('c-0.0.2.tgz'),
        ],
        { cwd: resolve('/a'), env: undefined, maxBuffer: TEN_MEGA_BYTE }
      );
      expect(helper.execStub).toBeCalledWith(
        'npm',
        ['i', '--no-save', '--no-package-lock', tmp('e-0.0.4.tgz')],
        { cwd: resolve('d'), env: undefined, maxBuffer: TEN_MEGA_BYTE }
      );
    });

    it('should emit all events', async () => {
      const installTargetsIdentified = vi.fn();
      const installStart = vi.fn();
      const installed = vi.fn();
      const packingStart = vi.fn();
      const packed = vi.fn();
      const installEnd = vi.fn();
      const packingEnd = vi.fn();
      sut.on('install_targets_identified', installTargetsIdentified);
      sut.on('install_start', installStart);
      sut.on('installed', installed);
      sut.on('packing_start', packingStart);
      sut.on('packed', packed);
      sut.on('packing_end', packingEnd);
      sut.on('install_end', installEnd);
      await sut.install();
      expect(installTargetsIdentified).toBeCalledTimes(1);
      expect(installStart).toBeCalledTimes(1);
      expect(installed).toBeCalledTimes(2);
      expect(packingStart).toBeCalledTimes(1);
      expect(packed).toBeCalledTimes(3);
      expect(installEnd).toBeCalledTimes(1);
      expect(packingEnd).toBeCalledTimes(1);
    });

    it('should remove the temporary directory', async () => {
      await sut.install();

      expect(helper.rimrafStub).toBeCalledWith(tmpDir);
    });
  });

  describe('with scoped packages', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] });
      stubPackageJson({ '/a': 'a', b: '@s/b' });
      helper.execStub.mockResolvedValue(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' })
      );
      helper.rimrafStub.mockResolvedValue(true);
    });

    it('should install scoped packages', async () => {
      await sut.install();
      expect(helper.execStub).toBeCalledWith(
        'npm',
        ['i', '--no-save', '--no-package-lock', tmp('s-b-0.0.1.tgz')],
        { cwd: resolve('/a'), env: undefined, maxBuffer: TEN_MEGA_BYTE }
      );
    });
  });

  describe('with npmEnv', () => {
    const npmEnv = { test: 'test', dummy: 'dummy' };
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] }, { npmEnv });
      stubPackageJson({ '/a': 'a', b: 'b' });
      helper.execStub.mockResolvedValue(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' })
      );
      helper.rimrafStub.mockResolvedValue(true);
    });

    it('should call npm with correct env vars', async () => {
      await sut.install();
      expect(helper.execStub).toBeCalledWith(
        'npm',
        ['i', '--no-save', '--no-package-lock', tmp('b-0.0.1.tgz')],
        { env: npmEnv, cwd: resolve('/a'), maxBuffer: TEN_MEGA_BYTE }
      );
    });
  });

  describe('when readFile errors', () => {
    it('should propagate the error', async () => {
      helper.readFileStub.mockRejectedValue(new Error('file error'));
      await expect(sut.install()).rejects.toThrowError('file error');
    });
  });

  describe('when packing errors', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] }, {});
      stubPackageJson({ '/a': 'a', b: 'b' });
    });

    it('should propagate the error', async () => {
      helper.execStub.mockRejectedValue(new Error('error'));
      await expect(sut.install()).rejects.toThrowError('error');
    });
  });

  describe('when installing errors', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] }, {});
      stubPackageJson({ '/a': 'a', b: 'b' });
      stubPack('b');
    });

    it('should propagate the error', async () => {
      helper.execStub.mockRejectedValue(new Error('install err'));
      await expect(sut.install()).rejects.toThrowError('install err');
    });
  });

  const tmp = (file: string) => resolve(tmpDir, file);

  const stubPackageJson = (recipe: { [directory: string]: string }) => {
    const returnValues = new Map<string, any>();

    Object.keys(recipe).forEach((directory, i) => {
      returnValues.set(
        resolve(directory, 'package.json'),
        JSON.stringify({
          name: recipe[directory],
          version: `0.0.${i}`,
        })
      );
    });

    helper.readFileStub.mockImplementation(((pkgPath: string) => {
      return returnValues.get(pkgPath);
    }) as any);
  };

  const stubPack = (...directories: string[]) => {
    const returnValues = new Map<string, any>();
    directories.forEach((directory) => {
      returnValues.set(`npm pack ${resolve(directory)}`, true);
    });
    helper.execStub.mockImplementation(((cmd: string) => {
      return Promise.resolve(returnValues.get(cmd));
    }) as any);
  };
});
