import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from '@/lib/users-repo';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['student', 'admin']).optional(), // defaults to student
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name, role } = schema.parse(body);

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already in use' }, 
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user (defaults to 'student' role)
    const user = await createUser({
      email,
      name,
      passwordHash,
      role: role ?? 'student',
    });

    // Return user without sensitive data
    return NextResponse.json(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      }, 
      { status: 201 }
    );
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
    
    console.error('Registration error:', err);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}