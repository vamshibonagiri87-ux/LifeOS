import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'google-calendar', 'openrouter', 'gemini'],
      required: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    accountEmail: {
      type: String,
      trim: true,
    },
    accountName: {
      type: String,
      trim: true,
    },
    authType: {
      type: String,
      enum: ['oauth', 'app_password', 'dev_simulated'],
      default: 'oauth',
    },
    scopes: [String],
    encryptedAccessToken: {
      type: String,
    },
    encryptedRefreshToken: {
      type: String,
    },
    encryptedAppPassword: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    lastSyncedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

integrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

export const Integration = mongoose.models.Integration || mongoose.model('Integration', integrationSchema);
