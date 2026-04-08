import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Professional ID is required'],
    refPath: 'professionalModel'
  },
  professionalModel: {
    type: String,
    required: true,
    enum: ['Therapist', 'Counselor', 'Advisor']
  },
  dateTime: {
    type: Date,
    required: [true, 'Date and time is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: ''
  },
  meetingLink: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'appointments'
});

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
