import mongoose from 'mongoose';

const ForumCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPost',
    required: [true, 'Post ID is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author ID is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
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
  collection: 'forum_comments'
});

export default mongoose.models.ForumComment || mongoose.model('ForumComment', ForumCommentSchema);
