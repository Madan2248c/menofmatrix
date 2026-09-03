#!/usr/bin/env node

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binName = process.platform === 'win32' ? 'mom-tracker.exe' : 'mom-tracker';
let binPath = path.join(__dirname, binName);

if (!fs.existsSync(binPath)) {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  binPath = path.join(home, '.cargo', 'bin', binName);
}

if (!fs.existsSync(binPath)) {
  console.error('Error: Native mom-tracker executable binary not found.');
  process.exit(1);
}

const result = spawnSync(binPath, process.argv.slice(2), { stdio: 'inherit' });
process.exit(result.status ?? 0);
