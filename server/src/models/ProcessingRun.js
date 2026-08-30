import mongoose from 'mongoose';

const processingRunSchema = new mongoose.Schema(
  {
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Source',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentAgent: {
      type: String,
      enum: ['EXTRACTION', 'RELATIONSHIP', 'VALIDATION', 'PRIORITY', 'RECOVERY', 'MONITORING', 'IDLE'],
      default: 'IDLE',
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const ProcessingRun = mongoose.models.ProcessingRun || mongoose.model('ProcessingRun', processingRunSchema);
