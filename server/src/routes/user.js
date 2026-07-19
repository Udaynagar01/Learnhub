import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { nameField, changePasswordSchema } from '../utils/authValidation.js';

const router = Router();

function userResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    instructorStatus: user.instructorStatus,
    emailPreferences: user.emailPreferences,
  };
}

const profileSchema = z.object({
  name: nameField.optional(),
  avatar: z.string().max(500).optional(),
});

const emailPreferencesSchema = z.object({
  marketing: z.boolean(),
  courseUpdates: z.boolean(),
  weeklyDigest: z.boolean(),
});

router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const body = profileSchema.parse(req.body);
    const updates = {};
    if (body.name) updates.name = body.name;
    if (body.avatar !== undefined) updates.avatar = body.avatar || undefined;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    sendSuccess(res, userResponse(user));
  } catch (e) {
    next(e);
  }
});

router.patch('/email-preferences', requireAuth, async (req, res, next) => {
  try {
    const emailPreferences = emailPreferencesSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { emailPreferences },
      { new: true }
    );
    sendSuccess(res, userResponse(user), 'Email preferences saved');
  } catch (e) {
    next(e);
  }
});

router.patch('/password', requireAuth, async (req, res, next) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user._id);
    const ok = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!ok) throw new AppError('Current password is incorrect', 400);
    user.passwordHash = await bcrypt.hash(body.newPassword, 12);
    await user.save();
    sendSuccess(res, null, 'Password updated');
  } catch (e) {
    next(e);
  }
});

export default router;
