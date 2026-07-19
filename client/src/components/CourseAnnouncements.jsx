import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function CourseAnnouncements({ course }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', body: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const canPost =
    user?.role === 'admin' || String(course?.instructorId?._id || course?.instructorId) === String(user?._id);
  const trimmedTitle = form.title.trim();
  const trimmedBody = form.body.trim();
  const titleError =
    trimmedTitle && trimmedTitle.length < 4
      ? 'Title must be at least 4 characters.'
      : trimmedTitle.length > 160
        ? 'Title must be 160 characters or less.'
        : '';
  const bodyError =
    trimmedBody && trimmedBody.length < 10
      ? 'Message must be at least 10 characters.'
      : trimmedBody.length > 5000
        ? 'Message must be 5000 characters or less.'
        : '';
  const canSubmit = Boolean(course?._id && trimmedTitle.length >= 4 && trimmedBody.length >= 10 && !titleError && !bodyError);

  const load = async () => {
    const { data } = await api.get(`/courses/${course._id}/announcements`);
    setItems(data.data || []);
  };

  useEffect(() => {
    if (course?._id) load().catch(() => setItems([]));
  }, [course?._id]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (!canSubmit) {
        setMessage('Please complete the announcement title and message.');
        return;
      }
      await api.post(`/courses/${course._id}/announcements`, {
        title: trimmedTitle,
        body: trimmedBody,
      });
      setForm({ title: '', body: '' });
      await load();
      setMessage('Announcement posted.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {canPost && (
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-2 font-semibold text-slate-900">
            <Megaphone className="h-4 w-4 text-primary-500" />
            Post announcement
          </p>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field mt-3"
            placeholder="Announcement title"
            minLength={4}
            maxLength={160}
            required
          />
          {titleError && <p className="mt-1 text-xs text-red-600">{titleError}</p>}
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="input-field mt-3 min-h-[110px]"
            placeholder="Share an update with enrolled students..."
            minLength={10}
            maxLength={5000}
            required
          />
          <div className="mt-1 flex justify-between text-xs">
            <span className={bodyError ? 'text-red-600' : 'text-slate-400'}>{bodyError || 'Minimum 10 characters'}</span>
            <span className="text-slate-400">{trimmedBody.length}/5000</span>
          </div>
          {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
          <Button type="submit" className="mt-3" disabled={loading || !canSubmit}>
            Publish
          </Button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
          No announcements yet.
        </p>
      ) : (
        items.map((item) => (
          <article key={item._id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.authorId?.name || 'Instructor'} · {new Date(item.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{item.body}</p>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
