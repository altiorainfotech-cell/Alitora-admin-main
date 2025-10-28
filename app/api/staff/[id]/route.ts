import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Staff from '@/lib/models/Staff';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

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

// GET - Fetch single staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const staff = await Staff.findById(id);
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: staff
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error fetching staff member:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Failed to fetch staff member' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// PUT - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const isVisible = formData.get('isVisible') === 'true';
    const avatar = formData.get('avatar') as File | null;

    const staff = await Staff.findById(id);
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Update basic fields
    staff.name = name || staff.name;
    staff.title = title || staff.title;
    staff.isVisible = isVisible;

    // Handle avatar update
    if (avatar && avatar.size > 0) {
      // Delete old image from Cloudinary if exists
      if (staff.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(staff.cloudinaryPublicId);
        } catch (error) {
          console.warn('Failed to delete old image:', error);
        }
      }

      // Upload new image
      const uploadResult = await uploadToCloudinary(avatar, 'staff');
      staff.avatar = uploadResult.secure_url;
      staff.cloudinaryPublicId = uploadResult.public_id;
    }

    await staff.save();

    const response = NextResponse.json({
      success: true,
      data: staff
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error updating staff member:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Failed to update staff member' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// DELETE - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const staff = await Staff.findById(id);
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary if exists
    if (staff.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(staff.cloudinaryPublicId);
      } catch (error) {
        console.warn('Failed to delete image from Cloudinary:', error);
      }
    }

    await Staff.findByIdAndDelete(id);

    const response = NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully'
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error deleting staff member:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Failed to delete staff member' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}