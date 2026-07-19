import { Router } from 'express';
import { Quiz } from '../models/Quiz.js';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { syncEnrollmentProgress } from '../utils/enrollmentProgress.js';
import { ensureQuizForCourse } from '../utils/defaultQuiz.js';
import { objectIdSchema } from '../utils/validation.js';

const router = Router();

router.get('/quiz/course/:courseId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);

    const enrolled = await Enrollment.exists({
      userId: req.user._id,
      courseId: course._id,
    });
    if (!enrolled) throw new AppError('Enroll in this course to take the quiz', 403);

    const quiz = await ensureQuizForCourse(course);
    const safe = quiz.toObject();
    safe.questions = safe.questions.map((q) => {
      const { correctIndex, ...rest } = q;
      return rest;
    });
    sendSuccess(res, safe);
  } catch (e) {
    next(e);
  }
});

router.post('/quiz/:quizId/attempt', requireAuth, async (req, res, next) => {
  try {
    const quizId = objectIdSchema.parse(req.params.quizId);
    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404);
    const { answers } = req.body;
    if (!Array.isArray(answers)) throw new AppError('Answers must be an array', 400);
    if (answers.length !== quiz.questions.length) throw new AppError('Answer every question', 400);
    if (!answers.every((answer) => Number.isInteger(answer) && answer >= 0)) {
      throw new AppError('Invalid answer format', 400);
    }
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: quiz.courseId,
    });
    if (!enrollment) throw new AppError('Enroll in this course to submit the quiz', 403);
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;
    if (enrollment) {
      enrollment.quizScore = score;
      enrollment.quizPassed = passed;
      const course = await Course.findById(quiz.courseId);
      if (course) await syncEnrollmentProgress(enrollment, course);
      await enrollment.save();
    }
    sendSuccess(res, { score, passed });
  } catch (e) {
    next(e);
  }
});

export default router;
