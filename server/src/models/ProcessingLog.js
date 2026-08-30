import mongoose from 'mongoose';

const processingLogSchema = new mongoose.Schema(
  {
    processingRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcessingRun',
      required: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Source',
      index: true,
    },
    agent: {
      type: String,
      enum: ['EXTRACTION', 'RELATIONSHIP', 'VALIDATION', 'PRIORITY', 'RECOVERY', 'MONITORING', 'SYSTEM'],
      required: true,
    },
    level: {
      type: String,
      enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS'],
      default: 'INFO',
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const ProcessingLog = mongoose.models.ProcessingLog || mongoose.model('ProcessingLog', processingLogSchema);
