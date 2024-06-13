import { promises as fs } from 'fs';
import path from 'path';
import { MockInstance } from 'vitest';
import { InstallTarget } from '../../src/index.js';
import { Options } from '../../src/Options.js';
import { saveIfNeeded } from '../../src/save.js';

describe('saveIfNeeded', () => {
  let writeFileStub: MockInstance<any, Promise<void>>;

  let input: InstallTarget[];

  beforeEach(() => {
    input = [
      {
        sources: [
          {
            directory: 'a',
            packageJson: {
              name: 'a',
              version: '0.0.1',
            },
          },
        ],
        directory: 't',
        packageJson: {
          name: 't',
          version: '0.0.2',
        },
      },
    ];
    writeFileStub = vi.spyOn(fs, 'writeFile');
    writeFileStub.mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not do anything when no option to save', async () => {
    await saveIfNeeded(input, new Options([]));
    expect(writeFileStub).not.toHaveBeenCalled();
  });

  describe('when --save is in the options', () => {
    it('should write "localDependencies" to package.json', async () => {
      const expectedContent = JSON.stringify(
        { name: 't', version: '0.0.2', localDependencies: { a: '../a' } },
        null,
        2
      );
      await saveIfNeeded(
        input,
        new Options(['node', 'install-local', '--save'])
      );
      expect(writeFileStub).toHaveBeenCalledWith(
        path.resolve(input[0].directory, 'package.json'),
        expectedContent,
        { encoding: 'utf8' }
      );
      expect(writeFileStub).toHaveBeenCalledOnce();
    });

    it('should override any localDependency with the same name, and leave others be', async () => {
      const expectedContent = JSON.stringify(
        {
          name: 't',
          version: '0.0.2',
          localDependencies: { a: '../a', b: 'b' },
        },
        null,
        2
      );
      input[0].packageJson.localDependencies = { a: '', b: 'b' };
      await saveIfNeeded(
        input,
        new Options(['node', 'install-local', '--save'])
      );
      expect(writeFileStub).toHaveBeenCalledWith(
        path.resolve(input[0].directory, 'package.json'),
        expectedContent,
        { encoding: 'utf8' }
      );
      expect(writeFileStub).toHaveBeenCalledOnce();
    });

    it('should not write anything if the desired state is already in "localDependencies"', async () => {
      input[0].packageJson.localDependencies = { a: '../a' };
      await saveIfNeeded(
        input,
        new Options(['node', 'install-local', '--save'])
      );
      expect(writeFileStub).not.toHaveBeenCalled();
    });
  });
});
