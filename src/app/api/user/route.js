import clientPromise from '../_db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Get user email from query param or session (for demo, use query param)
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Only return safe fields
    return NextResponse.json({
      fullName: user.fullName,
      email: user.email,
      demographics: user.demographics,
      createdAt: user.createdAt
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
