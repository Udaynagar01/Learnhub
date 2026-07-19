import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
