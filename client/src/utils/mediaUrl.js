/** Normalize media URLs for display in the browser. */

function resolveMediaPath(url, type) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('placehold.co')) return null;

  if (trimmed.startsWith('/api/v1/media/')) return trimmed;

  const legacy = trimmed.match(new RegExp(`/uploads/${type}/([^/?#]+)`));
  if (legacy) return `/api/v1/media/${type}/${legacy[1]}`;

  const abs = trimmed.match(new RegExp(`/api/v1/media/${type}/([^/?#]+)`));
  if (abs) return `/api/v1/media/${type}/${abs[1]}`;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  // Bare filename from local upload (uuid.ext)
  if (/^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(trimmed)) {
    return `/api/v1/media/images/${trimmed}`;
  }
  if (/^[a-f0-9-]+\.(mp4|webm|mov|avi)$/i.test(trimmed)) {
    return `/api/v1/media/videos/${trimmed}`;
  }

  return trimmed;
}

export function resolveImageUrl(url) {
  return resolveMediaPath(url, 'images');
}

export function resolveVideoUrl(url) {
  return resolveMediaPath(url, 'videos');
}

export function videoMimeHint(url) {
  if (!url) return undefined;
  if (url.includes('.webm')) return 'video/webm';
  if (url.includes('.mov')) return 'video/quicktime';
  return 'video/mp4';
}
