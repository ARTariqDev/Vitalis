import { NextResponse } from 'next/server';
import clientPromise from '../_db';
import { verifyJWT } from '@/lib/session';
import { ObjectId } from 'mongodb';

// Get user email from session
async function getUserFromRequest(request) {
  try {
    const session = request.cookies.get('session')?.value;
    if (!session) {
      console.log('No session cookie found');
      return null;
    }
    const payload = await verifyJWT(session);
    if (!payload) {
      console.log('Invalid session');
      return null;
    }
    return payload.email;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

// GET - Fetch all journal entries for a user
export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const userEmail = await getUserFromRequest(request);
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await db.collection('journal_entries')
      .find({ userId: userEmail })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ 
      success: true, 
      entries,
      count: entries.length 
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch journal entries',
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Create a new journal entry
export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const userEmail = await getUserFromRequest(request);
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paper, category, annotations, position } = body;

    // Validate required fields
    if (!paper || !paper.title || !category || !category.name) {
      return NextResponse.json({ 
        error: 'Missing required fields: paper.title and category.name are required' 
      }, { status: 400 });
    }

    // Check if paper already exists in journal
    const existingEntry = await db.collection('journal_entries').findOne({ 
      userId: userEmail, 
      'paper.title': paper.title 
    });

    if (existingEntry) {
      return NextResponse.json({ 
        error: 'Paper already in journal',
        entryId: existingEntry._id 
      }, { status: 409 });
    }

    // Create new entry
    const entry = {
      userId: userEmail,
      paper,
      category,
      annotations: annotations || [],
      connections: [],
      position: position || { x: Math.random() * 500, y: Math.random() * 500 },
      metadata: {
        viewCount: 0,
        lastViewed: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('journal_entries').insertOne(entry);
    entry._id = result.insertedId;

    return NextResponse.json({ 
      success: true, 
      entry,
      message: 'Paper added to journal successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json({ 
      error: 'Failed to create journal entry',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Update an existing journal entry
export async function PUT(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const userEmail = await getUserFromRequest(request);
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entryId, updates } = body;

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    // Find and update entry (ensure it belongs to the user)
    const result = await db.collection('journal_entries').findOneAndUpdate(
      { _id: new ObjectId(entryId), userId: userEmail },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      entry: result.value,
      message: 'Entry updated successfully' 
    });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json({ 
      error: 'Failed to update journal entry',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Remove a journal entry
export async function DELETE(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const userEmail = await getUserFromRequest(request);
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const result = await db.collection('journal_entries').deleteOne({ 
      _id: new ObjectId(entryId), 
      userId: userEmail 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Entry removed from journal successfully' 
    });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json({ 
      error: 'Failed to delete journal entry',
      details: error.message 
    }, { status: 500 });
  }
}
