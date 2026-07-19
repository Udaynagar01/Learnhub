import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { objectIdSchema } from '../utils/validation.js';

const router = Router();

router.use(requireAuth);

router.get('/notifications', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    sendSuccess(res, { notifications, unreadCount });
  } catch (e) {
    next(e);
  }
});

router.patch('/notifications/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    sendSuccess(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const id = objectIdSchema.parse(req.params.id);
    const n = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!n) throw new AppError('Not found', 404);
    sendSuccess(res, n);
  } catch (e) {
    next(e);
  }
});

export default router;
