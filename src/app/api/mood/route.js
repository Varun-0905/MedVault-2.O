import { NextResponse } from 'next/server';
import { getStudentMoodHistory } from '@/lib/mood-repo';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        
        const userId = payload.userId;
        const moodHistory = await getStudentMoodHistory(userId);
        
        return NextResponse.json({ moodHistory });
    } catch (error) {
        console.error('Error fetching mood history:', error);
        return NextResponse.json({ error: 'Failed to fetch mood history' }, { status: 500 });
    }
}
