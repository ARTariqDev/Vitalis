/**
 * Journal Entry Data Model (MongoDB Native Driver)
 * 
 * Collection: journal_entries
 * 
 * This file documents the structure of journal entries.
 * The actual implementation uses MongoDB native driver (not Mongoose).
 * 
 * Indexes to create in MongoDB:
 * - { userId: 1, createdAt: -1 }
 * - { userId: 1, 'category.name': 1 }
 * - { userId: 1, 'paper.title': 1 }
 */

export const JournalEntryStructure = {
  _id: 'ObjectId',
  userId: 'string (required)',
  paper: {
    title: 'string (required)',
    code: 'string',
    tags: 'string',
    summary: 'string',
    link: 'string',
    content: 'string'
  },
  category: {
    id: 'string',
    name: 'string (required)',
    color: 'string (default: #6366f1)'
  },
  annotations: [{
    text: 'string',
    createdAt: 'Date',
    aiGenerated: 'boolean'
  }],
  connections: [{
    targetEntryId: 'string',
    relationship: 'string', // "similar-topic", "contradicts", "builds-on"
    aiGenerated: 'boolean'
  }],
  position: {
    x: 'number',
    y: 'number'
  },
  metadata: {
    viewCount: 'number',
    lastViewed: 'Date',
    aiSummaryRegenerated: 'boolean'
  },
  createdAt: 'Date',
  updatedAt: 'Date'
};
