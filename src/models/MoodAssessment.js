import mongoose from 'mongoose';

const MoodAssessmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  mood: {
    type: String,
    enum: ['happy', 'neutral', 'stressed', 'anxious', 'sad', 'angry'],
    required: [true, 'Mood is required']
  },
  score: {
    type: Number,
    required: [true, 'Assessment score is required']
  },
  notes: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'mood_assessments'
});

export default mongoose.models.MoodAssessment || mongoose.model('MoodAssessment', MoodAssessmentSchema);
