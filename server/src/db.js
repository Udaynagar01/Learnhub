import mongoose from 'mongoose';
import { config } from './config.js';

let memoryServer = null;

async function connectWithUri(uri) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });
}

async function startMemoryServer() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri('learnhub');
  await connectWithUri(uri);
  console.log('In-memory MongoDB ready (USE_MEMORY_DB=true)');
}

function isAtlasUri(uri) {
  return /^mongodb\+srv:\/\//i.test(uri);
}

export async function connectDB() {
  if (process.env.USE_MEMORY_DB === 'true') {
    await startMemoryServer();
    return;
  }

  try {
    await connectWithUri(config.mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    if (isAtlasUri(config.mongoUri)) {
      console.error('\nMongoDB Atlas connection failed.');
      console.error('Check server/.env MONGODB_URI, Atlas database user/password, and Network Access IP allowlist.\n');
      throw err;
    }

    if (config.nodeEnv === 'development' && process.env.USE_MEMORY_DB === 'true') {
      console.warn('\nUSE_MEMORY_DB=true — using in-memory database (accounts will NOT persist).\n');
      await startMemoryServer();
      return;
    }

    console.error('\nMongoDB is not running on port 27017.');
    console.error('LearnHub saves accounts permanently in MongoDB.');
    console.error('From project root run:  npm run dev');
    console.error('Or start MongoDB manually:  npm run mongo\n');
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
