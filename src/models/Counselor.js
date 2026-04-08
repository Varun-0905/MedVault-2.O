import mongoose from 'mongoose';

const CounselorSchema = new mongoose.Schema({
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
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  location: {
    type: String,
    required: [true, 'Office location is required']
  },
  availability: {
    type: String,
    required: [true, 'Availability is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  bio: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true,
  collection: 'counselors'
});

export default mongoose.models.Counselor || mongoose.model('Counselor', CounselorSchema);
