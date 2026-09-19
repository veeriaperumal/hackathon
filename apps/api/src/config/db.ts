import mongoose from 'mongoose';

export async function connectDB(uri?: string) {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const dbUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_crisis';
  try {
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB.');
  } catch (error: any) {
    console.warn(`MongoDB connection warning (${error.message}). Attempting memory server fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log(`Connected to MongoMemoryServer at ${memUri}`);
    } catch (memErr: any) {
      console.error('MongoMemoryServer fallback failed:', memErr?.message || memErr);
    }
  }
}
