import mongoose from 'mongoose';

const ForumPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  category: {
    type: String,
    enum: ['General', 'Stress', 'Anxiety', 'Depression', 'Academic', 'Relationships'],
    default: 'General'
  },
  tags: [String],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'forum_posts'
});

export default mongoose.models.ForumPost || mongoose.model('ForumPost', ForumPostSchema);
