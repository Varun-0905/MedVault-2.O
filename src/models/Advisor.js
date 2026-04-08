import mongoose from 'mongoose';

const AdvisorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  year: {
    type: String,
    required: [true, 'Student year is required']
  },
  major: {
    type: String,
    required: [true, 'Student major is required']
  },
  availability: {
    type: String,
    required: [true, 'Availability is required']
  },
  bio: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'advisors'
});

export default mongoose.models.Advisor || mongoose.model('Advisor', AdvisorSchema);
