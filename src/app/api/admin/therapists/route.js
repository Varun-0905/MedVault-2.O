import connectToDatabase from '@/lib/mongodb';
import Therapist from '@/models/Therapist';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Check if empty to seed some initials
    const count = await Therapist.countDocuments();
    if (count === 0) {
      await Therapist.insertMany([
        { name: "Dr. Emily Chen", specialization: "CBT / Anxiety", status: "active", totalSessions: 124, email: "emily@example.com", phone: "123", experience: "5 years", availability: "Weekdays" },
        { name: "Dr. Marcus Johnson", specialization: "Trauma Recovery", status: "active", totalSessions: 82, email: "marcus@example.com", phone: "123", experience: "10 years", availability: "Weekends" },
        { name: "Dr. Sarah Williams", specialization: "Couples Therapy", status: "pending", totalSessions: 0, email: "sarah@example.com", phone: "123", experience: "3 years", availability: "Flexible" },
        { name: "Dr. David Kim", specialization: "Adolescent Psychiatry", status: "active", totalSessions: 215, email: "david@example.com", phone: "123", experience: "15 years", availability: "Weekdays" },
        { name: "Jessica Taylor, LCSW", specialization: "Stress Management", status: "suspended", totalSessions: 12, email: "jessica@example.com", phone: "123", experience: "2 years", availability: "Mondays" },
      ]);
    }

    const therapists = await Therapist.find().sort({ createdAt: -1 });
    return NextResponse.json(therapists);
  } catch (error) {
    console.error('Failed to fetch therapists:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const data = await req.json();
    const therapist = await Therapist.create(data);
    return NextResponse.json(therapist, { status: 201 });
  } catch (error) {
    console.error('Failed to create therapist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
