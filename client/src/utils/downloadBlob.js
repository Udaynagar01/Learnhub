import api from '../services/api';

/** Download a protected API file (PDF, etc.) with the user's auth token. */
export async function downloadProtectedFile(urlPath, filename) {
  const { data } = await api.get(urlPath, { responseType: 'blob' });
  const blob = data instanceof Blob ? data : new Blob([data]);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function parseBlobError(err) {
  const blob = err.response?.data;
  if (blob instanceof Blob) {
    try {
      const text = await blob.text();
      const json = JSON.parse(text);
      return json.message || 'Download failed';
    } catch {
      return 'Download failed';
    }
  }
  return err.response?.data?.message || 'Download failed';
}
