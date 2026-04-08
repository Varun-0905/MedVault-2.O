import connectToDatabase from '@/lib/mongodb';
import Counselor from '@/models/Counselor';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
  try {
    await connectToDatabase();
    const data = await req.json();
    const counselor = await Counselor.findByIdAndUpdate(params.id, data, { new: true });
    if (!counselor) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(counselor);
  } catch (error) {
    console.error('Failed to update counselor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const counselor = await Counselor.findByIdAndDelete(params.id);
    if (!counselor) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete counselor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
