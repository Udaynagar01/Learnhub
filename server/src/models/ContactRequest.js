import mongoose from 'mongoose';

const contactRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'closed'],
      default: 'new',
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

contactRequestSchema.index({ createdAt: -1 });
contactRequestSchema.index({ email: 1, createdAt: -1 });

export const ContactRequest = mongoose.model('ContactRequest', contactRequestSchema);
