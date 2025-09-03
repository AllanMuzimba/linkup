import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminStorage } from '@/lib/firebase-admin'
import { v4 as uuidv4 } from 'uuid'

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
    if (!adminAuth || !adminStorage) {
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

    // Generate file path
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    let filePath: string

    switch (uploadType) {
      case 'avatar':
        filePath = `users/${userId}/avatar_${fileName}`
        break
      case 'cover':
        filePath = `users/${userId}/cover_${fileName}`
        break
      case 'post':
        filePath = `posts/${targetId}/${fileName}`
        break
      case 'story':
        filePath = `stories/${targetId}/${fileName}`
        break
      case 'chat':
        filePath = `chats/${targetId}/attachments/${fileName}`
        break
      case 'voice':
        filePath = `voice-messages/${targetId}/${fileName}`
        break
      default:
        filePath = `temp/${userId}/${fileName}`
    }

    // Upload file to Firebase Storage
    const bucket = adminStorage.bucket()
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileRef = bucket.file(filePath)

    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: userId,
          originalName: file.name,
          uploadType
        }
      }
    })

    // Make file publicly readable if it's a profile image
    if (uploadType === 'avatar' || uploadType === 'cover') {
      await fileRef.makePublic()
    }

    // Get download URL
    const [downloadURL] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500' // Far future date for permanent access
    })

    return NextResponse.json({
      success: true,
      url: downloadURL,
      fileName,
      fileType,
      size: file.size
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
