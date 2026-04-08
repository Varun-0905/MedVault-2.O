import connectToDatabase from '@/lib/mongodb';
import Counselor from '@/models/Counselor';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Check if empty to seed some initials
    const count = await Counselor.countDocuments();
    if (count === 0) {
      await Counselor.insertMany([
        { name: "John Davis", role: "Head of Student Wellness", email: "j.davis@college.edu", location: "North Block", department: "Wellness", phone: "123", availability: "Weekdays" },
        { name: "Maria Gonzalez", role: "Academic Anxiety Counselor", email: "m.gonzalez@college.edu", location: "Science Library", department: "Academic Support", phone: "123", availability: "Weekdays" },
        { name: "Robert Chase", role: "Peer Support Coordinator", email: "r.chase@college.edu", location: "Student Union", department: "Peer Support", phone: "123", availability: "Evenings" },
      ]);
    }

    const counselors = await Counselor.find().sort({ createdAt: -1 });
    return NextResponse.json(counselors);
  } catch (error) {
    console.error('Failed to fetch counselors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const data = await req.json();
    const counselor = await Counselor.create(data);
    return NextResponse.json(counselor, { status: 201 });
  } catch (error) {
    console.error('Failed to create counselor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
