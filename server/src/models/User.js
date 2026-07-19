import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    googleId: { type: String, index: true },
    name: { type: String, required: true },
    avatar: String,
    role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
    instructorStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    emailPreferences: {
      marketing: { type: Boolean, default: true },
      courseUpdates: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
    },
    passwordResetTokenHash: String,
    passwordResetExpires: Date,
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
