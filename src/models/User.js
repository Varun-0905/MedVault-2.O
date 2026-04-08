import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Profile information
  profile: {
    phone: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  // Mental health specific fields
  mentalHealth: {
    currentMood: {
      type: String,
      enum: ['happy', 'neutral', 'stressed', 'anxious', 'sad', 'angry']
    },
    lastMoodUpdate: Date,
    sessionsCompleted: {
      type: Number,
      default: 0
    },
    appointmentsBooked: {
      type: Number,
      default: 0
    },
    lastChatSession: Date
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for better performance (email index is already created by unique: true)
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Virtual for full name (if needed)
UserSchema.virtual('fullName').get(function() {
  return this.name;
});

// Method to update last login
UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method to increment session count
UserSchema.methods.incrementSessions = function() {
  this.mentalHealth.sessionsCompleted += 1;
  this.mentalHealth.lastChatSession = new Date();
  return this.save();
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Export the model
export default mongoose.models.User || mongoose.model('User', UserSchema);