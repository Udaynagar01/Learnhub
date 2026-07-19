import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import { resolveImageUrl } from '../../utils/mediaUrl';

function buildCoursePayload(form) {
  const categoryId =
    typeof form.categoryId === 'object' && form.categoryId?._id
      ? form.categoryId._id
      : form.categoryId || '';

  return {
    title: (form.title || '').trim(),
    description: (form.description || '').trim(),
    categoryId: String(categoryId),
    level: form.level || 'Beginner',
    isFree: !!form.isFree,
    price: form.isFree ? 0 : Number(form.price) || 0,
    thumbnail: form.thumbnail || undefined,
    whatYouLearn: (form.whatYouLearn || []).filter((s) => String(s).trim()),
    requirements: (form.requirements || []).filter((s) => String(s).trim()),
    sections: (form.sections || []).map((sec) => ({
      title: sec.title || 'Section',
      lessons: (sec.lessons || []).map((l) => ({
        title: l.title || 'Lesson',
        duration: Number(l.duration) || 0,
        videoUrl: l.videoUrl || '',
        isPreview: !!l.isPreview,
      })),
    })),
  };
}

export default function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: 0,
    isFree: false,
    categoryId: '',
    level: 'Beginner',
    whatYouLearn: [''],
    requirements: [''],
    sections: [{ title: 'Introduction', lessons: [{ title: 'Welcome', duration: 5, videoUrl: '' }] }],
  });

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data));
    if (id) {
      api.get(`/instructor/courses/${id}`).then((r) => {
        const data = r.data.data;
        setForm({
          ...data,
          categoryId: data.categoryId?._id || data.categoryId || '',
          whatYouLearn: data.whatYouLearn?.length ? data.whatYouLearn : [''],
          requirements: data.requirements?.length ? data.requirements : [''],
        });
      });
    }
  }, [id]);

  const save = async (e) => {
    e.preventDefault();
    const payload = buildCoursePayload(form);
    if (payload.description.length < 10) {
      alert('Description must be at least 10 characters.');
      return;
    }
    if (!payload.categoryId) {
      alert('Please select a category.');
      return;
    }
    try {
      if (id) await api.put(`/instructor/courses/${id}`, payload);
      else await api.post('/instructor/courses', payload);
      navigate('/instructor/courses');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save course');
    }
  };

  const uploadThumb = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/upload/image', fd);
      setForm((prev) => ({ ...prev, thumbnail: data.data.url }));
      if (data.data.warning) alert(data.data.warning);
    } catch (err) {
      alert(err.response?.data?.message || 'Thumbnail upload failed');
    } finally {
      setThumbUploading(false);
      e.target.value = '';
    }
  };

  const thumbSrc = resolveImageUrl(form.thumbnail);

  const uploadLessonVideo = async (sectionIdx, lessonIdx, file) => {
    if (!file) return;
    const key = `${sectionIdx}-${lessonIdx}`;
    setUploading(key);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/upload/video', fd, {
        timeout: 0,
        onUploadProgress: (event) => {
          if (!event.total) return;
          setUploadProgress(Math.min(99, Math.round((event.loaded * 100) / event.total)));
        },
      });
      setUploadProgress(100);
      const sections = [...form.sections];
      const lessons = [...sections[sectionIdx].lessons];
      lessons[lessonIdx] = { ...lessons[lessonIdx], videoUrl: data.data.url };
      sections[sectionIdx] = { ...sections[sectionIdx], lessons };
      setForm({ ...form, sections });
      if (data.data.warning) alert(data.data.warning);
    } catch (err) {
      alert(err.response?.data?.message || 'Video upload failed');
    } finally {
      setUploading('');
      setUploadProgress(null);
    }
  };

  const updateSection = (si, field, value) => {
    const sections = [...form.sections];
    sections[si] = { ...sections[si], [field]: value };
    setForm({ ...form, sections });
  };

  const updateLesson = (si, li, field, value) => {
    const sections = [...form.sections];
    const lessons = [...sections[si].lessons];
    lessons[li] = { ...lessons[li], [field]: value };
    sections[si] = { ...sections[si], lessons };
    setForm({ ...form, sections });
  };

  const addSection = () => {
    setForm({
      ...form,
      sections: [...form.sections, { title: 'New Section', lessons: [{ title: 'Lesson 1', duration: 5, videoUrl: '' }] }],
    });
  };

  const addLesson = (si) => {
    const sections = [...form.sections];
    sections[si] = {
      ...sections[si],
      lessons: [...sections[si].lessons, { title: 'New lesson', duration: 5, videoUrl: '' }],
    };
    setForm({ ...form, sections });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">{id ? 'Edit' : 'Create'} Course</h1>
      <form onSubmit={save} className="mt-6 space-y-4">
        <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded border px-3 py-2" />
        <textarea
          placeholder="Description (at least 10 characters)"
          required
          minLength={10}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded border px-3 py-2"
          rows={4}
        />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded border px-3 py-2" required>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked, price: 0 })} />
          Free course
        </label>
        {!form.isFree && (
          <input type="number" placeholder="Price ₹" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded border px-3 py-2" />
        )}
        <div>
          <label className="text-sm font-medium">Thumbnail</label>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadThumb} className="mt-1 block" disabled={thumbUploading} />
          {thumbUploading && <p className="mt-1 text-sm text-gray-500">Uploading…</p>}
          {thumbSrc ? (
            <img src={thumbSrc} alt="Course thumbnail" className="mt-2 h-24 rounded object-cover" />
          ) : form.thumbnail ? (
            <p className="mt-2 text-sm text-amber-600">Previous thumbnail invalid — upload a new image, then Save Course.</p>
          ) : null}
          <p className="mt-1 text-xs text-gray-500">After upload, click Save Course to keep the thumbnail.</p>
        </div>

        <p className="text-xs text-gray-500">
          Video tip: up to 1 GB per video. Under 100 MB uploads to Cloudinary; larger files save on this server (playback still works).
        </p>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Curriculum & videos</h2>
            <Button type="button" variant="outline" onClick={addSection}>+ Section</Button>
          </div>
          {form.sections?.map((section, si) => (
            <div key={si} className="rounded-lg border bg-gray-50 p-4">
              <input
                value={section.title}
                onChange={(e) => updateSection(si, 'title', e.target.value)}
                className="w-full rounded border bg-white px-3 py-2 font-medium"
                placeholder="Section title"
              />
              <div className="mt-3 space-y-3">
                {section.lessons?.map((lesson, li) => (
                  <div key={li} className="rounded border bg-white p-3">
                    <input
                      value={lesson.title}
                      onChange={(e) => updateLesson(si, li, 'title', e.target.value)}
                      className="w-full rounded border px-2 py-1 text-sm"
                      placeholder="Lesson title"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        value={lesson.duration || 0}
                        onChange={(e) => updateLesson(si, li, 'duration', Number(e.target.value))}
                        className="w-20 rounded border px-2 py-1 text-sm"
                        placeholder="Min"
                      />
                      <label className="cursor-pointer rounded bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700">
                        {uploading === `${si}-${li}`
                          ? uploadProgress != null
                            ? `Uploading ${uploadProgress}%`
                            : 'Uploading…'
                          : 'Upload video'}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                          className="hidden"
                          disabled={!!uploading}
                          onChange={(e) => uploadLessonVideo(si, li, e.target.files?.[0])}
                        />
                      </label>
                      {uploading === `${si}-${li}` && uploadProgress != null && (
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full bg-primary-500 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                      {lesson.videoUrl && (
                        <span className="text-xs text-green-600">Video attached</span>
                      )}
                    </div>
                    <input
                      value={lesson.videoUrl || ''}
                      onChange={(e) => updateLesson(si, li, 'videoUrl', e.target.value)}
                      className="mt-2 w-full rounded border px-2 py-1 text-xs text-gray-600"
                      placeholder="Or paste video URL (mp4)"
                    />
                  </div>
                ))}
                <Button type="button" variant="ghost" className="text-sm" onClick={() => addLesson(si)}>
                  + Add lesson
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button type="submit">Save Course</Button>
          {id && (
            <Button type="button" variant="outline" onClick={() => navigate(`/instructor/courses/${id}/quiz`)}>
              Edit quiz
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
