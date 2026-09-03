import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binDir = path.join(__dirname, '..', 'bin');
const binName = process.platform === 'win32' ? 'mom-tracker.exe' : 'mom-tracker';
const targetPath = path.join(binDir, binName);

const releaseBinary = path.join(__dirname, '..', 'target', 'release', binName);
if (fs.existsSync(releaseBinary)) {
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  fs.copyFileSync(releaseBinary, targetPath);
  try {
    fs.chmodSync(targetPath, 0o755);
  } catch {}
}
