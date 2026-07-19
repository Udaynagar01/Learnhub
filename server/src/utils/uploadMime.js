import path from 'path';

const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-m4v',
  'application/mp4',
  'application/octet-stream',
]);

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.avi', '.m4v']);

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/octet-stream',
]);

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function isAllowedVideo(file) {
  if (!file) return false;
  if (VIDEO_MIMES.has(file.mimetype)) return true;
  const ext = path.extname(file.originalname || '').toLowerCase();
  return VIDEO_EXT.has(ext);
}

export function isAllowedImage(file) {
  if (!file) return false;
  if (IMAGE_MIMES.has(file.mimetype)) return true;
  const ext = path.extname(file.originalname || '').toLowerCase();
  return IMAGE_EXT.has(ext);
}
