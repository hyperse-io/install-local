import { Options } from '../../src/Options.js';

describe('Options', () => {
  it('should parse "node install-local --save --target-siblings some dependencies"', () => {
    const options = new Options([
      'node',
      'install-local',
      '--save',
      '--target-siblings',
      'some',
      'dependencies',
    ]);
    expect(options.save).toBe(true);
    expect(options.targetSiblings).toBe(true);
    expect(options.dependencies).toEqual(['some', 'dependencies']);
  });

  it('should parse "node install-local -S -T some dependencies"', () => {
    const options = new Options([
      'node',
      'install-local',
      '-S',
      '-T',
      'some',
      'dependencies',
    ]);
    expect(options.save).toBe(true);
    expect(options.targetSiblings).toBe(true);
    expect(options.dependencies).toEqual(['some', 'dependencies']);
  });

  it('should reject when validating with --save and --target-siblings', () => {
    const options = new Options(['node', 'install-local', '-S', '-T']);
    return expect(options.validate()).rejects.toThrowError(
      'Invalid use of option --target-siblings. Cannot be used together with --save'
    );
  });

  it('should reject when validating with --target-siblings and dependencies', () => {
    const options = new Options([
      'node',
      'install-local',
      '-T',
      'some',
      'dependencies',
    ]);
    return expect(options.validate()).rejects.toThrowError(
      'Invalid use of option --target-siblings. Cannot be used together with a dependency list'
    );
  });
});
