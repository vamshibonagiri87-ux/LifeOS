import mongoose from 'mongoose';

const agentMemorySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    responsibilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Responsibility',
    },
    processingRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcessingRun',
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

export const AgentMemory = mongoose.models.AgentMemory || mongoose.model('AgentMemory', agentMemorySchema);
