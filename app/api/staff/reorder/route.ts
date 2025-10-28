import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Staff from '@/lib/models/Staff';

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST - Update staff order
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { staffOrder } = await request.json();
    
    if (!Array.isArray(staffOrder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid staff order data' },
        { status: 400 }
      );
    }

    // Update each staff member's order
    const updatePromises = staffOrder.map(async (item: { id: string; order: number }) => {
      return Staff.findByIdAndUpdate(
        item.id,
        { order: item.order },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    const response = NextResponse.json({
      success: true,
      message: 'Staff order updated successfully'
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error updating staff order:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Failed to update staff order' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}