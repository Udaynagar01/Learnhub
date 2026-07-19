import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Category } from '../models/Category.js';
import { Enrollment } from '../models/Enrollment.js';
import { Order } from '../models/Order.js';
import { Quiz } from '../models/Quiz.js';
import { requireAuth, requireRole, requireApprovedInstructor } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { slugify } from '../utils/slugify.js';
import { config } from '../config.js';
import { uploadBuffer, uploadVideoFile } from '../services/cloudinary.js';
import { createVideoDiskStorage } from '../services/localUpload.js';
import { syncQuizWithCurriculum } from '../utils/generateQuizFromCourse.js';
import { isAllowedImage, isAllowedVideo } from '../utils/uploadMime.js';
import { isVideoAiConfigured, getActiveAiProvider } from '../services/aiQuizProvider.js';
import { objectIdSchema } from '../utils/validation.js';

const router = Router();
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const videoUpload = multer({
  storage: createVideoDiskStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
});

router.post('/instructor/apply', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === 'admin') throw new AppError('Already admin', 400);
    await User.findByIdAndUpdate(req.user._id, {
      instructorStatus: 'pending',
      role: req.user.role === 'student' ? 'instructor' : req.user.role,
    });
    sendSuccess(res, { status: 'pending' }, 'Application submitted');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/upload/image',
  requireAuth,
  requireRole('instructor', 'admin'),
  imageUpload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError('No file', 400);
      if (!isAllowedImage(req.file)) {
        throw new AppError('Use JPG, PNG, or WebP image', 400);
      }
      const result = await uploadBuffer(req.file.buffer, 'images', 'image', req.file.mimetype);
      sendSuccess(res, {
        url: result.secure_url || result.url,
        local: !!result.local,
        warning: result.warning,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/upload/video',
  requireAuth,
  requireRole('instructor', 'admin'),
  videoUpload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError('No file', 400);
      if (!isAllowedVideo(req.file)) {
        throw new AppError('Use MP4, WebM, or MOV video format', 400);
      }
      const result = await uploadVideoFile(req.file.path, req.file.size, req.file.mimetype);
      sendSuccess(res, {
        url: result.secure_url || result.url,
        local: !!result.local,
        warning: result.warning,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.use('/instructor', requireAuth, requireRole('instructor', 'admin'), requireApprovedInstructor);

router.get('/instructor/courses', async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { instructorId: req.user._id };
    const courses = await Course.find(filter).sort({ updatedAt: -1 });
    sendSuccess(res, courses);
  } catch (e) {
    next(e);
  }
});

router.get('/instructor/courses/:id', async (req, res, next) => {
  try {
    const id = objectIdSchema.parse(req.params.id);
    const course = await Course.findById(id);
    if (!course) throw new AppError('Not found', 404);
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden', 403);
    }
    sendSuccess(res, course);
  } catch (e) {
    next(e);
  }
});

const courseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0).optional(),
  isFree: z.boolean().optional(),
  categoryId: z.string().min(1, 'Please select a category'),
  level: z.string().optional(),
  whatYouLearn: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  sections: z.array(z.any()).optional(),
  thumbnail: z.string().optional(),
});

function pickCourseFields(body) {
  const parsed = courseSchema.parse(body);
  return {
    title: parsed.title,
    description: parsed.description,
    categoryId: parsed.categoryId,
    level: parsed.level,
    whatYouLearn: (parsed.whatYouLearn || []).filter((s) => s?.trim()),
    requirements: (parsed.requirements || []).filter((s) => s?.trim()),
    sections: parsed.sections || [],
    thumbnail: parsed.thumbnail,
    isFree: parsed.isFree ?? false,
    price: parsed.isFree ? 0 : parsed.price || 0,
  };
}

