import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Staff from '@/lib/models/Staff';
import { uploadToCloudinary } from '@/lib/cloudinary';

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET - Fetch all staff members
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';
    
    let query = {};
    if (!showAll) {
      // By default, only show visible staff
      query = { isVisible: true };
    }
    
    const staff = await Staff.find(query).sort({ order: 1, createdAt: 1 });
    
    const response = NextResponse.json({
      success: true,
      data: staff
    });

    // Add CORS headers to allow cross-origin requests
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error fetching staff:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Failed to fetch staff members' },
      { status: 500 }
    );
    
    // Add CORS headers to error response as well
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// POST - Create new staff member
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const isVisible = formData.get('isVisible') === 'true';
    const avatar = formData.get('avatar') as File;

    if (!name || !title || !avatar) {
      return NextResponse.json(
        { success: false, error: 'Name, title, and avatar are required' },
        { status: 400 }
      );
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadToCloudinary(avatar, 'staff');

    // Get the next order number
    const lastStaff = await Staff.findOne().sort({ order: -1 });
    const nextOrder = lastStaff ? lastStaff.order + 1 : 0;

    // Create staff member
    const staff = new Staff({
      name,
      title,
      avatar: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      isVisible,
      order: nextOrder
    });

    await staff.save();

    const response = NextResponse.json({
      success: true,
      data: staff
    }, { status: 201 });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error creating staff member:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Failed to create staff member' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}