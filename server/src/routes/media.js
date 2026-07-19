import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { uploadsRoot } from '../services/localUpload.js';

const router = Router();

const mimeByExt = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function streamFile(req, res, folder, filename) {
  const safeName = path.basename(filename);
  const filePath = path.join(uploadsRoot, folder, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(safeName).toLowerCase();
  const contentType = mimeByExt[ext] || 'application/octet-stream';
  const range = req.headers.range;

  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Accept-Ranges', 'bytes');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (start >= fileSize || end >= fileSize) {
      res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
      return;
    }
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

router.get('/media/videos/:filename', (req, res) => {
  streamFile(req, res, 'videos', req.params.filename);
});

router.get('/media/images/:filename', (req, res) => {
  streamFile(req, res, 'images', req.params.filename);
});

export default router;
