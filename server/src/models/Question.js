import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 3000 },
  },
  { timestamps: true }
);

const questionSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    resolved: { type: Boolean, default: false },
    answers: [answerSchema],
  },
  { timestamps: true }
);

questionSchema.index({ courseId: 1, lessonId: 1, createdAt: -1 });

export const Question = mongoose.model('Question', questionSchema);
