import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true }
);

announcementSchema.index({ courseId: 1, createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
