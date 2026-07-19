import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config.js';

let instance = null;

export function getRazorpay() {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return instance;
}

export function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');
  return expected === signature;
}
