import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnhub',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production-32chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production-32chars',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '24h',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  instructorShare: parseFloat(process.env.INSTRUCTOR_REVENUE_SHARE || '0.7'),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@learnhub.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  mail: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    whisperModel: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  },
  /** Google Gemini — free tier at https://aistudio.google.com/apikey */
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },
};
