import mongoose from 'mongoose';

// Disable Mongoose buffering when offline so failed calls fail fast instead of hanging
mongoose.set('bufferCommands', false);

export function formatMongoUri(rawUri: string): string {
  let cleaned = rawUri.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return cleaned;

  try {
    // If URI ends with .mongodb.net/ or .mongodb.net (no db name specified), append /campus_crisis
    if (cleaned.match(/\.mongodb\.net\/?$/i)) {
      cleaned = cleaned.replace(/\/?$/, '/campus_crisis');
    } else if (cleaned.match(/\.mongodb\.net\/\?/i)) {
      cleaned = cleaned.replace(/\.mongodb\.net\/\?/i, '.mongodb.net/campus_crisis?');
    }
  } catch (e) {
    // ignore parsing error
  }
  return cleaned;
}

export async function connectDB(uri?: string) {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
  const rawUri = uri || process.env.MONGODB_URI;
  const dbUri = rawUri ? formatMongoUri(rawUri) : '';

  if (dbUri) {
    try {
      await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 4000 });
      console.log('Connected to MongoDB Atlas.');
      return;
    } catch (error: any) {
      console.warn(`MongoDB connection failed (${error.message}). Check credentials, network access (0.0.0.0/0), or special characters in password.`);
    }
  }

  if (isVercel) {
    console.warn('MONGODB_URI environment variable is missing or invalid on Vercel. Skipping local/memory DB fallback.');
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
