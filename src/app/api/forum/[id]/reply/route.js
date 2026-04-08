import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ForumPost from '@/models/ForumPost';
import ForumComment from '@/models/ForumComment';

export async function POST(request, { params }) {
    try {
        await dbConnect();
        
        const postId = params.id;
        const body = await request.json();
        const { content, isAnonymous, userId } = body;
        
        if (!content || !userId) {
            return NextResponse.json({ success: false, error: 'Missing required fields (content, userId)' }, { status: 400 });
        }
        
        const post = await ForumPost.findById(postId);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }
        
        const comment = await ForumComment.create({
            post: postId,
            author: userId,
            content,
            isAnonymous: isAnonymous || false
        });
        
        return NextResponse.json({ success: true, comment });
    } catch (error) {
        console.error('Forum Reply POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
