import api from '../services/api';

export async function downloadNotesPdf(url, fallbackFilename = 'learnhub-notes.pdf') {
  const response = await api.get(url, { responseType: 'blob' });
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackFilename;

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
