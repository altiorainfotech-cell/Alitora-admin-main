import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ContactMessage from '@/lib/models/ContactMessage';

export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const body = await request.json();
    const { name, email, countryCode, phoneNumber, message } = body;

    // Debug logging
    console.log('📥 Received contact form data:', {
      name,
      email,
      countryCode,
      phoneNumber,
      message: message?.substring(0, 50) + '...'
    });

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Prepare contact message data with explicit phone field handling
    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      // Explicitly include phone fields, even if undefined
      countryCode: countryCode ? countryCode.trim() : undefined,
      phoneNumber: phoneNumber ? phoneNumber.trim() : undefined
    };

    console.log('💾 Saving contact data:', contactData);

    // Create new contact message
    const contactMessage = new ContactMessage(contactData);
    await contactMessage.save();

    console.log('✅ Saved contact message:', {
      id: contactMessage._id,
      countryCode: contactMessage.countryCode,
      phoneNumber: contactMessage.phoneNumber
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Contact message saved successfully',
        id: contactMessage._id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error saving contact message:', error);
    return NextResponse.json(
      { error: 'Failed to save contact message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && ['unread', 'read', 'replied'].includes(status)) {
      query.status = status;
    }

    // Get messages with pagination
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await ContactMessage.countDocuments(query);

    // Get unread count
    const unreadCount = await ContactMessage.countDocuments({ status: 'unread' });

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact messages' },
      { status: 500 }
    );
  }
}