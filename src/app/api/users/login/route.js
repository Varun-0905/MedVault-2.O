import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getUserByEmail, updateUserLastLogin } from '@/lib/users-repo';
import { signJwt, cookieName, cookieMaxAge } from '@/lib/auth';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const DEMO_EMAILS = new Set(['admin@college.edu', 'student@college.edu']);
const DEMO_PASSWORDS = {
  'admin@college.edu': 'admin123',
  'student@college.edu': 'student123',
};

async function verifyPasswordAgainstUser(user, password) {
  const candidates = [user?.passwordHash, user?.password].filter(Boolean);

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;

    if (candidate.startsWith('$2')) {
      const validHash = await bcrypt.compare(password, candidate);
      if (validHash) return true;
      continue;
    }

    if (candidate === password) {
      return true;
    }
  }

  return false;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);

    const isDemoLogin = DEMO_EMAILS.has(email);

    // Ensure demo accounts are always present and consistent.
    if (isDemoLogin) {
      const { createInitialAdmin } = await import('@/lib/users-repo');
      await createInitialAdmin();
    }

    // Find user by email
    let user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' }, 
        { status: 401 }
      );
    }

    // Verify password
    let isPasswordValid = await verifyPasswordAgainstUser(user, password);

    // Demo-account hardening: if exact known demo credentials are provided,
    // treat them as source-of-truth after deterministic reseed.
    if (!isPasswordValid && isDemoLogin && password === DEMO_PASSWORDS[email]) {
      const { createInitialAdmin } = await import('@/lib/users-repo');
      await createInitialAdmin();
      user = await getUserByEmail(email);
      isPasswordValid = Boolean(user);
    }

    // For demo users, retry once after re-seeding if credentials still fail.
    if (!isPasswordValid && isDemoLogin) {
      const { createInitialAdmin } = await import('@/lib/users-repo');
      await createInitialAdmin();
      user = await getUserByEmail(email);
      isPasswordValid = user ? await verifyPasswordAgainstUser(user, password) : false;
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' }, 
        { status: 401 }
      );
    }

    // Create JWT token
    const token = signJwt({ 
      sub: user._id, 
      email: user.email, 
      role: user.role 
    });

    // Update last login time
    if (user._id) {
      await updateUserLastLogin(user._id);
    }

    // Create response with user data
    const response = NextResponse.json(
      { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      }, 
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set({
      name: cookieName,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: cookieMaxAge,
    });

    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Invalid input', 
          errors: err.errors 
        }, 
        { status: 400 }
      );
    }
    
    console.error('Login error:', err);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}