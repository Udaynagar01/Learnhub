import { Router } from 'express';
import { z } from 'zod';
import { SitePage } from '../models/SitePage.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const slugSchema = z.object({
  slug: z.enum(['help-center', 'terms-of-service', 'privacy-policy']),
});

const pageUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().max(50000),
  isPublished: z.boolean().optional(),
});

router.get('/pages', async (_req, res, next) => {
  try {
    const pages = await SitePage.find({ isPublished: true })
      .select('slug title updatedAt')
      .sort({ title: 1 });
    sendSuccess(res, pages);
  } catch (e) {
    next(e);
  }
});

router.get('/pages/:slug', async (req, res, next) => {
  try {
    const { slug } = slugSchema.parse(req.params);
    const page = await SitePage.findOne({ slug, isPublished: true });
    if (!page) throw new AppError('Page not found', 404);
    sendSuccess(res, page);
  } catch (e) {
    next(e);
  }
});

router.get('/admin/pages', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const pages = await SitePage.find().sort({ title: 1 });
    sendSuccess(res, pages);
  } catch (e) {
    next(e);
  }
});

router.put('/admin/pages/:slug', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { slug } = slugSchema.parse(req.params);
    const body = pageUpdateSchema.parse(req.body);
    const page = await SitePage.findOneAndUpdate(
      { slug },
      { ...body, slug },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    sendSuccess(res, page, 'Page saved');
  } catch (e) {
    next(e);
  }
});

export default router;
