import { Router } from 'express';
import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Course } from '../models/Course.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { getRazorpay, verifyPaymentSignature } from '../services/razorpay.js';
import { config } from '../config.js';
import { createEnrollment } from './enrollments.js';
import { createNotification } from '../models/Notification.js';
import { objectIdSchema } from '../utils/validation.js';

const router = Router();

const checkoutSchema = {
  parse(body) {
    const courseIds = Array.isArray(body.courseIds) ? body.courseIds : [];
    const parsed = courseIds.map((id) => objectIdSchema.parse(id));
    if (!parsed.length) throw new AppError('No courses selected', 400);
    if (new Set(parsed).size !== parsed.length) throw new AppError('Duplicate courses in cart', 400);
    return { courseIds: parsed };
  },
};

const paymentVerifySchema = {
  parse(body) {
    return {
      orderId: objectIdSchema.parse(body.orderId),
      razorpay_order_id: String(body.razorpay_order_id || ''),
      razorpay_payment_id: String(body.razorpay_payment_id || ''),
      razorpay_signature: String(body.razorpay_signature || ''),
    };
  },
};

router.get('/orders/my', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('courseIds', 'title slug thumbnail price')
      .sort({ createdAt: -1 });
    sendSuccess(res, orders);
  } catch (e) {
    next(e);
  }
});

router.post('/orders/checkout', requireAuth, async (req, res, next) => {
  try {
    const { courseIds } = checkoutSchema.parse(req.body);
    const courses = await Course.find({ _id: { $in: courseIds }, status: 'published' });
    const amount = courses.reduce((s, c) => s + (c.isFree ? 0 : c.price), 0);
    if (amount <= 0) throw new AppError('Invalid cart', 400);

    const order = await Order.create({
      userId: req.user._id,
      courseIds: courses.map((c) => c._id),
      amount,
    });

    const razorpay = getRazorpay();
    if (!razorpay) {
      // Dev mode without Razorpay keys — mark paid and enroll
      order.status = 'paid';
      await order.save();
      for (const c of courses) await createEnrollment(req.user._id, c._id);
      await createNotification(req.user._id, {
        type: 'order_paid',
        title: 'Enrollment successful',
        body: `You enrolled in ${courses.length} course(s) (dev mode).`,
        link: '/dashboard/learning',
      });
      return sendSuccess(res, {
        devMode: true,
        dbOrderId: order._id,
        amount: order.amount,
        order: await Order.findById(order._id).populate('courseIds', 'title slug price'),
        message: 'Dev payment — enrolled (add RAZORPAY keys for real payments)',
      });
    }

    const rzOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: order._id.toString(),
    });
    order.razorpayOrderId = rzOrder.id;
    await order.save();
    sendSuccess(res, {
      orderId: rzOrder.id,
      amount,
      keyId: config.razorpay.keyId,
      dbOrderId: order._id,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/payments/verify', requireAuth, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = paymentVerifySchema.parse(req.body);
    const order = await Order.findById(orderId);
    if (!order || order.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Order not found', 404);
    }
    if (order.status === 'paid') return sendSuccess(res, { alreadyPaid: true });

    const razorpay = getRazorpay();
    if (razorpay && !verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      throw new AppError('Invalid payment signature', 400);
    }

    order.status = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpayOrderId = razorpay_order_id;
    await order.save();

    for (const cid of order.courseIds) {
      await createEnrollment(req.user._id, cid);
    }

    await createNotification(req.user._id, {
      type: 'order_paid',
      title: 'Payment successful',
      body: `Your order of ₹${order.amount} was completed.`,
      link: '/dashboard/learning',
      meta: { orderId: order._id },
    });

    const io = req.app.get('io');
    if (io) io.to(req.user._id.toString()).emit('order:paid', { orderId: order._id });

    const populated = await Order.findById(order._id).populate('courseIds', 'title slug price');

    sendSuccess(res, {
      paid: true,
      order: populated,
      razorpayPaymentId: razorpay_payment_id,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/webhooks/razorpay', async (req, res) => {
  const secret = config.razorpay.webhookSecret;
  if (secret) {
    const sig = req.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    if (sig !== expected) return res.status(400).send('Invalid signature');
  }
  const event = req.body?.event;
  if (event === 'payment.captured') {
    const payment = req.body.payload?.payment?.entity;
    const order = await Order.findOne({ razorpayOrderId: payment?.order_id });
    if (order && order.status !== 'paid') {
      order.status = 'paid';
      order.razorpayPaymentId = payment.id;
      await order.save();
      for (const cid of order.courseIds) await createEnrollment(order.userId, cid);
    }
  }
  res.json({ ok: true });
});

export default router;
