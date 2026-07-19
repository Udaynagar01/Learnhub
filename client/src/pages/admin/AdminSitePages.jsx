import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/Button';
import PageContent from '../../components/PageContent';

const PAGE_OPTIONS = [
  { slug: 'help-center', label: 'Help Center' },
  { slug: 'terms-of-service', label: 'Terms of Service' },
  { slug: 'privacy-policy', label: 'Privacy Policy' },
];

export default function AdminSitePages() {
  const [pages, setPages] = useState([]);
  const [activeSlug, setActiveSlug] = useState('help-center');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const load = () => api.get('/admin/pages').then((r) => setPages(r.data.data));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const page = pages.find((p) => p.slug === activeSlug);
    if (!page) {
      const fallback = PAGE_OPTIONS.find((p) => p.slug === activeSlug);
      setTitle(fallback?.label || '');
      setContent('');
      setIsPublished(true);
      return;
    }
    setTitle(page.title);
    setContent(page.content);
    setIsPublished(page.isPublished !== false);
  }, [pages, activeSlug]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.put(`/admin/pages/${activeSlug}`, { title, content, isPublished });
      setStatus({ type: 'success', message: 'Page saved successfully.' });
      load();
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Could not save page.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Site Pages</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Edit Help Center, Terms of Service, and Privacy Policy content shown on the public site.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PAGE_OPTIONS.map((option) => (
          <button
            key={option.slug}
            type="button"
            onClick={() => {
              setActiveSlug(option.slug);
              setStatus(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeSlug === option.slug
                ? 'bg-primary-500 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field mt-1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Content</label>
            <p className="mt-1 text-xs text-slate-500">
              Use blank lines for paragraphs. Start lines with ## for headings and - for bullet lists.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field mt-2 min-h-[420px] resize-y font-mono text-sm"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-slate-300"
            />
            Published (visible to everyone)
          </label>

          {status && (
            <p
              className={`text-sm ${
                status.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {status.message}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save page'}
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Preview</p>
          <p className="mt-1 text-xs text-slate-500">/{activeSlug}</p>
          <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">{title || 'Untitled'}</h2>
          <PageContent content={content} />
        </div>
      </form>
    </div>
  );
}
