import os from 'os';
import { WriteStream } from 'tty';
import { LocalInstaller } from '../../src/LocalInstaller.js';
import { progress } from '../../src/progress.js';

describe('progress', () => {
  let eventEmitter: LocalInstaller;
  let streamStub: WriteStream;

  beforeEach(() => {
    streamStub = stubStdOut();
    eventEmitter = new LocalInstaller({});
    progress(eventEmitter, streamStub);
  });

  describe('on "install_targets_identified" with 2 install targets', () => {
    beforeEach(() => {
      const packageB = createPackage('b');
      const packageC = createPackage('c');
      const packageF = createPackage('f');
      eventEmitter.emit('install_targets_identified', [
        {
          directory: 'a',
          packageJson: { name: 'a', version: '0.0.1' },
          sources: [packageB, packageC],
        },
        {
          directory: 'e',
          packageJson: { name: 'e', version: 'c' },
          sources: [packageB, packageF],
        },
      ]);
    });
    it('should tick on "packing_start"', () => {
      eventEmitter.emit('packing_start', ['a', 'b']);
      expect(streamStub.write).toHaveBeenCalledWith(
        '[install-local] packing - 0/2'
      );
    });

    it('should tick on "packed"', () => {
      eventEmitter.emit('packing_start', ['a', 'b']);
      eventEmitter.emit('packed', 'a');
      expect(streamStub.clearLine).toHaveBeenCalled();
      expect(streamStub.cursorTo).toHaveBeenCalledWith(0);
      expect(streamStub.write).toHaveBeenCalledWith(
        '[install-local] packing - 1/2'
      );
      expect(streamStub.write).toHaveBeenCalledWith(' (a)');
    });

    it('should not clear line when not a TTY on "packed"', () => {
      streamStub.isTTY = false;
      eventEmitter.emit('packing_start', ['a', 'b']);
      eventEmitter.emit('packed', 'a');
      expect(streamStub.clearLine).not.toHaveBeenCalled();
      expect(streamStub.cursorTo).not.toHaveBeenCalled();
      expect(streamStub.write).toHaveBeenCalledWith(os.EOL);
    });

    it('should not tick on "packing_end"', () => {
      eventEmitter.emit('packing_start', ['a', 'b']);
      eventEmitter.emit('packing_end');
      expect(streamStub.clearLine).toHaveBeenCalled();
      expect(streamStub.cursorTo).toHaveBeenCalledWith(0);
    });

    it('should tick on "install_start"', () => {
      eventEmitter.emit('install_start', { a: ['b'], c: ['d'] });
      expect(streamStub.write).toHaveBeenCalledWith(
        `[install-local] installing into a, c${os.EOL}`
      );
    });

    it('should print that there is nothing todo on "install_start" without targets', () => {
      eventEmitter.emit('install_start', {});
      expect(streamStub.write).toHaveBeenCalledWith(
        `[install-local] nothing to install${os.EOL}`
      );
    });

    it('should tick on "installed"', () => {
      eventEmitter.emit('installed', 'a', 'stdout', 'stderr');
      expect(streamStub.write).toHaveBeenCalledWith(
        `[install-local] a installed${os.EOL}`
      );
      expect(streamStub.write).toHaveBeenCalledWith('stdout');
      expect(streamStub.write).toHaveBeenCalledWith('stderr');
    });

    it('should terminate on "install_end"', () => {
      eventEmitter.emit('install_end');
      expect(streamStub.write).toHaveBeenCalledWith(
        `[install-local] Done${os.EOL}`
      );
    });
  });
});

const createPackage = (name: string) => ({
  directory: name,
  packageJson: { name, version: '0' },
});

const stubStdOut = (): WriteStream => ({
  columns: 1000,
  // @ts-expect-error
  cursorTo: vi.fn(),
  clearLine: vi.fn(),
  eventNames: vi.fn(),
  prependOnceListener: vi.fn(),
  prependListener: vi.fn(),
  listenerCount: vi.fn(),
  emit: vi.fn(),
  listeners: vi.fn(),
  getMaxListeners: vi.fn(),
  setMaxListeners: vi.fn(),
  removeAllListeners: vi.fn(),
  removeListener: vi.fn(),
  once: vi.fn(),
  on: vi.fn(),
  addListener: vi.fn(),
  isTTY: true,
  readable: false,
  writable: true,
  write: vi.fn<any>(),
  end: vi.fn<any>(),
  read: vi.fn(),
  setEncoding: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  isPaused: vi.fn(),
  pipe: vi.fn(),
  unpipe: vi.fn(),
  unshift: vi.fn(),
  wrap: vi.fn(),
});
