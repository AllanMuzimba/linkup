import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { deleteFromCloudinary } from '@/lib/cloudinary-utils'

export async function DELETE(request: NextRequest) {
  try {
    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 })
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')
    const resourceType = searchParams.get('resourceType') as 'image' | 'video' | 'raw'

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    // Verify user has permission to delete this file
    // Check if the publicId contains the userId or if user is admin
    const isOwner = publicId.includes(userId)
    const isAdmin = decodedToken.admin === true

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 })
    }

    // Delete from Cloudinary
    const deleteResult = await deleteFromCloudinary(publicId, resourceType || 'image')

    if (!deleteResult.success) {
      return NextResponse.json({ 
        error: deleteResult.error || 'Delete failed' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}