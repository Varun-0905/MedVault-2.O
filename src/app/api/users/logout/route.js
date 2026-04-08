import { NextResponse } from 'next/server';
import { cookieName } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear the session cookie
  response.cookies.set({
    name: cookieName,
    value: '',
    path: '/',
    maxAge: 0,
  });
  
  return response;
}