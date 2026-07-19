import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const uploadsRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

const extByMime = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export async function saveLocalUpload(buffer, folder, mimeType = '') {
  const ext = extByMime[mimeType] || (folder === 'videos' ? '.mp4' : '.bin');
  const dir = path.join(uploadsRoot, folder);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/api/v1/media/${folder}/${filename}`;
}

export function localMediaUrl(folder, filename) {
  return `/api/v1/media/${folder}/${filename}`;
}

export async function removeLocalFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore missing temp files
  }
}

export function createVideoDiskStorage() {
  return {
    _handleFile(req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.mp4';
      const filename = `${crypto.randomUUID()}${ext}`;
      const dir = path.join(uploadsRoot, 'videos');
      fsSync.mkdirSync(dir, { recursive: true });
      const finalPath = path.join(dir, filename);
      const out = fsSync.createWriteStream(finalPath);
      file.stream.pipe(out);
      out.on('error', cb);
      out.on('finish', () => {
        fsSync.stat(finalPath, (statErr, stat) => {
          if (statErr) return cb(statErr);
          cb(null, { path: finalPath, filename, size: stat.size });
        });
      });
    },
    _removeFile(req, file, cb) {
      removeLocalFile(file.path).then(() => cb(null)).catch(cb);
    },
  };
}

export { uploadsRoot };