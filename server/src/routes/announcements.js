import { Router } from 'express';
import { z } from 'zod';
import { Announcement } from '../models/Announcement.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { createNotification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

const announcementSchema = z.object({
  title: z.string().trim().min(4).max(160),
  body: z.string().trim().min(10).max(5000),
});

const courseParamsSchema = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course id'),
});

async function ensureCourseAccess(user, course) {
  if (user.role === 'admin') return true;
  if (course.instructorId.toString() === user._id.toString()) return true;
  return !!(await Enrollment.exists({ userId: user._id, courseId: course._id }));
}

router.get('/courses/:courseId/announcements', requireAuth, async (req, res, next) => {
  try {
    const { courseId } = courseParamsSchema.parse(req.params);
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (!(await ensureCourseAccess(req.user, course))) throw new AppError('Not enrolled', 403);
    const announcements = await Announcement.find({ courseId: course._id })
      .populate('authorId', 'name role avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    sendSuccess(res, announcements);
  } catch (e) {
    next(e);
  }
});

router.post('/courses/:courseId/announcements', requireAuth, async (req, res, next) => {
  try {
    const { courseId } = courseParamsSchema.parse(req.params);
    const body = announcementSchema.parse(req.body);
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    const ownsCourse = course.instructorId.toString() === req.user._id.toString();
    if (!ownsCourse && req.user.role !== 'admin') throw new AppError('Forbidden', 403);
    if (!course.sections?.some((section) => section.lessons?.length)) {
      throw new AppError('Add at least one lesson before posting announcements', 400);
    }

    const announcement = await Announcement.create({
      courseId: course._id,
      authorId: req.user._id,
      title: body.title,
      body: body.body,
    });

    const enrollments = await Enrollment.find({ courseId: course._id }).select('userId');
    await Promise.all(
      enrollments.map((enrollment) =>
        createNotification(enrollment.userId, {
          type: 'course_announcement',
          title: `Announcement: ${course.title}`,
          body: body.title,
          link: `/learn/${course._id}/${course.sections?.[0]?.lessons?.[0]?._id || ''}`,
          meta: { courseId: course._id, announcementId: announcement._id },
        })
      )
    );

    const populated = await announcement.populate('authorId', 'name role avatar');
    sendSuccess(res, populated, 'Announcement posted', 201);
  } catch (e) {
    next(e);
  }
});

export default router;
