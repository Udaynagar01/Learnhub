import mongoose from 'mongoose';

const sitePageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SitePage = mongoose.model('SitePage', sitePageSchema);
