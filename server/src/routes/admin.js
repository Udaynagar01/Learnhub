import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Category } from '../models/Category.js';
import { slugify } from '../utils/slugify.js';
import { Order } from '../models/Order.js';
import { Enrollment } from '../models/Enrollment.js';
import { Review } from '../models/Review.js';
import { createNotification } from '../models/Notification.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { idParamSchema } from '../utils/validation.js';

const router = Router();
router.use('/admin', requireAuth, requireRole('admin'));

router.get('/admin/users', async (_req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    sendSuccess(res, users);
  } catch (e) {
    next(e);
  }
});

const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  role: z.enum(['student', 'instructor', 'admin']).optional(),
  instructorStatus: z.enum(['none', 'pending', 'approved', 'rejected']).optional(),
  isBanned: z.boolean().optional(),
});

const instructorApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

router.patch('/admin/users/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = adminUserUpdateSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(id, body, { new: true }).select('-passwordHash');
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.get('/admin/instructors/pending', async (_req, res, next) => {
  try {
    const pending = await User.find({ instructorStatus: 'pending' }).select('-passwordHash');
    sendSuccess(res, pending);
  } catch (e) {
    next(e);
  }
});

router.patch('/admin/instructors/:id/approve', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status } = instructorApprovalSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      id,
      { instructorStatus: status, role: status === 'approved' ? 'instructor' : 'student' },
      { new: true }
    ).select('-passwordHash');
    if (!user) throw new AppError('User not found', 404);
    const io = req.app.get('io');
    if (status === 'approved') {
      await createNotification(id, {
        type: 'instructor_approved',
        title: 'Instructor application approved',
        body: 'You can now create and publish courses.',
        link: '/instructor',
      });
      if (io) io.to(id).emit('instructor:approved', { userId: id });
    } else if (status === 'rejected') {
      await createNotification(id, {
        type: 'instructor_rejected',
        title: 'Instructor application declined',
        body: 'Contact support if you have questions.',
        link: '/become-instructor',
      });
    }
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.get('/admin/courses', async (_req, res, next) => {
  try {
    const courses = await Course.find().populate('instructorId', 'name').sort({ createdAt: -1 });
    sendSuccess(res, courses);
  } catch (e) {
    next(e);
  }
});

router.patch('/admin/courses/:id/status', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = z.object({ status: z.enum(['draft', 'published', 'rejected']) }).parse(req.body);
    const course = await Course.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    );
    if (!course) throw new AppError('Course not found', 404);
    sendSuccess(res, course);
  } catch (e) {
    next(e);
  }
});

router.get('/admin/orders', async (_req, res, next) => {
  try {
    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(50);
    sendSuccess(res, orders);
  } catch (e) {
    next(e);
  }
});

router.get('/admin/reviews', async (_req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('userId', 'name email')
      .populate('courseId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(100);
    sendSuccess(res, reviews);
  } catch (e) {
    next(e);
  }
});

router.delete('/admin/reviews/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const review = await Review.findByIdAndDelete(id);
    if (!review) throw new AppError('Not found', 404);
    const course = await Course.findById(review.courseId);
    if (course) {
      const remaining = await Review.find({ courseId: course._id });
      course.reviewCount = remaining.length;
      course.rating = remaining.length
        ? remaining.reduce((s, r) => s + r.rating, 0) / remaining.length
        : 0;
      await course.save();
    }
    sendSuccess(res, null, 'Review removed');
  } catch (e) {
    next(e);
  }
});

router.get('/admin/categories', async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    sendSuccess(res, categories);
  } catch (e) {
    next(e);
  }
});

const categorySchema = z.object({
  name: z.string().min(2),
  icon: z.string().optional(),
});

router.post('/admin/categories', async (req, res, next) => {
  try {
    const body = categorySchema.parse(req.body);
    let slug = slugify(body.name);
    const exists = await Category.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now()}`;
    const category = await Category.create({ ...body, slug });
    sendSuccess(res, category, 'Created', 201);
  } catch (e) {
    next(e);
  }
});

router.patch('/admin/categories/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = categorySchema.partial().parse(req.body);
    const updates = { ...body };
    if (body.name) updates.slug = slugify(body.name);
    const category = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!category) throw new AppError('Not found', 404);
    sendSuccess(res, category);
  } catch (e) {
    next(e);
  }
});

router.delete('/admin/categories/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const category = await Category.findById(id);
    if (!category) throw new AppError('Not found', 404);
    const inUse = await Course.exists({ categoryId: category._id });
    if (inUse) throw new AppError('Category has courses — reassign them first', 400);
    await category.deleteOne();
    sendSuccess(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/admin/analytics', async (_req, res, next) => {
  try {
    const [totalUsers, totalInstructors, totalCourses, orders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'instructor', instructorStatus: 'approved' }),
      Course.countDocuments({ status: 'published' }),
      Order.find({ status: 'paid' }),
    ]);
    const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const userGrowth = months.map((month, i) => ({
      month,
      users: Math.round(totalUsers / 6 + i * 10),
    }));
    const recentOrders = await Order.find({ status: 'paid' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    const topCourses = await Course.find({ status: 'published' })
      .sort({ studentCount: -1 })
      .limit(5)
      .select('title studentCount price');
    sendSuccess(res, {
      totalUsers,
      totalInstructors,
      totalCourses,
      totalRevenue,
      userGrowth,
      recentOrders,
      topCourses: topCourses.map((c) => ({
        _id: c._id,
        title: c.title,
        sales: c.studentCount,
        revenue: c.studentCount * c.price,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
