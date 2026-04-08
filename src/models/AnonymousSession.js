import mongoose from 'mongoose';

const AnonymousSessionSchema = new mongoose.Schema({
  sessionKey: {
    type: String,
    required: true,
    unique: true
  },
  moodBefore: String,
  moodAfter: String,
  durationMinutes: Number,
  tags: [String],
  summary: String,
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
}, {
  timestamps: true,
  collection: 'anonymous_sessions'
});

// Auto-delete anonymous sessions after 24 hours (86400 seconds) to ensure true anonymity
AnonymousSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.AnonymousSession || mongoose.model('AnonymousSession', AnonymousSessionSchema);
