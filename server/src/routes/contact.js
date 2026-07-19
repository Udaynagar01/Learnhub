import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { ContactRequest } from '../models/ContactRequest.js';
import { User } from '../models/User.js';
import { createNotification } from '../models/Notification.js';
import { config } from '../config.js';
import { sendContactRequestEmail, sendContactAutoReplyEmail } from '../services/mailer.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Enter a valid email').max(120),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(140),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000),
});

async function currentUserFromHeader(req) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    return User.findById(decoded.userId).select('_id name email role isBanned');
  } catch {
    return null;
  }
}

router.post('/contact', async (req, res, next) => {
  try {
    const body = contactSchema.parse(req.body);
    const user = await currentUserFromHeader(req);

    const contactRequest = await ContactRequest.create({
      ...body,
      userId: user && !user.isBanned ? user._id : undefined,
    });

    const admins = await User.find({ role: 'admin', isBanned: false }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        createNotification(admin._id, {
          type: 'contact_request',
          title: `New contact request from ${body.name}`,
          body: body.subject,
          link: '/admin',
          meta: { contactRequestId: contactRequest._id },
        })
      )
    );

    const io = req.app.get('io');
    admins.forEach((admin) => {
      io?.to(admin._id.toString()).emit('notification:new', {
        type: 'contact_request',
        title: `New contact request from ${body.name}`,
        body: body.subject,
        link: '/admin',
      });
    });

    let emailSent = false;
    let autoReplySent = false;
    try {
      emailSent = await sendContactRequestEmail({
        to: config.adminEmail,
        name: body.name,
        email: body.email,
        subject: body.subject,
        message: body.message,
        requestId: contactRequest._id.toString(),
      });
    } catch (mailError) {
      console.error('Contact email failed:', mailError.message);
    }

    try {
      autoReplySent = await sendContactAutoReplyEmail({
        to: body.email,
        name: body.name,
        subject: body.subject,
      });
    } catch (mailError) {
      console.error('Contact auto-reply failed:', mailError.message);
    }

    sendSuccess(
      res,
      { id: contactRequest._id, emailSent, autoReplySent },
      autoReplySent
        ? 'Thanks! Your message has been sent. A confirmation email is on its way to your inbox.'
        : emailSent
          ? 'Thanks! Your message has been sent. We will get back to you soon.'
          : 'Message saved. Email delivery is not configured yet.',
      201
    );
  } catch (e) {
    next(e);
  }
});

export default router;
