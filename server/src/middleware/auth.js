import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { AppError } from './errorHandler.js';

export function signAccessToken(userId) {
  return jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpires });
}

export function signRefreshToken(userId) {
  return jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpires });
}

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError('Unauthorized', 401);
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user || user.isBanned) throw new AppError('Unauthorized', 401);
    req.user = user;
    next();
  } catch (e) {
    next(e instanceof AppError ? e : new AppError('Unauthorized', 401));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }
    next();
  };
}

export function requireApprovedInstructor(req, _res, next) {
  if (req.user.role === 'admin') return next();
  if (req.user.role !== 'instructor' || req.user.instructorStatus !== 'approved') {
    return next(new AppError('Instructor approval required', 403));
  }
  next();
}
