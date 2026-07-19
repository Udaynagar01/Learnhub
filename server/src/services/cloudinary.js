import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config.js';
import { localMediaUrl, removeLocalFile, saveLocalUpload } from './localUpload.js';

const cloudinaryConfigured =
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret &&
  !config.cloudinary.cloudName.includes('your_');

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

function playbackUrl(result, resourceType) {
  const url = result.secure_url || result.url;
  if (!url || resourceType !== 'video') return url;
  if (url.includes('/video/upload/') && !url.endsWith('.mp4')) {
    return url.replace('/upload/', '/upload/f_mp4,q_auto/');
  }
  return url;
}

/** Cloudinary free plan limits */
export const CLOUDINARY_MAX_BYTES = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

function exceedsCloudinaryLimit(sizeBytes, resourceType) {
  const max = CLOUDINARY_MAX_BYTES[resourceType === 'video' ? 'video' : 'image'];
  return sizeBytes > max;
}

async function saveLocalWithWarning(buffer, localFolder, mimeType, warning) {
  const url = await saveLocalUpload(buffer, localFolder, mimeType);
  return { url, secure_url: url, local: true, warning };
}

function uploadToCloudinary(buffer, folder, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `learnhub/${folder}`, resource_type: resourceType },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          ...result,
          url: playbackUrl(result, resourceType),
          secure_url: playbackUrl(result, resourceType),
        });
      }
    );
    stream.end(buffer);
  });
}

export async function uploadBuffer(buffer, folder, resourceType = 'auto', mimeType = '') {
  const localFolder = resourceType === 'video' ? 'videos' : 'images';
  const typeKey = resourceType === 'video' ? 'video' : 'image';

  if (!cloudinaryConfigured) {
    const url = await saveLocalUpload(buffer, localFolder, mimeType);
    return { url, secure_url: url, local: true };
  }

  if (exceedsCloudinaryLimit(buffer.length, resourceType)) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    const limitMb = CLOUDINARY_MAX_BYTES[typeKey] / (1024 * 1024);
    return saveLocalWithWarning(
      buffer,
      localFolder,
      mimeType,
      `File is ${sizeMb} MB (Cloudinary limit ~${limitMb} MB). Saved on this server instead.`
    );
  }

  try {
    return await uploadToCloudinary(buffer, folder, resourceType);
  } catch (err) {
    if (err?.http_code === 413) {
      return saveLocalWithWarning(
        buffer,
        localFolder,
        mimeType,
        'File is too large for your Cloudinary plan. Saved on this server instead.'
      );
    }
    throw err;
  }
}

/** Stream large videos from disk — avoids loading entire file into RAM. */
export async function uploadVideoFile(filePath, fileSize, mimeType = '') {
  const localUrl = localMediaUrl('videos', path.basename(filePath));

  if (!cloudinaryConfigured || exceedsCloudinaryLimit(fileSize, 'video')) {
    const sizeMb = (fileSize / (1024 * 1024)).toFixed(1);
    const warning =
      fileSize > CLOUDINARY_MAX_BYTES.video
        ? `Video is ${sizeMb} MB. Saved on this server (Cloudinary free plan supports up to ~100 MB).`
        : undefined;
    return { url: localUrl, secure_url: localUrl, local: true, warning };
  }

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        { folder: 'learnhub/videos', resource_type: 'video' },
        (err, res) => (err ? reject(err) : resolve(res))
      );
    });
    await removeLocalFile(filePath);
    const url = playbackUrl(result, 'video');
    return { ...result, url, secure_url: url };
  } catch (err) {
    if (err?.http_code === 413) {
      const sizeMb = (fileSize / (1024 * 1024)).toFixed(1);
      return {
        url: localUrl,
        secure_url: localUrl,
        local: true,
        warning: `Video is ${sizeMb} MB. Cloudinary rejected it — saved on this server instead.`,
      };
    }
    throw err;
  }
}
