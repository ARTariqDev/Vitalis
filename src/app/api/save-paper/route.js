import clientPromise from '../_db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { paperData } = await request.json();

    if (!paperData || !paperData.csvTitle) {
      return NextResponse.json(
        { error: 'Invalid paper data' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('vitalis'); // Replace with your database name
    const collection = db.collection('papers');

    // Create the paper document
    const paperDocument = {
      id: paperData.link || paperData.csvTitle, // Use link as unique ID
      paperNode: {
        title: paperData.csvTitle,
        position: { x: 100, y: 0 } // Default position, you can make this dynamic
      },
      edge: {
        id: `edge-${Date.now()}`, // Generate unique edge ID
        target: paperData.csvTitle,
        source: paperData.category || 'Uncategorized' // Add category if available
      },
      savedAt: new Date(),
      link: paperData.link,
      summary: paperData.summary,
      imageLinks: paperData.imageLinks || []
    };

    // Check if paper already exists
    const existingPaper = await collection.findOne({ id: paperDocument.id });
    
    if (existingPaper) {
      return NextResponse.json(
        { 
          error: 'Paper already saved to journal',
          message: 'This paper is already in your journal'
        },
        { status: 409 }
      );
    }

    // Insert the paper
    const result = await collection.insertOne(paperDocument);

    return NextResponse.json({ 
      success: true, 
      message: 'Paper saved successfully',
      id: result.insertedId 
    });

  } catch (error) {
    console.error('Error saving paper:', error);
    return NextResponse.json(
      { error: 'Failed to save paper', details: error.message },
      { status: 500 }
    );
  }
}