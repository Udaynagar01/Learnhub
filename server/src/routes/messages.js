import { Router } from 'express';
import { z } from 'zod';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { createNotification } from '../models/Notification.js';
import { objectIdSchema } from '../utils/validation.js';

const router = Router();

router.use(requireAuth);

function serializeMessage(m) {
  const o = m.toObject ? m.toObject() : m;
  return {
    ...o,
    status: o.status || (o.read ? 'read' : 'sent'),
  };
}

function isUserOnline(io, userId) {
  const room = io?.sockets?.adapter?.rooms?.get(userId.toString());
  return room && room.size > 0;
}

function messageLinkForRole(role, otherUserId) {
  if (role === 'instructor' || role === 'admin') {
    return `/instructor/messages?user=${otherUserId}`;
  }
  return `/dashboard/messages?user=${otherUserId}`;
}

router.get('/messages/unread-count', async (req, res, next) => {
  try {
    const unread = await Message.countDocuments({
      to: req.user._id,
      read: false,
    });
    sendSuccess(res, { unread });
  } catch (e) {
    next(e);
  }
});

router.get('/messages/conversations', async (req, res, next) => {
  try {
    const uid = req.user._id;
    const messages = await Message.find({ $or: [{ from: uid }, { to: uid }] })
      .sort({ createdAt: -1 })
      .populate('from', 'name avatar role email')
      .populate('to', 'name avatar role email');

    const byUser = new Map();
    for (const m of messages) {
      const other = m.from._id.toString() === uid.toString() ? m.to : m.from;
      const key = other._id.toString();
      if (!byUser.has(key)) {
        const unread = await Message.countDocuments({
          from: other._id,
          to: uid,
          read: false,
        });
        byUser.set(key, {
          user: {
            _id: other._id,
            name: other.name,
            email: other.email,
            avatar: other.avatar,
            role: other.role,
          },
          lastMessage: m.text,
          lastAt: m.createdAt,
          lastStatus: m.from._id.toString() === uid.toString() ? m.status : null,
          unread,
        });
      }
    }
    let list = Array.from(byUser.values());
    const q = (req.query.q || '').trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.user.name?.toLowerCase().includes(q) ||
          c.user.email?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
});

router.get('/messages/with/:userId', async (req, res, next) => {
  try {
    const uid = req.user._id;
    const otherId = objectIdSchema.parse(req.params.userId);
    const other = await User.findById(otherId).select('name avatar role');
    if (!other) throw new AppError('User not found', 404);

    const thread = await Message.find({
      $or: [
        { from: uid, to: otherId },
        { from: otherId, to: uid },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200);

    const toMark = await Message.find({
      from: otherId,
      to: uid,
      status: { $ne: 'read' },
    }).select('_id');

    if (toMark.length) {
      await Message.updateMany(
        { from: otherId, to: uid, status: { $ne: 'read' } },
        { read: true, status: 'read' }
      );
      const io = req.app.get('io');
      if (io) {
        io.to(otherId.toString()).emit('message:read', {
          messageIds: toMark.map((x) => x._id.toString()),
          readBy: uid.toString(),
        });
      }
    }

    sendSuccess(res, {
      user: other,
      messages: thread.map((m) => {
        const s = serializeMessage(m);
        if (toMark.some((x) => x._id.equals(m._id))) s.status = 'read';
        return s;
      }),
    });
  } catch (e) {
    next(e);
  }
});

const sendSchema = z.object({ text: z.string().min(1).max(2000) });

router.post('/messages/with/:userId', async (req, res, next) => {
  try {
    const body = sendSchema.parse(req.body);
    const userId = objectIdSchema.parse(req.params.userId);
    const to = await User.findById(userId);
    if (!to) throw new AppError('User not found', 404);
    if (to._id.equals(req.user._id)) throw new AppError('Cannot message yourself', 400);

    const io = req.app.get('io');
    const online = isUserOnline(io, to._id);

    const message = await Message.create({
      from: req.user._id,
      to: to._id,
      text: body.text,
      status: online ? 'delivered' : 'sent',
    });

    const payload = serializeMessage(message);

    if (io) {
      io.to(to._id.toString()).emit('message:new', {
        ...payload,
        from: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
      });
      if (online) {
        io.to(req.user._id.toString()).emit('message:delivered', {
          messageId: message._id.toString(),
        });
      }
    }

    const link = messageLinkForRole(to.role, req.user._id);
    await createNotification(to._id, {
      type: 'message',
      title: `New message from ${req.user.name}`,
      body: body.text.length > 80 ? `${body.text.slice(0, 80)}…` : body.text,
      link,
      meta: { fromUserId: req.user._id, messageId: message._id },
    });

    if (io) {
      io.to(to._id.toString()).emit('notification:new', {
        type: 'message',
        title: `New message from ${req.user.name}`,
        link,
      });
    }

    sendSuccess(res, payload, 'Sent', 201);
  } catch (e) {
    next(e);
  }
});

router.patch('/messages/:messageId/delivered', async (req, res, next) => {
  try {
    const messageId = objectIdSchema.parse(req.params.messageId);
    const msg = await Message.findOne({
      _id: messageId,
      to: req.user._id,
      status: 'sent',
    });
    if (!msg) return sendSuccess(res, { ok: true });

    msg.status = 'delivered';
    await msg.save();

    const io = req.app.get('io');
    if (io) {
      io.to(msg.from.toString()).emit('message:delivered', {
        messageId: msg._id.toString(),
      });
    }
    sendSuccess(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/messages/contacts', async (req, res, next) => {
  try {
    const uid = req.user._id;
    let contacts = [];

    if (req.user.role === 'instructor' || req.user.role === 'admin') {
      const courseFilter =
        req.user.role === 'admin' ? {} : { instructorId: uid };
      const courses = await Course.find(courseFilter).select('_id');
      const courseIds = courses.map((c) => c._id);
      const enrollments = await Enrollment.find({ courseId: { $in: courseIds } }).populate(
        'userId',
        'name email avatar role'
      );
      const seen = new Set();
      for (const e of enrollments) {
        const u = e.userId;
        if (!u || u._id.equals(uid) || seen.has(u._id.toString())) continue;
        seen.add(u._id.toString());
        contacts.push(u);
      }
      if (req.user.role === 'admin') {
        const admins = await User.find({
          _id: { $ne: uid },
          role: { $in: ['instructor', 'student', 'admin'] },
          isBanned: false,
        })
          .select('name email avatar role')
          .limit(30);
        for (const u of admins) {
          if (!seen.has(u._id.toString())) contacts.push(u);
        }
      }
    } else {
      const enrollments = await Enrollment.find({ userId: uid }).populate({
        path: 'courseId',
        populate: { path: 'instructorId', select: 'name email avatar role' },
      });
      const seen = new Set();
      for (const e of enrollments) {
        const inst = e.courseId?.instructorId;
        if (!inst || seen.has(inst._id.toString())) continue;
        seen.add(inst._id.toString());
        contacts.push(inst);
      }
      const support = await User.find({ role: 'admin', isBanned: false })
        .select('name email avatar role')
        .limit(3);
      for (const u of support) {
        if (!seen.has(u._id.toString())) contacts.push(u);
      }
    }

    contacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const q = (req.query.q || '').trim().toLowerCase();
    if (q) {
      contacts = contacts.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }

    sendSuccess(res, contacts);
  } catch (e) {
    next(e);
  }
});

export default router;
