import fs from 'fs/promises';
import path from 'path';
import { uploadsRoot } from './localUpload.js';

export {
  isOpenAiConfigured,
  isGeminiConfigured,
  isVideoAiConfigured,
  getActiveAiProvider,
  transcribeVideoBuffer,
} from './aiQuizProvider.js';

export async function resolveVideoFile(videoUrl) {
  if (!videoUrl) return null;

  const localMatch = videoUrl.match(/\/media\/videos\/([^/?#]+)/i);
  if (localMatch) {
    const filename = path.basename(localMatch[1]);
    const filePath = path.join(uploadsRoot, 'videos', filename);
    try {
      const buffer = await fs.readFile(filePath);
      return { buffer, filename };
    } catch {
      return null;
    }
  }

  if (/^https?:\/\//i.test(videoUrl)) {
    const res = await fetch(videoUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    let filename = 'lesson.mp4';
    try {
      filename = path.basename(new URL(videoUrl).pathname) || filename;
    } catch {
      /* keep default */
    }
    return { buffer, filename };
  }

  return null;
}
