import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import { uploadToCloudinary, getTransformationOptions } from '@/lib/cloudinary-utils'

const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024,      // 5MB
  video: 50 * 1024 * 1024,     // 50MB
  audio: 10 * 1024 * 1024,     // 10MB
  document: 10 * 1024 * 1024   // 10MB
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadType = formData.get('type') as string // 'avatar', 'post', 'chat', 'story'
    const targetId = formData.get('targetId') as string // postId, chatId, etc.

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Determine file type
    let fileType: keyof typeof ALLOWED_TYPES
    if (ALLOWED_TYPES.image.includes(file.type)) fileType = 'image'
    else if (ALLOWED_TYPES.video.includes(file.type)) fileType = 'video'
    else if (ALLOWED_TYPES.audio.includes(file.type)) fileType = 'audio'
    else if (ALLOWED_TYPES.document.includes(file.type)) fileType = 'document'
    else {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE[fileType]) {
      return NextResponse.json({ 
        error: `File size exceeds ${MAX_FILE_SIZE[fileType] / (1024 * 1024)}MB limit for ${fileType} files` 
      }, { status: 400 })
    }

    // Generate unique public ID for Cloudinary
    const uniqueId = uuidv4()
    let folder: string
    let publicId: string

    switch (uploadType) {
      case 'avatar':
        folder = 'linkup/users/avatars'
        publicId = `${userId}_${uniqueId}`
        break
      case 'cover':
        folder = 'linkup/users/covers'
        publicId = `${userId}_${uniqueId}`
        break
      case 'post':
        folder = 'linkup/posts'
        publicId = `${targetId || userId}_${uniqueId}`
        break
      case 'story':
        folder = 'linkup/stories'
        publicId = `${targetId || userId}_${uniqueId}`
        break
      case 'chat':
        folder = 'linkup/chats'
        publicId = `${targetId}_${uniqueId}`
        break
      case 'voice':
        folder = 'linkup/voice'
        publicId = `${targetId}_${uniqueId}`
        break
      default:
        folder = 'linkup/temp'
        publicId = `${userId}_${uniqueId}`
    }

    // Convert file to buffer for upload
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Determine resource type for Cloudinary
    let resourceType: 'image' | 'video' | 'raw'
    if (fileType === 'image') resourceType = 'image'
    else if (fileType === 'video') resourceType = 'video'
    else resourceType = 'raw'

    // Get optimized transformations
    const transformations = getTransformationOptions(fileType, uploadType)

    // Upload to Cloudinary using utility function
    const uploadResult = await uploadToCloudinary(fileBuffer, file.type, {
      folder,
      publicId,
      resourceType,
      transformation: transformations,
      context: {
        uploadedBy: userId,
        originalName: file.name,
        uploadType: uploadType
      },
      tags: [uploadType, userId, 'linkup']
    })

    if (!uploadResult.success) {
      return NextResponse.json({ 
        error: uploadResult.error || 'Upload failed' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      fileName: file.name,
      fileType,
      size: file.size,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
