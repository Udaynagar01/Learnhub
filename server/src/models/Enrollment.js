import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    progressPercent: { type: Number, default: 0 },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
    lessonProgress: [
      {
        lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
        notes: { type: String, default: '', maxlength: 10000 },
        lastWatchedSeconds: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    quizPassed: { type: Boolean, default: false },
    quizScore: Number,
    completedAt: Date,
    certificateId: String,
  },
  { timestamps: true }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
