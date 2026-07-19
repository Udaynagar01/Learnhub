import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

reviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
