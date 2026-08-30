import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        'URGENT_DEADLINE',
        'NEW_RESPONSIBILITY',
        'REQUIREMENT_MISSING',
        'RESPONSIBILITY_BLOCKED',
        'PROCESSING_FAILED',
        'CONNECTION_EXPIRED',
        'SYSTEM_ALERT',
      ],
      default: 'SYSTEM_ALERT',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
