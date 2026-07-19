import { Router } from 'express';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { generateCertificatePDF } from '../services/certificate.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { objectIdSchema } from '../utils/validation.js';

const router = Router();

router.get('/certificates/verify/:certificateId', async (req, res, next) => {
  try {
    const certificateId = req.params.certificateId.trim().toUpperCase();
    const enrollment = await Enrollment.findOne({ certificateId });
    if (!enrollment || !enrollment.completedAt) throw new AppError('Certificate not found', 404);
    const [course, student] = await Promise.all([
      Course.findById(enrollment.courseId).populate('instructorId', 'name'),
      User.findById(enrollment.userId).select('name'),
    ]);
    if (!course || !student) throw new AppError('Certificate not found', 404);
    sendSuccess(res, {
      certificateId: enrollment.certificateId,
      studentName: student.name,
      courseTitle: course.title,
      instructorName: course.instructorId?.name || 'Course Instructor',
      completedAt: enrollment.completedAt,
      issuedAt: enrollment.completedAt,
      valid: true,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/certificates/:enrollmentId', requireAuth, async (req, res, next) => {
  try {
    const enrollmentId = objectIdSchema.parse(req.params.enrollmentId);
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not found', 404);
    }
    if (!enrollment.certificateId) throw new AppError('Certificate not available yet', 400);
    const course = await Course.findById(enrollment.courseId).populate('instructorId', 'name');
    const pdf = await generateCertificatePDF({
      studentName: req.user.name,
      courseTitle: course.title,
      certificateId: enrollment.certificateId,
      completedAt: enrollment.completedAt,
      instructorName: course.instructorId?.name || 'Course Instructor',
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${course.slug}-certificate.pdf"`);
    res.send(pdf);
  } catch (e) {
    next(e);
  }
});

export default router;
