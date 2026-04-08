import connectToDatabase from '@/lib/mongodb';
import Therapist from '@/models/Therapist';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
  try {
    await connectToDatabase();
    const data = await req.json();
    const therapist = await Therapist.findByIdAndUpdate(params.id, data, { new: true });
    if (!therapist) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(therapist);
  } catch (error) {
    console.error('Failed to update therapist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const therapist = await Therapist.findByIdAndDelete(params.id);
    if (!therapist) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete therapist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
