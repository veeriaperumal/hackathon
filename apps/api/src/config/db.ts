import mongoose from 'mongoose';

// Disable Mongoose buffering so unhandled DB calls fail fast instead of hanging requests
mongoose.set('bufferCommands', false);

export async function connectDB(uri?: string) {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
  const dbUri = uri || process.env.MONGODB_URI;

  if (dbUri) {
    try {
      await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to MongoDB.');
      return;
    } catch (error: any) {
      console.warn(`MongoDB URI connection failed: ${error.message}`);
    }
  }

  if (isVercel) {
    console.warn('MONGODB_URI environment variable is missing on Vercel. Skipping local/memory DB fallback.');
    return;
  }

  // Local development fallback
  const localUri = 'mongodb://127.0.0.1:27017/campus_crisis';
  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`Connected to local MongoDB at ${localUri}`);
  } catch (error: any) {
    console.warn(`Local MongoDB not running (${error.message}). Attempting MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log(`Connected to MongoMemoryServer at ${memUri}`);
    } catch (memErr: any) {
      console.error('MongoMemoryServer fallback error:', memErr?.message || memErr);
    }
  }
}
