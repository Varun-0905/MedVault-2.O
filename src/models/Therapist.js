import mongoose from 'mongoose';

const TherapistSchema = new mongoose.Schema({
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
  specialization: {
    type: String,
    required: [true, 'Specialization is required']
  },
  experience: {
    type: String,
    required: [true, 'Experience is required']
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
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'therapists'
});

export default mongoose.models.Therapist || mongoose.model('Therapist', TherapistSchema);
