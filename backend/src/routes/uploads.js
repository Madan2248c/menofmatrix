import { Router } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import multer from 'multer';
import { pipeline } from 'node:stream/promises';
import { uploadBlogImage, getBlogImage, isAllowedImageMime } from '../services/storageService.js';

const router = Router();

function requireOwner(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  try {
    jwt.verify(token || '', process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Keep files in memory; 4MB stays under Vercel's ~4.5MB serverless body cap.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

/** Owner: upload a blog image, get back its stable public URL. */
router.post('/', requireOwner, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided (field "file")' });
    const mime = req.file.mimetype;
    if (!isAllowedImageMime(mime)) {
      return res.status(400).json({ error: `Unsupported image type: ${mime}` });
    }
    const { key, url } = await uploadBlogImage(req.file.buffer, mime);
    res.json({ ok: true, key, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: browsers load blog images without auth headers. Keys are namespaced
// to blog/ and content-addressed by uuid, so they are safe to cache forever.
router.get('/blog/*', async (req, res) => {
  try {
    const key = `blog/${req.params[0]}`;
    if (!/^blog\/[\w.-]+$/.test(key) || key.includes('..')) {
      return res.status(400).json({ error: 'Invalid key' });
    }
    const obj = await getBlogImage(key);
    if (!obj) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', obj.ContentType || 'application/octet-stream');
    if (obj.ContentLength != null) res.setHeader('Content-Length', obj.ContentLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    await pipeline(obj.Body, res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

export default router;
