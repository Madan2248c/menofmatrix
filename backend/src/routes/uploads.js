import { Router } from 'express';
import 'dotenv/config';
import multer from 'multer';
import { pipeline } from 'node:stream/promises';
import { requireOwner } from '../middleware/requireOwner.js';
import { uploadBlogImage, getObject, isAllowedImageMime } from '../services/storageService.js';

const router = Router();

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

// Public: browsers load cached images without auth headers. Keys are namespaced
// (blog/ is content-addressed by uuid, followers/ by numeric follower id), so
// they are safe to cache forever.
router.get('/:kind/*', async (req, res) => {
  try {
    const kind = req.params.kind;
    if (!['blog', 'followers'].includes(kind)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const key = `${kind}/${req.params[0]}`;
    if (!/^[\w./-]+$/.test(req.params[0]) || key.includes('..')) {
      return res.status(400).json({ error: 'Invalid key' });
    }
    const obj = await getObject(key);
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
