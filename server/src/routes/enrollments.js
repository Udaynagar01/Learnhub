import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { Wishlist } from '../models/Wishlist.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { syncEnrollmentProgress } from '../utils/enrollmentProgress.js';
import { objectIdSchema } from '../utils/validation.js';
import {
  buildNotesFilename,
  collectCourseNotes,
  findLessonInCourse,
  generateNotesPDF,
} from '../services/notesPdf.js';

const router = Router();

async function createEnrollment(userId, courseId) {
  const existing = await Enrollment.findOne({ userId, courseId });
  if (existing) return existing;
  const enrollment = await Enrollment.create({ userId, courseId });
  await Course.findByIdAndUpdate(courseId, { $inc: { studentCount: 1 } });
  return enrollment;
}

router.get('/enrollments/check/:courseId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const enrolled = await Enrollment.exists({
      userId: req.user._id,
      courseId,
    });
    sendSuccess(res, { enrolled: !!enrolled });
  } catch (e) {
    next(e);
  }
});

router.get('/enrollments/course/:courseId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
    });
    if (!enrollment) throw new AppError('Not enrolled', 403);
    sendSuccess(res, {
      enrollment,
      completedLessonIds: enrollment.completedLessons.map((id) => id.toString()),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/enrollments/my-learning', requireAuth, async (req, res, next) => {
  try {
    const enrolled = await Enrollment.find({ userId: req.user._id })
      .populate({ path: 'courseId', populate: { path: 'instructorId', select: 'name' } });
    const active = enrolled.filter((e) => !e.completedAt);
    const completed = enrolled.filter((e) => e.completedAt);
    const wishlistDoc = await Wishlist.findOne({ userId: req.user._id }).populate('courseIds');
    sendSuccess(res, {
      enrolled: active,
      completed,
      wishlist: wishlistDoc?.courseIds || [],
    });
  } catch (e) {
    next(e);
  }
});

router.post('/enroll/:courseId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (!course.isFree && course.price > 0) {
      throw new AppError('Paid course — use checkout', 400);
    }
    const enrollment = await createEnrollment(req.user._id, course._id);
    sendSuccess(res, enrollment, 'Enrolled', 201);
  } catch (e) {
    next(e);
  }
});

router.patch('/progress/:courseId/:lessonId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const lessonId = objectIdSchema.parse(req.params.lessonId);
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
    });
    if (!enrollment) throw new AppError('Not enrolled', 403);
    const lessonOid = new mongoose.Types.ObjectId(lessonId);
    if (!enrollment.completedLessons.some((id) => id.equals(lessonOid))) {
      enrollment.completedLessons.push(lessonOid);
    }
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    await syncEnrollmentProgress(enrollment, course);
    await enrollment.save();
    sendSuccess(res, enrollment);
  } catch (e) {
    next(e);
  }
});

const lessonProgressSchema = z.object({
  notes: z.string().max(10000).optional(),
  lastWatchedSeconds: z.number().min(0).optional(),
});

function upsertLessonProgress(enrollment, lessonId, updates) {
  const key = lessonId.toString();
  let progress = enrollment.lessonProgress.find((item) => item.lessonId.toString() === key);
  if (!progress) {
    progress = { lessonId, notes: '', lastWatchedSeconds: 0 };
    enrollment.lessonProgress.push(progress);
    progress = enrollment.lessonProgress[enrollment.lessonProgress.length - 1];
  }
  if (updates.notes !== undefined) progress.notes = updates.notes;
  if (updates.lastWatchedSeconds !== undefined) {
    progress.lastWatchedSeconds = Math.max(progress.lastWatchedSeconds || 0, updates.lastWatchedSeconds);
  }
  progress.updatedAt = new Date();
  return progress;
}

