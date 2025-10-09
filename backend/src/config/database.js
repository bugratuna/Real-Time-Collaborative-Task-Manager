const mongoose = require('mongoose');

const buildMongoUri = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const host = process.env.MONGODB_HOST || '127.0.0.1';
  const port = process.env.MONGODB_PORT || '27017';
  const database = process.env.MONGODB_DATABASE || 'collaborative-task-manager';

  return `mongodb://${host}:${port}/${database}`;
};

const connectDB = async () => {
  const mongoUri = buildMongoUri();

  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || undefined
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = { connectDB };
