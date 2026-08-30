import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const dependencySchema = new mongoose.Schema(
  {
    id: { type: String },
    responsibilityId: { type: String },
    type: {
      type: String,
      enum: ['REQUIRES', 'BLOCKS', 'REQUIRED_BEFORE', 'FOLLOWS', 'PART_OF', 'RELATED_TO'],
      default: 'REQUIRES',
    },
    title: { type: String },
  },
  { _id: false }
);

const relatedResponsibilitySchema = new mongoose.Schema(
  {
    responsibilityId: { type: String },
    relationType: {
      type: String,
      enum: ['SAME_RESPONSIBILITY', 'RELATED', 'DUPLICATE', 'UNRELATED'],
      default: 'RELATED',
    },
    confidenceScore: { type: Number, default: 0.8 },
  },
  { _id: false }
);

const responsibilitySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['EDUCATION', 'WORK', 'FINANCE', 'PERSONAL', 'HEALTH', 'GOVERNMENT', 'TRAVEL', 'SHOPPING', 'OTHER'],
      default: 'OTHER',
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'WAITING', 'BLOCKED', 'COMPLETED', 'OVERDUE', 'CANCELLED'],
      default: 'NOT_STARTED',
    },
    priority: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
    },
    priorityScore: {
      type: Number,
      default: 50,
    },
    priorityExplanation: {
      type: mongoose.Schema.Types.Mixed,
      default: { reason: 'Standard obligation', breakdown: [] },
    },
    deadline: {
      type: Date,
    },
    deadlineStatus: {
      type: String,
      enum: ['UPCOMING', 'APPROACHING', 'URGENT', 'OVERDUE'],
    },
    requirements: [requirementSchema],
    missingRequirements: [String],
    completionPercentage: {
      type: Number,
      default: 0,
    },
    dependencies: [dependencySchema],
    relatedResponsibilities: [relatedResponsibilitySchema],
    sourceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Source',
      },
    ],
    people: [String],
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

export const Responsibility = mongoose.models.Responsibility || mongoose.model('Responsibility', responsibilitySchema);