router.get('/enrollments/course/:courseId/notes/pdf', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const [enrollment, course] = await Promise.all([
      Enrollment.findOne({ userId: req.user._id, courseId }),
      Course.findById(courseId),
    ]);
    if (!enrollment) throw new AppError('Not enrolled', 403);
    if (!course) throw new AppError('Course not found', 404);

    const items = collectCourseNotes(course, enrollment);
    if (!items.length) throw new AppError('No saved notes found for this course', 404);

    const pdf = await generateNotesPDF({
      studentName: req.user.name,
      courseTitle: course.title,
      items,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${buildNotesFilename(course.title)}"`);
    res.send(pdf);
  } catch (e) {
    next(e);
  }
});

router.get('/lesson-progress/:courseId/:lessonId/notes/pdf', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const lessonId = objectIdSchema.parse(req.params.lessonId);
    const [enrollment, course] = await Promise.all([
      Enrollment.findOne({ userId: req.user._id, courseId }),
      Course.findById(courseId),
    ]);
    if (!enrollment) throw new AppError('Not enrolled', 403);
    if (!course) throw new AppError('Course not found', 404);

    const found = findLessonInCourse(course, lessonId);
    if (!found) throw new AppError('Lesson not found', 404);

    const progress = enrollment.lessonProgress.find((item) => item.lessonId.toString() === lessonId);
    const lessonNotes = progress?.notes?.trim();
    if (!lessonNotes) throw new AppError('No saved notes for this lesson', 404);

    const pdf = await generateNotesPDF({
      studentName: req.user.name,
      courseTitle: course.title,
      items: [
        {
          sectionTitle: found.section.title,
          lessonTitle: found.lesson.title,
          notes: lessonNotes,
          updatedAt: progress.updatedAt,
        },
      ],
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${buildNotesFilename(course.title, found.lesson.title)}"`
    );
    res.send(pdf);
  } catch (e) {
    next(e);
  }
});

router.get('/lesson-progress/:courseId/:lessonId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const lessonId = objectIdSchema.parse(req.params.lessonId);
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
    });
    if (!enrollment) throw new AppError('Not enrolled', 403);
    const progress = enrollment.lessonProgress.find((item) => item.lessonId.toString() === lessonId);
    sendSuccess(res, {
      notes: progress?.notes || '',
      lastWatchedSeconds: progress?.lastWatchedSeconds || 0,
    });
  } catch (e) {
    next(e);
  }
});

router.patch('/lesson-progress/:courseId/:lessonId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const lessonId = objectIdSchema.parse(req.params.lessonId);
    const body = lessonProgressSchema.parse(req.body);
    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
    });
    if (!enrollment) throw new AppError('Not enrolled', 403);
    const lessonOid = new mongoose.Types.ObjectId(lessonId);
    const progress = upsertLessonProgress(enrollment, lessonOid, body);
    await enrollment.save();
    sendSuccess(res, {
      notes: progress.notes || '',
      lastWatchedSeconds: progress.lastWatchedSeconds || 0,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/wishlist/check/:courseId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const doc = await Wishlist.findOne({ userId: req.user._id });
    const inWishlist = doc?.courseIds?.some((id) => id.toString() === courseId) || false;
    sendSuccess(res, { inWishlist });
  } catch (e) {
    next(e);
  }
});

router.post('/wishlist/:courseId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) throw new AppError('Course not found', 404);
    let doc = await Wishlist.findOne({ userId: req.user._id });
    if (!doc) doc = await Wishlist.create({ userId: req.user._id, courseIds: [] });
    const cid = courseId;
    if (!doc.courseIds.some((id) => id.toString() === cid)) {
      doc.courseIds.push(cid);
      await doc.save();
    }
    sendSuccess(res, doc);
  } catch (e) {
    next(e);
  }
});

router.delete('/wishlist/:courseId', requireAuth, async (req, res, next) => {
  try {
    const courseId = objectIdSchema.parse(req.params.courseId);
    const doc = await Wishlist.findOne({ userId: req.user._id });
    if (!doc) return sendSuccess(res, { courseIds: [] });
    doc.courseIds = doc.courseIds.filter((id) => id.toString() !== courseId);
    await doc.save();
    sendSuccess(res, doc);
  } catch (e) {
    next(e);
  }
});

export { createEnrollment };
export default router;
