import { isMongoActive } from '../config/db.js';
import { User } from './User.js';
import { Responsibility } from './Responsibility.js';
import { Source } from './Source.js';
import { ProcessingRun } from './ProcessingRun.js';
import { ProcessingLog } from './ProcessingLog.js';
import { Integration } from './Integration.js';
import { Document } from './Document.js';
import { Notification } from './Notification.js';
import { AgentMemory } from './AgentMemory.js';
import { v4 as uuidv4 } from 'uuid';

// In-Memory storage collections
const memoryStore = {
  users: new Map(),
  responsibilities: new Map(),
  sources: new Map(),
  processingRuns: new Map(),
  processingLogs: new Map(),
  integrations: new Map(),
  documents: new Map(),
  notifications: new Map(),
  agentMemories: new Map(),
};

import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), '.local_db.json');

function saveStoreToDisk() {
  if (isMongoActive()) return;
  try {
    const serialized = {};
    for (const [key, map] of Object.entries(memoryStore)) {
      serialized[key] = Array.from(map.entries());
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(serialized), 'utf8');
  } catch (err) {}
}

function loadStoreFromDisk() {
  if (isMongoActive()) return;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      for (const [key, entries] of Object.entries(data)) {
        if (memoryStore[key] && Array.isArray(entries)) {
          memoryStore[key] = new Map(entries);
        }
      }
    }
  } catch (err) {}
}

// Initial load
loadStoreFromDisk();

function matchesQuery(item, query = {}) {
  for (const [key, val] of Object.entries(query)) {
    if (val === undefined) continue;
    if (key === '$or' && Array.isArray(val)) {
      const orMatched = val.some((subQuery) => matchesQuery(item, subQuery));
      if (!orMatched) return false;
      continue;
    }
    if (key === '$and' && Array.isArray(val)) {
      const andMatched = val.every((subQuery) => matchesQuery(item, subQuery));
      if (!andMatched) return false;
      continue;
    }
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if ('$in' in val && Array.isArray(val.$in)) {
        if (!val.$in.includes(item[key])) return false;
        continue;
      }
      if ('$gte' in val) {
        if (!(new Date(item[key]) >= new Date(val.$gte))) return false;
        continue;
      }
      if ('$lte' in val) {
        if (!(new Date(item[key]) <= new Date(val.$lte))) return false;
        continue;
      }
      if ('$gt' in val) {
        if (!(new Date(item[key]) > new Date(val.$gt))) return false;
        continue;
      }
      if ('$lt' in val) {
        if (!(new Date(item[key]) < new Date(val.$lt))) return false;
        continue;
      }
      if ('$regex' in val) {
        const flags = val.$options || '';
        const regex = new RegExp(val.$regex, flags);
        if (!regex.test(item[key] || '')) return false;
        continue;
      }
    }
    if (String(item[key]) !== String(val)) {
      return false;
    }
  }
  return true;
}

class MemoryModelHandler {
  constructor(collectionName, MongooseModel) {
    this.collectionName = collectionName;
    this.MongooseModel = MongooseModel;
  }

  get map() {
    return memoryStore[this.collectionName];
  }

  async find(query = {}, sort = { createdAt: -1 }, limit = 0, skip = 0) {
    if (isMongoActive()) {
      let q = this.MongooseModel.find(query);
      if (sort) q = q.sort(sort);
      if (skip) q = q.skip(skip);
      if (limit) q = q.limit(limit);
      return await q.exec();
    }
    let items = Array.from(this.map.values()).filter((item) => matchesQuery(item, query));
    if (sort) {
      const [field, dir] = Object.entries(sort)[0] || ['createdAt', -1];
      items.sort((a, b) => {
        const valA = a[field] || '';
        const valB = b[field] || '';
        if (valA < valB) return dir === 1 || dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 1 || dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    if (skip) items = items.slice(skip);
    if (limit && limit > 0) items = items.slice(0, limit);
    return items;
  }

  async findOne(query = {}) {
    if (isMongoActive()) {
      return await this.MongooseModel.findOne(query).exec();
    }
    return Array.from(this.map.values()).find((item) => matchesQuery(item, query)) || null;
  }

  async findById(id) {
    if (!id) return null;
    if (isMongoActive()) {
      try {
        return await this.MongooseModel.findById(id).exec();
      } catch (err) {
        return null;
      }
    }
    return this.map.get(String(id)) || null;
  }

  async create(data) {
    if (isMongoActive()) {
      return await this.MongooseModel.create(data);
    }
    const id = data._id ? String(data._id) : uuidv4();
    const item = {
      _id: id,
      id: id,
      ...data,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.map.set(id, item);
    saveStoreToDisk();
    return item;
  }

  async findByIdAndUpdate(id, updates, options = { new: true }) {
    if (isMongoActive()) {
      return await this.MongooseModel.findByIdAndUpdate(id, updates, options).exec();
    }
    const strId = String(id);
    const existing = this.map.get(strId);
    if (!existing) return null;

    const modified = {
      ...existing,
      ...(updates.$set || updates),
      updatedAt: new Date(),
    };
    this.map.set(strId, modified);
    saveStoreToDisk();
    return modified;
  }

  async findByIdAndDelete(id) {
    if (isMongoActive()) {
      return await this.MongooseModel.findByIdAndDelete(id).exec();
    }
    const strId = String(id);
    const existing = this.map.get(strId);
    if (existing) {
      this.map.delete(strId);
      saveStoreToDisk();
      return existing;
    }
    return null;
  }

  async countDocuments(query = {}) {
    if (isMongoActive()) {
      return await this.MongooseModel.countDocuments(query).exec();
    }
    return Array.from(this.map.values()).filter((item) => matchesQuery(item, query)).length;
  }

  async deleteMany(query = {}) {
    if (isMongoActive()) {
      return await this.MongooseModel.deleteMany(query).exec();
    }
    let count = 0;
    for (const [id, item] of this.map.entries()) {
      if (matchesQuery(item, query)) {
        this.map.delete(id);
        count++;
      }
    }
    saveStoreToDisk();
    return { deletedCount: count };
  }
}

export const DataStore = {
  users: new MemoryModelHandler('users', User),
  responsibilities: new MemoryModelHandler('responsibilities', Responsibility),
  sources: new MemoryModelHandler('sources', Source),
  processingRuns: new MemoryModelHandler('processingRuns', ProcessingRun),
  processingLogs: new MemoryModelHandler('processingLogs', ProcessingLog),
  integrations: new MemoryModelHandler('integrations', Integration),
  documents: new MemoryModelHandler('documents', Document),
  notifications: new MemoryModelHandler('notifications', Notification),
  agentMemories: new MemoryModelHandler('agentMemories', AgentMemory),
};
