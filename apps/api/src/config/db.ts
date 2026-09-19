import mongoose from 'mongoose';

export async function connectDB(uri?: string) {
  const dbUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_crisis';
  try {
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`Connected to MongoDB at ${dbUri}`);
  } catch (error: any) {
    console.warn(`Local MongoDB not connected (${error.message}). Attempting memory server fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log(`Connected to MongoMemoryServer at ${memUri}`);
    } catch (memErr) {
      console.error('MongoMemoryServer fallback error:', memErr);
    }
  }
}
