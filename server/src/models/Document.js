import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
    },
    fileType: {
      type: String,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    extractedText: {
      type: String,
      default: '',
    },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'EXTRACTED', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
    },
    extractedResponsibilitiesCount: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
