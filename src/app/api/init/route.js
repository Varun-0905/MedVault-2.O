import { NextResponse } from 'next/server';
import { createInitialAdmin } from '@/lib/users-repo';

async function initAdmin() {
  const admin = await createInitialAdmin();
  return {
    message: 'Admin user initialized successfully',
    admin: {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    }
  };
}

// GET – so you can trigger it directly from the browser
export async function GET() {
  try {
    const result = await initAdmin();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error initializing admin:', error);
    return NextResponse.json({ message: 'Failed to initialize admin user', error: error.message }, { status: 500 });
  }
}

// POST – for programmatic use
export async function POST() {
  try {
    const result = await initAdmin();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error initializing admin:', error);
    return NextResponse.json({ message: 'Failed to initialize admin user', error: error.message }, { status: 500 });
  }
}