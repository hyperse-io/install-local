import { promises as fs } from 'fs';
import path from 'path';
import { MockInstance } from 'vitest';
import { readPackageJson } from '../../src/helpers.js';

describe('Helpers', () => {
  let readFileStub: MockInstance<any, Promise<string | Buffer>>;

  beforeEach(() => {
    readFileStub = vi.spyOn(fs, 'readFile');
    readFileStub.mockResolvedValue('{ }');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call fs.readFile with the path and utf8 as arguments when readPackageJson is called', async () => {
    const pathToProject = '/test/path/to/project';

    await readPackageJson(pathToProject);

    expect(readFileStub).toBeCalledWith(
      path.join(pathToProject, 'package.json'),
      'utf8'
    );
  });

  it("should convert the content read to a javascript 'PackageJson' object", async () => {
    readFileStub.mockResolvedValue('{ "key": "value" }');

    const result = await readPackageJson('/test/path/to/project');

    expect(result).toMatchObject({ key: 'value' });
  });
});
