import { promises as fs } from 'fs';
import path from 'path';
import type { PackageJson } from './index.js';

export async function readPackageJson(from: string): Promise<PackageJson> {
  const content = await fs.readFile(path.join(from, 'package.json'), 'utf8');
  return JSON.parse(content) as PackageJson;
}
