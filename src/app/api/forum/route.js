import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import ForumPost from '@/models/ForumPost';
import ForumComment from '@/models/ForumComment';
import User from '@/models/User';

export async function GET() {
    try {
        await dbConnect();
        
        // Seed mock data if database is empty to preserve UX
        const count = await ForumPost.countDocuments();
        if (count === 0) {
            const admin = await User.findOne() || await User.create({ name: 'System Admin', email: 'admin@system.local', password: 'test', specialCode: 'P01' });
            
            const post1 = await ForumPost.create({ author: admin._id, title: "Dealing with exam anxiety - My toolkit", content: "I've been struggling with severe anxiety before exams, but I found that combining the 5-4-3-2-1 grounding technique with 10 minutes of journaling the night before drastically reduces my panic. Anyone else have rituals that help?", category: "Anxiety", isAnonymous: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) });
            await ForumComment.create({ post: post1._id, author: admin._id, content: "The 5-4-3-2-1 method literally saved me during finals last semester! I also started listening to 432Hz lo-fi beats without lyrics to block out my dorm noise.", isAnonymous: false, createdAt: new Date(Date.now() - 60 * 60 * 1000) });
            
            const post2 = await ForumPost.create({ author: admin._id, title: "Meditation helped me through depression", content: "Just wanted to share that daily meditation practice really helped me manage my depression symptoms. Happy to share the specific guided tracks that worked for me if anyone is interested! Remember, recovery is not linear.", category: "Depression", isAnonymous: true, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) });
            await ForumComment.create({ post: post2._id, author: admin._id, content: "This is wonderful to hear! Meditation has been clinically proven to reshape neural pathways related to stress. For anyone starting out, even 3 minutes a day is a massive step forward. Don't pressure yourself too much.", isAnonymous: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) });
            
            const post3 = await ForumPost.create({ author: admin._id, title: "Understanding Sleep Hygiene", content: "A quick reminder that irregular sleep patterns directly spike cortisol levels. Try to keep your sleep/wake window within exactly 1 hour every single day, even on weekends. Your academic performance relies on REM sleep!", category: "General", isAnonymous: false, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) });
            await ForumComment.create({ post: post3._id, author: admin._id, content: "This is so hard to do when you have 8am classes on Tuesday but no classes on Wednesday. My sleep schedule is completely wrecked because of my major.", isAnonymous: true, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) });
        }

        const posts = await ForumPost.find()
            .populate('author', 'name role')
            .sort({ createdAt: -1 })
            .lean();
            
        const postIds = posts.map(p => p._id);
        const comments = await ForumComment.find({ post: { $in: postIds } })
            .populate('author', 'name role')
            .sort({ createdAt: 1 })
            .lean();
            
        const formattedPosts = posts.map(post => {
            const postComments = comments.filter(c => c.post.toString() === post._id.toString());
            return {
                id: post._id.toString(),
                title: post.title,
                content: post.content,
                author: post.isAnonymous ? "Anonymous" : (post.author?.name || "Unknown"),
                isAnonymous: post.isAnonymous,
                badge: post.author?.role === 'counselor' || post.author?.role === 'doctor' ? "Verified Professional" : (post.author?.role === 'admin' ? "Moderator" : null),
                category: post.category || 'General',
                replies: postComments.length,
                likes: post.likes?.length || 0,
                likedBy: post.likes?.map(id => id.toString()) || [],
                timestamp: formatTimestamp(post.createdAt),
                icon: post.isAnonymous ? "👻" : ((post.author?.name || "U").substring(0,2).toUpperCase()),
                color: post.isAnonymous ? "from-slate-400 to-slate-600" : "from-sky-400 to-blue-500",
                replyList: postComments.map(c => ({
                    id: c._id.toString(),
                    author: c.isAnonymous ? "Anonymous" : (c.author?.name || "Unknown"),
                    content: c.content,
                    timestamp: formatTimestamp(c.createdAt),
                    badge: c.author?.role === 'counselor' || c.author?.role === 'doctor' ? "Verified Professional" : null,
                    icon: c.isAnonymous ? "👻" : ((c.author?.name || "U").substring(0,2).toUpperCase()),
                    color: c.isAnonymous ? "from-slate-400 to-slate-600" : "from-emerald-400 to-teal-500"
                }))
            };
        });
        
        return NextResponse.json({ success: true, posts: formattedPosts });
    } catch (error) {
        console.error('Forum GET error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { title, content, category, isAnonymous, userId } = body;
        
        if (!title || !content || !userId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }
        
        const post = await ForumPost.create({
            author: userId,
            title,
            content,
            category: category || 'General',
            isAnonymous: isAnonymous || false
        });
        
        return NextResponse.json({ success: true, post });
    } catch (error) {
        console.error('Forum POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

function formatTimestamp(date) {
    if (!date) return "Just now";
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
}
