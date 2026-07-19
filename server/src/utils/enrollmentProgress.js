import { Quiz } from '../models/Quiz.js';
import { getTotalLessons } from '../models/Course.js';

export async function syncEnrollmentProgress(enrollment, course) {
  const total = getTotalLessons(course);
  enrollment.progressPercent = total
    ? Math.min(100, Math.round((enrollment.completedLessons.length / total) * 100))
    : 0;

  const quiz = await Quiz.findOne({ courseId: course._id });
  const lessonsDone = total === 0 || enrollment.completedLessons.length >= total;
  const quizOk = !quiz || enrollment.quizPassed;

  if (lessonsDone && quizOk) {
    enrollment.progressPercent = 100;
    if (!enrollment.completedAt) {
      enrollment.completedAt = new Date();
      enrollment.certificateId = `LH-${enrollment._id.toString().slice(-8).toUpperCase()}`;
    }
  }

  return enrollment;
}
