import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  FileText,
  Download,
  MessageSquare,
  Play,
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/Button';
import CourseQuestions from '../components/CourseQuestions';
import CourseAnnouncements from '../components/CourseAnnouncements';
import { resolveVideoUrl, videoMimeHint } from '../utils/mediaUrl';
import { downloadNotesPdf } from '../utils/downloadNotesPdf';

export default function CoursePlayer() {
  const { courseId, lessonId } = useParams();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [completedIds, setCompletedIds] = useState(new Set());
  const [progressPercent, setProgressPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [notesMsg, setNotesMsg] = useState('');
  const [downloadingNotes, setDownloadingNotes] = useState(false);
  const [lastWatchedSeconds, setLastWatchedSeconds] = useState(0);
  const [resumeApplied, setResumeApplied] = useState(false);
  const navigate = useNavigate();
  const [videoError, setVideoError] = useState('');
  const [marking, setMarking] = useState(false);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    setVideoError('');
    api.get(`/courses/id/${courseId}`).then((r) => {
      const c = r.data.data;
      setCourse(c);
      let lesson = null;
      for (const s of c.sections || []) {
        for (const l of s.lessons || []) {
          if (String(l._id) === String(lessonId)) lesson = l;
        }
      }
      setCurrentLesson(lesson);
      setOpenSections({ [c.sections?.[0]?._id]: true });
    });
    api
      .get(`/enrollments/course/${courseId}`)
      .then((r) => {
        const ids = r.data.data.completedLessonIds || [];
        setCompletedIds(new Set(ids));
        setProgressPercent(r.data.data.enrollment?.progressPercent || 0);
      })
      .catch(() => {});
    api
      .get(`/lesson-progress/${courseId}/${lessonId}`)
      .then((r) => {
        setNotes(r.data.data.notes || '');
        setLastWatchedSeconds(r.data.data.lastWatchedSeconds || 0);
        setResumeApplied(false);
      })
      .catch(() => {
        setNotes('');
        setLastWatchedSeconds(0);
        setResumeApplied(false);
      });
  }, [courseId, lessonId]);

  const saveLessonProgress = async (updates, showMessage = false) => {
    try {
      const { data } = await api.patch(`/lesson-progress/${courseId}/${lessonId}`, updates);
      if (updates.notes !== undefined) setNotes(data.data.notes || '');
      if (updates.lastWatchedSeconds !== undefined) {
        setLastWatchedSeconds(data.data.lastWatchedSeconds || 0);
      }
      if (showMessage) setNotesMsg('Saved.');
    } catch (err) {
      if (showMessage) setNotesMsg(err.response?.data?.message || 'Could not save.');
    }
  };

  const downloadLessonNotes = async () => {
    if (!notes.trim()) {
      setNotesMsg('Write and save notes before downloading.');
      return;
    }
    setDownloadingNotes(true);
    setNotesMsg('');
    try {
      await api.patch(`/lesson-progress/${courseId}/${lessonId}`, { notes });
      await downloadNotesPdf(`/lesson-progress/${courseId}/${lessonId}/notes/pdf`);
      setNotesMsg('Lesson notes PDF downloaded.');
    } catch (err) {
      setNotesMsg(err.response?.data?.message || 'Could not download notes PDF.');
    } finally {
      setDownloadingNotes(false);
    }
  };

  const downloadAllCourseNotes = async () => {
    setDownloadingNotes(true);
    setNotesMsg('');
    try {
      if (notes.trim()) {
        await api.patch(`/lesson-progress/${courseId}/${lessonId}`, { notes });
      }
      await downloadNotesPdf(`/enrollments/course/${courseId}/notes/pdf`, 'learnhub-course-notes.pdf');
      setNotesMsg('All course notes PDF downloaded.');
    } catch (err) {
      setNotesMsg(err.response?.data?.message || 'Could not download course notes PDF.');
    } finally {
      setDownloadingNotes(false);
    }
  };

  const markComplete = async () => {
    if (!lessonId || completedIds.has(String(lessonId))) return;
    setMarking(true);
    try {
      const { data } = await api.patch(`/progress/${courseId}/${lessonId}`);
      const ids = data.data.completedLessons?.map((id) => id.toString()) || [];
      setCompletedIds(new Set(ids));
      setProgressPercent(data.data.progressPercent || 0);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save progress.');
    } finally {
      setMarking(false);
    }
  };

  const onVideoTimeUpdate = (e) => {
    const el = e.target;
    if (!el.duration || el.duration < 10) return;
    const current = Math.floor(el.currentTime);
    if (current > 0 && current % 15 === 0 && current > lastWatchedSeconds + 10) {
      saveLessonProgress({ lastWatchedSeconds: current });
    }
    if (el.currentTime / el.duration >= 0.9 && !completedIds.has(String(lessonId))) {
      markComplete();
    }
  };

  const onVideoLoadedMetadata = (e) => {
    const el = e.target;
    if (resumeApplied || !lastWatchedSeconds || !el.duration) return;
    if (lastWatchedSeconds < el.duration - 10) {
      el.currentTime = lastWatchedSeconds;
    }
    setResumeApplied(true);
  };

  const findNextLesson = () => {
    let found = false;
    for (const s of course?.sections || []) {
      for (const l of s.lessons || []) {
        if (found) return l;
        if (String(l._id) === String(lessonId)) found = true;
      }
    }
    return null;
  };

  const next = findNextLesson();
  const videoSrc = resolveVideoUrl(currentLesson?.videoUrl);
  const isInvalidUrl = currentLesson?.videoUrl && !videoSrc;
  const totalLessons = course?.sections?.reduce((n, s) => n + (s.lessons?.length || 0), 0) || 0;
  const lessonsDone = completedIds.size;
  const lessonComplete = completedIds.has(String(lessonId));

  const goNext = async () => {
    await markComplete();
    if (next && autoplay) navigate(`/learn/${courseId}/${next._id}`);
  };

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Main video area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
          <div className="min-w-0">
            <Link to="/dashboard/learning" className="text-sm font-medium text-primary-600 hover:underline">
              ← Back to learning
            </Link>
            <h1 className="mt-1 truncate font-display text-lg font-bold text-slate-900">
              {currentLesson?.title || 'Lesson'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!lessonComplete && (
              <Button variant="outline" size="sm" onClick={markComplete} disabled={marking}>
                {marking ? 'Saving…' : 'Mark Complete'}
              </Button>
            )}
            {lessonComplete && (
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-video overflow-hidden rounded-2xl bg-black shadow-card"
          >
            {videoSrc ? (
              <video
                key={`${currentLesson._id}-${videoSrc}`}
                src={videoSrc}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full"
                onEnded={() => {
                  markComplete();
                  if (next && autoplay) goNext();
                }}
                onTimeUpdate={onVideoTimeUpdate}
                onLoadedMetadata={onVideoLoadedMetadata}
                onError={() =>
                  setVideoError('Could not play video. Re-upload as MP4 from Instructor → Edit course.')
                }
              >
                <source src={videoSrc} type={videoMimeHint(videoSrc)} />
              </video>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-white">
                <Play className="h-12 w-12 opacity-50" />
                <p>{isInvalidUrl ? 'Invalid video link' : 'No video for this lesson'}</p>
              </div>
            )}
          </motion.div>
          {videoError && <p className="mt-2 text-sm text-red-600">{videoError}</p>}

          <Tab.Group className="mt-6">
            <Tab.List className="flex gap-4 border-b border-slate-200">
              {['Overview', 'Notes', 'Resources', 'Q&A', 'Announcements'].map((t) => (
                <Tab
                  key={t}
                  className={({ selected }) =>
                    `pb-3 text-sm font-semibold outline-none ${
                      selected ? 'border-b-2 border-primary-500 text-primary-600' : 'text-slate-500'
                    }`
                  }
                >
                  {t}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-4">
              <Tab.Panel>
                <p className="text-slate-600">
                  {currentLesson?.description || 'Watch the lesson and mark complete when done. Progress saves at ~90% watched.'}
                </p>
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
                  Autoplay next lecture
                </label>
              </Tab.Panel>
              <Tab.Panel>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes while learning..."
                  className="input-field min-h-[120px]"
                  rows={5}
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => saveLessonProgress({ notes }, true)}
                  >
                    Save notes
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={downloadLessonNotes}
                    disabled={downloadingNotes || !notes.trim()}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {downloadingNotes ? 'Preparing PDF...' : 'Download lesson PDF'}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={downloadAllCourseNotes}
                    disabled={downloadingNotes}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download all notes PDF
                  </Button>
                  {notesMsg && <p className="text-sm text-slate-500">{notesMsg}</p>}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Notes are saved to your account. Download this lesson or all saved course notes as PDF.
                </p>
              </Tab.Panel>
              <Tab.Panel>
                <ul className="space-y-2">
                  {(currentLesson?.resources || []).length === 0 ? (
                    <li className="text-sm text-slate-500">No resources for this lesson</li>
                  ) : (
                    currentLesson.resources.map((r, i) => (
                      <li key={i}>
                        <a href={r.url} className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                          <Download className="h-4 w-4" /> {r.title || 'Download'}
                        </a>
                      </li>
                    ))
                  )}
                </ul>
              </Tab.Panel>
              <Tab.Panel>
                <CourseQuestions courseId={courseId} lessonId={lessonId} />
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <MessageSquare className="h-4 w-4" /> Q&A with instructor — use Messages
                </p>
              </Tab.Panel>
              <Tab.Panel>
                <CourseAnnouncements course={course} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>

          <div className="mt-6 flex flex-wrap gap-3">
            {next && (
              <Button onClick={goNext}>Next Lecture →</Button>
            )}
            <Link to={`/quiz/course/${courseId}`}>
              <Button variant="outline">Take Quiz</Button>
            </Link>
          </div>

          {next && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card mt-6 flex items-center gap-4 p-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <Play className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-primary-600">Up Next</p>
                <p className="font-semibold text-slate-900">{next.title}</p>
              </div>
              <Button size="sm" onClick={goNext}>
                Play
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Lecture sidebar */}
      <aside className="hidden w-80 shrink-0 flex-col border-l border-slate-200 bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border p-4">
          <h2 className="line-clamp-2 font-semibold text-white">{course.title}</h2>
          <div className="mt-3 h-1.5 w-full rounded-full bg-sidebar-hover">
            <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {progressPercent}% · {lessonsDone}/{totalLessons} lessons
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {course.sections?.map((section) => (
            <div key={section._id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-sidebar-hover"
                onClick={() => setOpenSections((o) => ({ ...o, [section._id]: !o[section._id] }))}
              >
                {section.title}
                {openSections[section._id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {openSections[section._id] &&
                section.lessons?.map((l) => (
                  <button
                    key={l._id}
                    type="button"
                    onClick={() => navigate(`/learn/${courseId}/${l._id}`)}
                    className={`flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm ${
                      String(l._id) === String(lessonId)
                        ? 'bg-primary-500/30 text-white'
                        : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
                    }`}
                  >
                    {completedIds.has(String(l._id)) ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 opacity-50" />
                    )}
                    <span className="truncate">{l.title}</span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
