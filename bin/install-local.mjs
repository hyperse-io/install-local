#!/usr/bin/env node
process.title = 'install-local';
import { cli } from '../index.js';

cli(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
