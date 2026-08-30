import mongoose from 'mongoose';
import { config } from './env.js';

let isConnectedToMongo = false;

export async function connectDB() {
  const uri = config.mongodbUri || 'mongodb://127.0.0.1:27017/lifeos';
  const isCloudUri = uri.includes('mongodb+srv://') || (config.mongodbUri && config.mongodbUri.length > 0);
  const timeoutMs = isCloudUri ? 10000 : 2500;

  try {
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
    });
    isConnectedToMongo = true;
    const dbName = mongoose.connection.name || 'lifeos';
    const host = mongoose.connection.host || 'connected';
    console.log(`[Database] MongoDB connected successfully to ${host} (Database: ${dbName})`);
  } catch (err) {
    isConnectedToMongo = false;
    console.warn(`[Database] MongoDB connection failed (${err.message}). Using In-Memory Database Fallback.`);
  }
}

export function isMongoActive() {
  return isConnectedToMongo && mongoose.connection.readyState === 1;
}

export function getMongoDetails() {
  const active = isMongoActive();
  return {
    connected: active,
    type: active ? 'mongodb' : 'in-memory-fallback',
    name: active ? (mongoose.connection.name || 'lifeos') : 'in-memory',
    host: active ? (mongoose.connection.host || 'MongoDB Atlas') : 'local',
  };
}
