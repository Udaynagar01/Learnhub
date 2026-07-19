import { Router } from 'express';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getCategoriesWithCounts } from '../services/courseCatalog.js';

const router = Router();

router.get('/home', async (_req, res, next) => {
  try {
    const [categories, trending, latest, reviews, totalLearners, totalCourses, certificates, ratingStats] =
      await Promise.all([
        getCategoriesWithCounts({ sortByCount: true, limit: 6 }),
        Course.find({ status: 'published' })
          .populate('instructorId', 'name avatar')
          .populate('categoryId', 'name slug')
          .sort({ studentCount: -1, rating: -1, createdAt: -1 })
          .limit(4),
        Course.find({ status: 'published' })
          .populate('instructorId', 'name avatar')
          .populate('categoryId', 'name slug')
          .sort({ createdAt: -1 })
          .limit(4),
        Review.find()
          .populate('userId', 'name role')
          .populate('courseId', 'title slug')
          .sort({ createdAt: -1 })
          .limit(3),
        User.countDocuments({ isBanned: false }),
        Course.countDocuments({ status: 'published' }),
        Enrollment.countDocuments({ certificateId: { $exists: true, $ne: null } }),
        Course.aggregate([
          { $match: { status: 'published', reviewCount: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' },
              totalStudents: { $sum: '$studentCount' },
            },
          },
        ]),
      ]);

    const instructorAgg = await Course.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$instructorId',
          courses: { $sum: 1 },
          students: { $sum: '$studentCount' },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { students: -1, courses: -1 } },
      { $limit: 4 },
    ]);

    const instructorIds = instructorAgg.map((item) => item._id).filter(Boolean);
    const users = await User.find({ _id: { $in: instructorIds } }).select('name avatar role');
    const userById = new Map(users.map((user) => [user._id.toString(), user]));
    const topInstructors = instructorAgg
      .map((item) => {
        const user = userById.get(item._id?.toString());
        if (!user) return null;
        return {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          courses: item.courses,
          students: item.students,
          avgRating: Number((item.avgRating || 0).toFixed(1)),
        };
      })
      .filter(Boolean);

    const stats = {
      learners: totalLearners,
      courses: totalCourses,
      certificates,
      avgRating: Number((ratingStats[0]?.avgRating || 0).toFixed(1)),
      courseEnrollments: ratingStats[0]?.totalStudents || 0,
    };

    sendSuccess(res, {
      stats,
      categories,
      trending,
      recommended: latest,
      topInstructors,
      reviews,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
