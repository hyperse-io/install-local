import { expect } from 'chai';
import os from 'os';
import path from 'path';
import { getRandomTmpDir } from '../../src/utils.js';

describe('Utils', () => {
  it('should return a random directory inside the OS tmp dir', () => {
    const prefix = 'some-prefix-';
    const expectedPath = path.resolve(os.tmpdir(), prefix);

    // Match expected path followed by a unique id (replacing `\` with `\\`)
    const pathRegex = new RegExp(`^${expectedPath.replace(/\\/g, '\\\\')}.*`);
    expect(getRandomTmpDir(prefix)).to.match(pathRegex);
  });
});
