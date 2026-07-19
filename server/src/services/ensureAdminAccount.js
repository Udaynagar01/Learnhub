import bcrypt from 'bcrypt';
import { config } from '../config.js';
import { User } from '../models/User.js';

/**
 * Ensures the admin account from .env exists and can always log in.
 * Safe to run on every server start — does not delete other users.
 */
export async function ensureAdminAccount() {
  const email = config.adminEmail.toLowerCase();
  const passwordHash = await bcrypt.hash(config.adminPassword, 12);

  let admin = await User.findOne({ email });

  if (admin) {
    let changed = false;
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      changed = true;
    }
    if (admin.instructorStatus !== 'approved') {
      admin.instructorStatus = 'approved';
      changed = true;
    }
    if (admin.isBanned) {
      admin.isBanned = false;
      changed = true;
    }
    const passwordOk = await bcrypt.compare(config.adminPassword, admin.passwordHash);
    if (!passwordOk) {
      admin.passwordHash = passwordHash;
      changed = true;
    }
    if (changed) await admin.save();
    return admin;
  }

  admin = await User.create({
    name: 'Admin',
    email,
    passwordHash,
    role: 'admin',
    instructorStatus: 'approved',
  });

  return admin;
}
