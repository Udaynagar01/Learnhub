import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'order_paid',
        'instructor_approved',
        'instructor_rejected',
        'course_published',
        'message',
        'question',
        'question_answered',
        'course_announcement',
        'contact_request',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: String,
    link: String,
    read: { type: Boolean, default: false },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);

export async function createNotification(userId, payload) {
  return Notification.create({ userId, ...payload });
}
