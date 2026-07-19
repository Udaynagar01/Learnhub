import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    videoUrl: String,
    /** Cached speech-to-text from lesson video (used for AI quiz generation). */
    transcript: String,
    duration: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
  },
  { _id: true }
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    lessons: [lessonSchema],
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: String,
    thumbnail: String,
    previewVideo: String,
    price: { type: Number, default: 0 },
    originalPrice: Number,
    isFree: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published', 'rejected'], default: 'draft' },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    level: { type: String, default: 'Beginner' },
    language: { type: String, default: 'English' },
    whatYouLearn: [String],
    requirements: [String],
    sections: [sectionSchema],
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    studentCount: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    lectureCount: { type: Number, default: 0 },
    certificate: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);

export function getAllLessonIds(course) {
  const ids = [];
  for (const section of course.sections || []) {
    for (const lesson of section.lessons || []) {
      if (lesson._id) ids.push(lesson._id.toString());
    }
  }
  return ids;
}

export function getTotalLessons(course) {
  return (course.sections || []).reduce((sum, s) => sum + (s.lessons?.length || 0), 0);
}
