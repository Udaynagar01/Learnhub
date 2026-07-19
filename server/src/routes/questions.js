import { Router } from 'express';
import { z } from 'zod';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Question } from '../models/Question.js';
import { createNotification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { objectIdSchema } from '../utils/validation.js';

const router = Router();

const questionSchema = z.object({
  lessonId: z.string().optional(),
  title: z.string().trim().min(4).max(160),
  body: z.string().trim().min(10).max(3000),
});

const answerSchema = z.object({
  text: z.string().trim().min(2).max(3000),
});

async function canAccessCourse(user, course) {
  if (!user || !course) return false;
  if (user.role === 'admin') return true;
  if (course.instructorId.toString() === user._id.toString()) return true;
  return !!(await Enrollment.exists({ userId: user._id, courseId: course._id }));
}

router.get('/courses/:courseId/questions', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (!(await canAccessCourse(req.user, course))) throw new AppError('Not enrolled', 403);

    const filter = { courseId: course._id };
    if (req.query.lessonId) filter.lessonId = objectIdSchema.parse(req.query.lessonId);
    const questions = await Question.find(filter)
      .populate('userId', 'name avatar role')
      .populate('answers.userId', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(100);
    sendSuccess(res, questions);
  } catch (e) {
    next(e);
  }
});

router.post('/courses/:courseId/questions', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const body = questionSchema.parse(req.body);
    if (body.lessonId) objectIdSchema.parse(body.lessonId);
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    const enrolled = await Enrollment.exists({ userId: req.user._id, courseId: course._id });
    if (!enrolled && req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      throw new AppError('Enroll in this course to ask a question', 403);
    }

    const question = await Question.create({
      courseId: course._id,
      lessonId: body.lessonId || undefined,
      userId: req.user._id,
      title: body.title,
      body: body.body,
    });

    if (course.instructorId.toString() !== req.user._id.toString()) {
      await createNotification(course.instructorId, {
        type: 'question',
        title: `New question in ${course.title}`,
        body: body.title,
        link: `/learn/${course._id}/${body.lessonId || ''}`,
        meta: { questionId: question._id, courseId: course._id },
      });
    }

    const populated = await question.populate('userId', 'name avatar role');
    sendSuccess(res, populated, 'Question posted', 201);
  } catch (e) {
    next(e);
  }
});

router.post('/questions/:questionId/answers', requireAuth, async (req, res, next) => {
  try {
    const questionId = objectIdSchema.parse(req.params.questionId);
    const body = answerSchema.parse(req.body);
    const question = await Question.findById(questionId);
    if (!question) throw new AppError('Question not found', 404);
    const course = await Course.findById(question.courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (!(await canAccessCourse(req.user, course))) throw new AppError('Not enrolled', 403);

    question.answers.push({ userId: req.user._id, text: body.text });
    await question.save();

    if (question.userId.toString() !== req.user._id.toString()) {
      await createNotification(question.userId, {
        type: 'question_answered',
        title: `New answer to "${question.title}"`,
        body: body.text.length > 80 ? `${body.text.slice(0, 80)}...` : body.text,
        link: `/learn/${course._id}/${question.lessonId || ''}`,
        meta: { questionId: question._id, courseId: course._id },
      });
    }

    const populated = await Question.findById(question._id)
      .populate('userId', 'name avatar role')
      .populate('answers.userId', 'name avatar role');
    sendSuccess(res, populated, 'Answer posted', 201);
  } catch (e) {
    next(e);
  }
});

router.patch('/questions/:questionId/resolved', requireAuth, async (req, res, next) => {
  try {
    const questionId = objectIdSchema.parse(req.params.questionId);
    const resolvedSchema = z.object({ resolved: z.boolean() });
    const body = resolvedSchema.parse(req.body);
    const question = await Question.findById(questionId);
    if (!question) throw new AppError('Question not found', 404);
    const course = await Course.findById(question.courseId);
    if (!course) throw new AppError('Course not found', 404);
    const ownsQuestion = question.userId.toString() === req.user._id.toString();
    const ownsCourse = course.instructorId.toString() === req.user._id.toString();
    if (!ownsQuestion && !ownsCourse && req.user.role !== 'admin') throw new AppError('Forbidden', 403);
    question.resolved = body.resolved;
    await question.save();
    sendSuccess(res, question);
  } catch (e) {
    next(e);
  }
});

export default router;
