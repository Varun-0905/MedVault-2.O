import connectDB from './mongodb.js';
import ForumPost from '../models/ForumPost.js';
import ForumComment from '../models/ForumComment.js';

export async function getForumPosts(category = null) {
  try {
    await connectDB();
    const query = category ? { category } : {};
    return await ForumPost.find(query)
      .populate('author', 'name profile')
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error in getForumPosts:', error);
    return [];
  }
}

export async function createForumPost(data) {
  try {
    await connectDB();
    const post = new ForumPost(data);
    return await post.save();
  } catch (error) {
    console.error('Error in createForumPost:', error);
    throw error;
  }
}

export async function getPostComments(postId) {
  try {
    await connectDB();
    return await ForumComment.find({ post: postId })
      .populate('author', 'name profile')
      .sort({ createdAt: 1 });
  } catch (error) {
    console.error('Error in getPostComments:', error);
    return [];
  }
}
