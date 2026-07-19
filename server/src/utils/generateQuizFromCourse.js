import { Quiz } from '../models/Quiz.js';
import { Course } from '../models/Course.js';
import { AppError } from '../middleware/errorHandler.js';
import { resolveVideoFile, transcribeVideoBuffer, isVideoAiConfigured } from '../services/videoTranscript.js';
import { AiProviderError } from '../services/aiQuizProvider.js';
import { generateQuestionsFromTranscripts } from '../services/quizAi.js';

const MAX_VIDEO_LESSONS = 5;

const FALLBACK_QUESTIONS = [
  {
    text: 'How do you mark a lesson as complete in LearnHub?',
    options: ['Skip the video', 'Watch until the end', 'Email the instructor', 'Pay extra'],
    correctIndex: 1,
  },
  {
    text: 'What should you do after finishing all lessons?',
    options: ['Delete your account', 'Take the course quiz', 'Unenroll', 'Nothing'],
    correctIndex: 1,
  },
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueStrings(items) {
  return [...new Set(items.filter(Boolean))];
}

function makeQuestion(text, correctAnswer, distractorPool) {
  const pool = uniqueStrings(distractorPool.filter((d) => d !== correctAnswer));
  const wrong = [];
  while (wrong.length < 3 && pool.length) {
    const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    wrong.push(pick);
  }
  while (wrong.length < 3) {
    wrong.push(`Other topic ${wrong.length + 1}`);
  }
  const options = shuffle([correctAnswer, ...wrong.slice(0, 3)]);
  return {
    text,
    options,
    correctIndex: options.indexOf(correctAnswer),
  };
}

/**
 * Build multiple-choice questions from course sections & lessons (video titles).
 */
export function generateQuizQuestionsFromCourse(course) {
  const sections = course?.sections || [];
  const questions = [];
  const sectionTitles = sections.map((s) => s.title).filter(Boolean);
  const lessons = [];

  for (const section of sections) {
    for (const lesson of section.lessons || []) {
      if (lesson?.title) {
        lessons.push({
          sectionTitle: section.title || 'Section',
          title: lesson.title,
          duration: lesson.duration || 0,
        });
      }
    }
  }

  if (!lessons.length) {
    return [...FALLBACK_QUESTIONS];
  }

  if (course.title) {
    questions.push(
      makeQuestion(
        `This course is primarily about:`,
        course.title,
        [
          'Graphic design only',
          'Database administration',
          'Mobile game development',
          ...sectionTitles,
        ]
      )
    );
  }

  const maxLessonQuestions = Math.min(lessons.length, 8);
  const picked = shuffle(lessons).slice(0, maxLessonQuestions);

  for (const item of picked) {
    questions.push(
      makeQuestion(
        `In which section is the lesson "${item.title}"?`,
        item.sectionTitle,
        sectionTitles.length > 1 ? sectionTitles : ['Introduction', 'Advanced', 'Projects']
      )
    );

    if (item.duration > 0) {
      const correct = `${item.duration} min`;
      const wrongDurations = uniqueStrings(
        picked
          .map((l) => (l.duration ? `${l.duration} min` : null))
          .filter((d) => d && d !== correct)
      );
      questions.push(
        makeQuestion(
          `What is the duration of the lesson "${item.title}"?`,
          correct,
          wrongDurations.length >= 3
            ? wrongDurations
            : [`${item.duration + 5} min`, `${Math.max(1, item.duration - 3)} min`, '60 min']
        )
      );
    } else {
      const otherLessons = uniqueStrings(
        picked.map((l) => l.title).filter((t) => t !== item.title)
      );
      questions.push(
        makeQuestion(
          `Which lesson title matches this topic: "${item.sectionTitle}"?`,
          item.title,
          otherLessons.length >= 3 ? otherLessons : [...otherLessons, 'Getting Started', 'Summary']
        )
      );
    }
  }

  return questions.slice(0, 12);
}

/**
 * Transcribe lesson videos and build quiz questions from actual lecture content (AI).
 */
export async function generateQuizQuestionsFromVideoContent(course) {
  if (!isVideoAiConfigured()) {
    return {
      questions: generateQuizQuestionsFromCourse(course),
      source: 'curriculum',
      courseModified: false,
      notice:
        'No GEMINI_API_KEY or OPENAI_API_KEY in server/.env — generated from lesson titles instead of video content.',
    };
  }

  const lessonTranscripts = [];
  let courseModified = false;
  let processed = 0;
  let notice = null;
  let stopTranscription = false;

  for (const section of course.sections || []) {
    for (const lesson of section.lessons || []) {
      if (!lesson.videoUrl || processed >= MAX_VIDEO_LESSONS || stopTranscription) continue;

      if (lesson.transcript?.trim()) {
        lessonTranscripts.push({ title: lesson.title, transcript: lesson.transcript });
        processed += 1;
        continue;
      }

      const file = await resolveVideoFile(lesson.videoUrl);
      if (!file) continue;

      try {
        const transcript = await transcribeVideoBuffer(file.buffer, file.filename);
        if (!transcript) continue;

        lesson.transcript = transcript;
        courseModified = true;
        lessonTranscripts.push({ title: lesson.title, transcript });
        processed += 1;
      } catch (err) {
        if (err instanceof AppError) {
          notice = err.message;
          continue;
        }
        if (err instanceof AiProviderError) {
          notice = err.message;
          stopTranscription = true;
          break;
        }
        notice = 'Video AI failed — quiz built from lesson titles instead.';
        stopTranscription = true;
        break;
      }
    }
    if (stopTranscription) break;
  }

  if (!lessonTranscripts.length) {
    return {
      questions: generateQuizQuestionsFromCourse(course),
      source: 'curriculum',
      courseModified,
      notice:
        notice ||
        (processed === 0
          ? 'No video files found for transcription — quiz built from lesson titles.'
          : undefined),
    };
  }

  try {
    const aiQuestions = await generateQuestionsFromTranscripts(lessonTranscripts, course.title);
    if (aiQuestions?.length) {
      return { questions: aiQuestions, source: 'video', courseModified, notice };
    }
  } catch (err) {
    notice =
      err instanceof AiProviderError
        ? err.message
        : 'Video AI failed during question generation — quiz built from lesson titles instead.';
  }

  return {
    questions: generateQuizQuestionsFromCourse(course),
    source: 'curriculum',
    courseModified,
    notice,
  };
}

export function quizTimeLimitForCourse(course) {
  const lessonCount = (course?.sections || []).reduce(
    (n, s) => n + (s.lessons?.length || 0),
    0
  );
  return Math.min(60, Math.max(15, lessonCount * 2));
}

/**
 * Create or replace quiz from current curriculum.
 * @param {import('../models/Course.js').Course} course
 * @param {{ replace?: boolean, fromVideo?: boolean }} opts
 */
export async function syncQuizWithCurriculum(course, { replace = false, fromVideo = false } = {}) {
  let questions;
  let generatedFrom = 'curriculum';
  let notice;

  if (fromVideo) {
    const result = await generateQuizQuestionsFromVideoContent(course);
    questions = result.questions;
    generatedFrom = result.source;
    notice = result.notice;
    if (result.courseModified) {
      await course.save();
    }
  } else {
    questions = generateQuizQuestionsFromCourse(course);
  }

  if (!questions.length) return null;

  const payload = {
    title: `${course.title} - Final Quiz`,
    passingScore: 70,
    timeLimitMinutes: quizTimeLimitForCourse(course),
    questions,
    autoGenerated: true,
    generatedFrom,
  };

  const existing = await Quiz.findOne({ courseId: course._id });
  if (existing && !replace) return { quiz: existing, notice };

  const quiz = await Quiz.findOneAndUpdate({ courseId: course._id }, payload, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  return { quiz, notice };
}

export async function ensureQuizForCourse(courseOrId) {
  const course =
    courseOrId && typeof courseOrId === 'object' && courseOrId._id
      ? courseOrId
      : await Course.findById(courseOrId);
  const courseId = course?._id || courseOrId;
  const courseTitle = course?.title || 'Course';

  const existing = await Quiz.findOne({ courseId });
  if (existing) return existing;

  if (course?.sections?.some((s) => s.lessons?.length)) {
    const result = await syncQuizWithCurriculum(course, { replace: true });
    if (result?.quiz) return result.quiz;
  }

  return Quiz.create({
    courseId,
    title: `${courseTitle} - Final Quiz`,
    passingScore: 70,
    timeLimitMinutes: 15,
    questions: FALLBACK_QUESTIONS,
    autoGenerated: true,
  });
}
