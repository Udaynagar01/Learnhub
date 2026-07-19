import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const messages = err.errors.map((e) => e.message).filter(Boolean);
    return res.status(400).json({
      success: false,
      message: messages.join('. ') || 'Validation failed',
      errors: fieldErrors,
    });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File is too large. Videos can be up to 1 GB on this server.',
    });
  }
  if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Restart the API or start MongoDB on port 27017.',
    });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}
