import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { User } from '../models/User.js';
import { config } from '../config.js';
import { signAccessToken, signRefreshToken, requireAuth } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendPasswordResetEmail } from '../services/mailer.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/authValidation.js';

const router = Router();
const googleClient = new OAuth2Client(config.googleClientId);

const googleSchema = z.object({
  credential: z.string().min(1, 'Google sign-in failed'),
});

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

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

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const exists = await User.findOne({ email: body.email });
    if (exists) throw new AppError('Email already registered', 400);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role: 'student',
    });
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { user: userResponse(user), accessToken }, 'Registered', 201);
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email });
    if (!user || user.isBanned) throw new AppError('Invalid credentials', 401);
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new AppError('Invalid credentials', 401);
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { user: userResponse(user), accessToken });
  } catch (e) {
    next(e);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    if (!config.googleClientId) throw new AppError('Google login is not configured', 503);
    const body = googleSchema.parse(req.body);
    const ticket = await googleClient.verifyIdToken({
      idToken: body.credential,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      throw new AppError('Google account email is not verified', 401);
    }

    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (user?.isBanned) throw new AppError('Invalid credentials', 401);
    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        avatar: payload.picture,
        googleId: payload.sub,
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
        role: 'student',
      });
    } else {
      let changed = false;
      if (!user.googleId) {
        user.googleId = payload.sub;
        changed = true;
      }
      if (!user.avatar && payload.picture) {
        user.avatar = payload.picture;
        changed = true;
      }
      if (changed) await user.save();
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { user: userResponse(user), accessToken });
  } catch (e) {
    next(e);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase(), isBanned: false });
    let devResetUrl = null;
    let emailSent = false;

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      devResetUrl = `${config.clientUrl}/reset-password?token=${token}`;
      console.log(`Password reset link for ${user.email}: ${devResetUrl}`);
      try {
        emailSent = await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl: devResetUrl,
        });
      } catch (mailError) {
        console.error('Password reset email failed:', mailError.message);
      }
    }

    sendSuccess(
      res,
      config.nodeEnv === 'development' && devResetUrl ? { resetUrl: devResetUrl, emailSent } : { emailSent },
      emailSent
        ? 'If that email exists, a reset link has been sent.'
        : 'If that email exists, a reset link has been generated.'
    );
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(body.token).digest('hex');
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
      isBanned: false,
    });
    if (!user) throw new AppError('Reset link is invalid or expired', 400);

    user.passwordHash = await bcrypt.hash(body.password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    sendSuccess(res, null, 'Password reset successful');
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) throw new AppError('No refresh token', 401);
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    const user = await User.findById(decoded.userId);
    if (!user || user.isBanned) throw new AppError('Unauthorized', 401);
    const accessToken = signAccessToken(user._id);
    sendSuccess(res, { accessToken, user: userResponse(user) });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out');
});

router.get('/me', requireAuth, (req, res) => {
  sendSuccess(res, userResponse(req.user));
});

export default router;
