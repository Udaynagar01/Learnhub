import { Router } from 'express';
import { Enrollment } from '../models/Enrollment.js';
import { Order } from '../models/Order.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

router.get('/student/stats', requireAuth, requireRole('student', 'instructor', 'admin'), async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [enrolledCount, completedCount, ordersCount, inProgress] = await Promise.all([
      Enrollment.countDocuments({ userId, completedAt: null }),
      Enrollment.countDocuments({ userId, completedAt: { $ne: null } }),
      Order.countDocuments({ userId, status: 'paid' }),
      Enrollment.find({ userId, completedAt: null })
        .populate('courseId', 'title thumbnail slug')
        .sort({ updatedAt: -1 })
        .limit(5),
    ]);
    sendSuccess(res, {
      enrolledCount,
      completedCount,
      ordersCount,
      recentCourses: inProgress.map((e) => ({
        courseId: e.courseId?._id,
        title: e.courseId?.title,
        slug: e.courseId?.slug,
        thumbnail: e.courseId?.thumbnail,
        progressPercent: e.progressPercent,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
