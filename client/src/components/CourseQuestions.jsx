import { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import api from '../services/api';
import Button from './Button';

export default function CourseQuestions({ courseId, lessonId }) {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({ title: '', body: '' });
  const [answerText, setAnswerText] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadQuestions = async () => {
    const query = lessonId ? `?lessonId=${lessonId}` : '';
    const { data } = await api.get(`/courses/${courseId}/questions${query}`);
    setQuestions(data.data || []);
  };

  useEffect(() => {
    if (!courseId) return;
    loadQuestions().catch(() => setQuestions([]));
  }, [courseId, lessonId]);

  const submitQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.post(`/courses/${courseId}/questions`, { ...form, lessonId });
      setForm({ title: '', body: '' });
      await loadQuestions();
      setMessage('Question posted.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not post question');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (questionId) => {
    const text = answerText[questionId]?.trim();
    if (!text) return;
    setLoading(true);
    setMessage('');
    try {
      await api.post(`/questions/${questionId}/answers`, { text });
      setAnswerText((prev) => ({ ...prev, [questionId]: '' }));
      await loadQuestions();
      setMessage('Answer posted.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not post answer');
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (question) => {
    await api.patch(`/questions/${question._id}/resolved`, { resolved: !question.resolved });
    await loadQuestions();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submitQuestion} className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          <MessageSquare className="h-4 w-4 text-primary-500" />
          Ask a question
        </p>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field mt-3"
          placeholder="Short question title"
          minLength={4}
          required
        />
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="input-field mt-3 min-h-[96px]"
          placeholder="Describe what you are stuck on..."
          minLength={10}
          required
        />
        {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        <Button type="submit" className="mt-3" disabled={loading}>
          Post question
        </Button>
      </form>

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
          No questions for this lesson yet.
        </p>
      ) : (
        questions.map((q) => (
          <article key={q._id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{q.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Asked by {q.userId?.name || 'Student'} · {new Date(q.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleResolved(q)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  q.resolved ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {q.resolved ? 'Resolved' : 'Open'}
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{q.body}</p>

            <div className="mt-4 space-y-3">
              {(q.answers || []).map((a) => (
                <div key={a._id} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">
                    {a.userId?.name || 'User'} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{a.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={answerText[q._id] || ''}
                onChange={(e) => setAnswerText((prev) => ({ ...prev, [q._id]: e.target.value }))}
                className="input-field"
                placeholder="Write an answer..."
              />
              <Button type="button" variant="outline" onClick={() => submitAnswer(q._id)} disabled={loading}>
                Reply
              </Button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
