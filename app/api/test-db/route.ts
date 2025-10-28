import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ContactMessage from '@/lib/models/ContactMessage';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Check current connection state
    console.log('📊 Current connection state:', mongoose.connection.readyState);
    console.log('📊 Connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');
    
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('✅ Already connected to MongoDB');
    }

    // Test basic query
    console.log('🔍 Testing ContactMessage model...');
    const count = await ContactMessage.countDocuments();
    console.log('📊 Total contact messages in DB:', count);

    // Get a sample message
    const sampleMessage = await ContactMessage.findOne().lean();
    console.log('📄 Sample message:', sampleMessage ? {
      id: (sampleMessage as any)._id,
      name: (sampleMessage as any).name,
      email: (sampleMessage as any).email,
      status: (sampleMessage as any).status,
      createdAt: (sampleMessage as any).createdAt
    } : 'No messages found');

    return NextResponse.json({
      success: true,
      connectionState: mongoose.connection.readyState,
      totalMessages: count,
      sampleMessage: sampleMessage ? {
        id: (sampleMessage as any)._id,
        name: (sampleMessage as any).name,
        email: (sampleMessage as any).email,
        status: (sampleMessage as any).status,
        createdAt: (sampleMessage as any).createdAt
      } : null,
      dbName: mongoose.connection.db?.databaseName,
      collections: await mongoose.connection.db?.listCollections().toArray()
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionState: mongoose.connection.readyState
      },
      { status: 500 }
    );
  }
}