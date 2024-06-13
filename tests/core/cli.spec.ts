import { Mock, MockInstance } from 'vitest';
import { cli } from '../../src/cli.js';
import * as currentDirectoryInstallModule from '../../src/currentDirectoryInstall.js';
import * as optionsModule from '../../src/Options.js';
import * as siblingInstallModule from '../../src/siblingInstall.js';

describe('cli', () => {
  let optionsMock: {
    dependencies: string[];
    save: boolean;
    targetSiblings: boolean;
    validate: Mock<any, Promise<void>>;
  };

  let currentDirectoryInstallStub: MockInstance<
    [optionsModule.Options],
    Promise<void>
  >;
  let siblingInstallStub: MockInstance<[], Promise<void>>;

  beforeEach(() => {
    optionsMock = {
      dependencies: [],
      save: false,
      targetSiblings: false,
      validate: vi.fn(),
    };

    // Options is a class, so we need to mock the constructor, use `MockReturnValue` to mock the return value
    vi.spyOn(optionsModule, 'Options').mockReturnValue(optionsMock as any);

    currentDirectoryInstallStub = vi.spyOn(
      currentDirectoryInstallModule,
      'currentDirectoryInstall'
    );
    siblingInstallStub = vi.spyOn(siblingInstallModule, 'siblingInstall');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('given a valid config', () => {
    beforeEach(() => {
      optionsMock.validate.mockResolvedValue();
    });

    it('should install into current directory if targetSiblings = false', async () => {
      optionsMock.targetSiblings = false;
      await cli([]);
      expect(currentDirectoryInstallStub).toHaveBeenCalled();
      expect(siblingInstallStub).not.toHaveBeenCalled();
    });

    it('should target siblings if targetSiblings = true', async () => {
      optionsMock.targetSiblings = true;
      await cli([]);
      expect(currentDirectoryInstallStub).not.toHaveBeenCalled();
      expect(siblingInstallStub).toHaveBeenCalled();
    });
  });

  describe('with an invalid config', () => {
    it('should reject', async () => {
      optionsMock.validate.mockRejectedValue(new Error('something is wrong'));
      return expect(cli([])).rejects.toThrowError('something is wrong');
    });
  });
});
