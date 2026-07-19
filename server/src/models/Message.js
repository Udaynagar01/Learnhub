import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
    /** sent → delivered (recipient online) → read (thread opened) */
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, read: 1 });

export const Message = mongoose.model('Message', messageSchema);
