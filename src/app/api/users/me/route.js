import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt, cookieName } from '@/lib/auth';
import { getUserById } from '@/lib/users-repo';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Optionally, fetch fresh user data from database
    const user = await getUserById(payload.sub);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      } 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}