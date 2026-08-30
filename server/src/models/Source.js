import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['EMAIL', 'CALENDAR_EVENT', 'DOCUMENT', 'MANUAL_INPUT'],
      required: true,
    },
    externalId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sourceDate: {
      type: Date,
      default: Date.now,
    },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    processingConfidence: {
      type: Number,
      default: 0,
    },
    aiProcessed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Source = mongoose.models.Source || mongoose.model('Source', sourceSchema);