router.post('/instructor/courses', async (req, res, next) => {
  try {
    const body = pickCourseFields(req.body);
    let slug = slugify(body.title);
    const exists = await Course.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now()}`;
    const sections = body.sections || [];
    const lectureCount = sections.reduce((s, sec) => s + (sec.lessons?.length || 0), 0);
    const totalDuration = sections.reduce(
      (s, sec) => s + (sec.lessons?.reduce((ls, l) => ls + (l.duration || 0), 0) || 0),
      0
    );
    const course = await Course.create({
      ...body,
      slug,
      instructorId: req.user._id,
      lectureCount,
      totalDuration,
      status: 'draft',
      isFree: body.isFree ?? false,
      price: body.isFree ? 0 : body.price || 0,
    });
    await Category.findByIdAndUpdate(body.categoryId, { $inc: { courseCount: 1 } });
    if (sections.some((s) => s.lessons?.length)) {
      await syncQuizWithCurriculum(course, { replace: true });
    }
    sendSuccess(res, course, 'Created', 201);
  } catch (e) {
    next(e);
  }
});

router.put('/instructor/courses/:id', async (req, res, next) => {
  try {
    const id = objectIdSchema.parse(req.params.id);
    const course = await Course.findById(id);
    if (!course) throw new AppError('Not found', 404);
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden', 403);
    }
    const body = pickCourseFields(req.body);
    Object.assign(course, body);
    if (body.sections) {
      course.lectureCount = body.sections.reduce((s, sec) => s + (sec.lessons?.length || 0), 0);
      course.totalDuration = body.sections.reduce(
        (s, sec) => s + (sec.lessons?.reduce((ls, l) => ls + (l.duration || 0), 0) || 0),
        0
      );
    }
    await course.save();
    if (body.sections?.some((s) => s.lessons?.length)) {
      const existingQuiz = await Quiz.findOne({ courseId: course._id });
      if (!existingQuiz || existingQuiz.autoGenerated) {
        await syncQuizWithCurriculum(course, { replace: true });
      }
    }
    sendSuccess(res, course);
  } catch (e) {
    next(e);
  }
});

router.patch('/instructor/courses/:id/status', async (req, res, next) => {
  try {
    const id = objectIdSchema.parse(req.params.id);
    const { status } = req.body;
    if (!['draft', 'published'].includes(status)) {
      throw new AppError('Status must be draft or published', 400);
    }
    const course = await Course.findById(id);
    if (!course) throw new AppError('Not found', 404);
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden', 403);
    }
    if (status === 'published' && (!course.sections?.length || !course.thumbnail)) {
      throw new AppError('Add thumbnail and at least one section before publishing', 400);
    }
    course.status = status;
    await course.save();
    sendSuccess(res, course);
  } catch (e) {
    next(e);
  }
});

router.delete('/instructor/courses/:id', async (req, res, next) => {
  try {
    const id = objectIdSchema.parse(req.params.id);
    const course = await Course.findById(id);
    if (!course) throw new AppError('Not found', 404);
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden', 403);
    }
    await course.deleteOne();
    await Quiz.deleteMany({ courseId: course._id });
    sendSuccess(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/instructor/students', async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructorId }).select('_id title');
    const courseIds = courses.map((c) => c._id);
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate('userId', 'name email avatar')
      .populate('courseId', 'title')
      .sort({ updatedAt: -1 });

    const seen = new Set();
    const students = [];
    for (const e of enrollments) {
      const uid = e.userId?._id?.toString();
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      const userCourses = enrollments
        .filter((x) => x.userId?._id?.toString() === uid)
        .map((x) => ({ title: x.courseId?.title, progress: x.progressPercent }));
      students.push({
        _id: e.userId._id,
        name: e.userId.name,
        email: e.userId.email,
        avatar: e.userId.avatar,
        courses: userCourses,
        enrolledAt: e.createdAt,
      });
    }
    sendSuccess(res, students);
  } catch (e) {
    next(e);
  }
});

router.get('/instructor/earnings', async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructorId }).select('_id title price studentCount');
    const courseIds = courses.map((c) => c._id);
    const paidOrders = await Order.find({ status: 'paid', courseIds: { $in: courseIds } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const byCourse = courses.map((c) => {
      const orders = paidOrders.filter((o) => o.courseIds.some((id) => id.toString() === c._id.toString()));
      const gross = orders.reduce((s, o) => s + o.amount, 0);
      return {
        courseId: c._id,
        title: c.title,
        sales: orders.length,
        gross,
        earnings: Math.round(gross * config.instructorShare),
      };
    });

    const totalEarnings = byCourse.reduce((s, c) => s + c.earnings, 0);
    const recentPayouts = paidOrders.slice(0, 20).map((o) => ({
      orderId: o._id,
      amount: Math.round(o.amount * config.instructorShare),
      student: o.userId?.name,
      date: o.createdAt,
      status: 'paid',
    }));

    sendSuccess(res, { totalEarnings, byCourse, recentPayouts });
  } catch (e) {
    next(e);
  }
});

router.get('/instructor/stats', async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructorId });
    const courseIds = courses.map((c) => c._id);
    const totalStudents = await Enrollment.countDocuments({ courseId: { $in: courseIds } });
    const paidOrders = await Order.find({ status: 'paid', courseIds: { $in: courseIds } });
    const totalEarnings = paidOrders.reduce((s, o) => s + o.amount * config.instructorShare, 0);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const earningsChart = months.map((month, i) => ({
      month,
      earnings: Math.round(totalEarnings / 6 + i * 500),
    }));

    const recentStudents = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate('userId', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    const topCourses = courses
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        title: c.title,
        students: c.studentCount,
        earnings: Math.round(c.studentCount * c.price * config.instructorShare),
      }));

    sendSuccess(res, {
      totalCourses: courses.length,
      totalStudents,
      totalEarnings: Math.round(totalEarnings),
      avgRating: courses.length
        ? (courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1)
        : 0,
      earningsChart,
      recentStudents: recentStudents.map((e) => ({ name: e.userId?.name })),
      topCourses,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/instructor/quiz-ai-status', async (req, res, next) => {
  try {
    sendSuccess(res, {
      videoAiAvailable: isVideoAiConfigured(),
      provider: getActiveAiProvider(),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/instructor/courses/:id/quiz', async (req, res, next) => {
  try {
    const id = objectIdSchema.parse(req.params.id);
    const course = await Course.findById(id);
    if (!course) throw new AppError('Not found', 404);
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden', 403);
    }
    const quiz = await Quiz.findOne({ courseId: id });
    sendSuccess(res, quiz);
  } catch (e) {
    next(e);
  }
});

const quizSchema = z.object({
  title: z.string().min(1).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  timeLimitMinutes: z.number().min(1).max(180).optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        options: z.array(z.string().min(1)).min(2),
        correctIndex: z.number().int().min(0),
      })
    )
    .min(1),
});

router.post('/instructor/courses/:id/quiz', async (req, res, next) => {
  try {
    const id = objectIdSchema.parse(req.params.id);
    const course = await Course.findById(id);
    if (!course) throw new AppError('Not found', 404);
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden', 403);
    }
    const body = quizSchema.parse(req.body);
    body.questions.forEach((q, i) => {
      if (q.correctIndex >= q.options.length) {
        throw new AppError(`Question ${i + 1}: correctIndex out of range`, 400);
      }
    });
    const quiz = await Quiz.findOneAndUpdate(
      { courseId: id },
      { ...body, courseId: id, autoGenerated: false },
      { upsert: true, new: true }
    );
    sendSuccess(res, quiz);
  } catch (e) {
    next(e);
  }
});

router.post('/instructor/courses/:id/quiz/generate', async (req, res, next) => {
  try {
    const id = objectIdSchema.parse(req.params.id);
    const course = await Course.findById(id);
    if (!course) throw new AppError('Not found', 404);
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden', 403);
    }
    if (!course.sections?.some((s) => s.lessons?.length)) {
      throw new AppError('Add sections and lessons before generating a quiz', 400);
    }
    const fromVideo = req.body?.fromVideo === true;
    const result = await syncQuizWithCurriculum(course, { replace: true, fromVideo });
    if (!result?.quiz) throw new AppError('Could not generate quiz', 400);
    const { quiz, notice } = result;
    const message =
      notice ||
      (fromVideo
        ? quiz.generatedFrom === 'video'
          ? 'Quiz generated from video lecture content'
          : 'No transcripts available — generated from lesson metadata instead'
        : 'Quiz generated from lessons');
    sendSuccess(res, quiz, message);
  } catch (e) {
    next(e);
  }
});

export default router;
