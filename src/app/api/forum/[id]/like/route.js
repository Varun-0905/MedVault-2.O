import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ForumPost from '@/models/ForumPost';

export async function POST(request, { params }) {
    try {
        await dbConnect();
        
        const postId = params.id;
        const body = await request.json();
        const { userId } = body;
        
        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }
        
        const post = await ForumPost.findById(postId);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }
        
        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
        } else {
            post.likes.push(userId);
        }
        
        await post.save();
        
        return NextResponse.json({ success: true, likes: post.likes.length, likedBy: post.likes.map(id => id.toString()) });
    } catch (error) {
        console.error('Forum Like POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
