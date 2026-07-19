import { Router } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category.js';
import { Course } from '../models/Course.js';
import { Review } from '../models/Review.js';
import { Enrollment } from '../models/Enrollment.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { objectIdSchema } from '../utils/validation.js';
import {
  buildCourseFilter,
  getCategoriesWithCounts,
  getCourseSort,
} from '../services/courseCatalog.js';

const router = Router();

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await getCategoriesWithCounts();
    sendSuccess(res, categories);
  } catch (e) {
    next(e);
  }
});

router.get('/courses', async (req, res, next) => {
  try {
    const { q, category, price, minRating, limit = 12, page = 1, sort = 'popular' } = req.query;

    let categoryId;
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) categoryId = cat._id;
      else {
        return sendSuccess(res, { courses: [], total: 0, page: Number(page), limit: Number(limit), totalPages: 0 });
      }
    }

    const filter = buildCourseFilter({ q, categoryId, price, minRating });
    const skip = (Number(page) - 1) * Number(limit);
    const sortBy = getCourseSort(sort);

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructorId', 'name avatar')
        .populate('categoryId', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit)),
      Course.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / Number(limit)) || 0;

    sendSuccess(res, {
      courses,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/courses/:slug', async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, status: 'published' })
      .populate('instructorId', 'name email avatar')
      .populate('categoryId', 'name slug');
    if (!course) throw new AppError('Course not found', 404);
    sendSuccess(res, { course });
  } catch (e) {
    next(e);
  }
});

router.get('/courses/:slug/reviews', async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) throw new AppError('Course not found', 404);
    const reviews = await Review.find({ courseId: course._id }).populate('userId', 'name').sort({ createdAt: -1 });
    sendSuccess(res, reviews);
  } catch (e) {
    next(e);
  }
});

router.get('/courses/id/:id', async (req, res, next) => {
  try {
    const id = objectIdSchema.parse(req.params.id);
    const course = await Course.findById(id).populate('instructorId', 'name');
    if (!course) throw new AppError('Course not found', 404);
    sendSuccess(res, course);
  } catch (e) {
    next(e);
  }
});

router.get('/courses/:slug/related', async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, status: 'published' });
    if (!course) throw new AppError('Course not found', 404);
    const related = await Course.find({
      _id: { $ne: course._id },
      status: 'published',
      categoryId: course.categoryId,
    })
      .populate('instructorId', 'name')
      .sort({ studentCount: -1 })
      .limit(4);
    sendSuccess(res, related);
  } catch (e) {
    next(e);
  }
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(2000),
});

router.post('/courses/:slug/reviews', requireAuth, async (req, res, next) => {
  try {
    const body = reviewSchema.parse(req.body);
    const course = await Course.findOne({ slug: req.params.slug, status: 'published' });
    if (!course) throw new AppError('Course not found', 404);

    const enrolled = await Enrollment.exists({ userId: req.user._id, courseId: course._id });
    if (!enrolled) throw new AppError('Enroll in the course to leave a review', 403);

    const review = await Review.findOneAndUpdate(
      { courseId: course._id, userId: req.user._id },
      { rating: body.rating, comment: body.comment },
      { upsert: true, new: true }
    ).populate('userId', 'name');

    const all = await Review.find({ courseId: course._id });
    course.reviewCount = all.length;
    course.rating = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await course.save();

    sendSuccess(res, review, 'Review saved', 201);
  } catch (e) {
    next(e);
  }
});

export default router;
