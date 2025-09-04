import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  success: boolean
  url?: string
  publicId?: string
  width?: number
  height?: number
  format?: string
  error?: string
}

export interface UploadOptions {
  folder: string
  publicId: string
  resourceType: 'image' | 'video' | 'raw'
  transformation?: any[]
  context?: Record<string, string>
  tags?: string[]
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  mimeType: string,
  options: UploadOptions
): Promise<CloudinaryUploadResult> {
  try {
    const base64File = `data:${mimeType};base64,${fileBuffer.toString('base64')}`
    
    const uploadOptions: any = {
      public_id: options.publicId,
      resource_type: options.resourceType,
      folder: options.folder,
      context: options.context,
      tags: options.tags,
      transformation: options.transformation
    }

    const result = await cloudinary.uploader.upload(base64File, uploadOptions)

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    })
    
    return {
      success: result.result === 'ok'
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
    crop?: string
  } = {}
): string {
  const {
    width = 800,
    height = 600,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options

  return cloudinary.url(publicId, {
    width,
    height,
    quality,
    format,
    crop,
    secure: true
  })
}

/**
 * Get video thumbnail URL
 */
export function getVideoThumbnailUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: string | number
  } = {}
): string {
  const {
    width = 400,
    height = 300,
    quality = 'auto'
  } = options

  return cloudinary.url(publicId, {
    resource_type: 'video',
    width,
    height,
    quality,
    format: 'jpg',
    crop: 'fill',
    secure: true
  })
}

/**
 * Generate transformation options based on file type and upload type
 */
export function getTransformationOptions(
  fileType: 'image' | 'video' | 'audio' | 'document',
  uploadType: string
): any[] {
  const transformations: any[] = []

  if (fileType === 'image') {
    transformations.push({ quality: 'auto', fetch_format: 'auto' })
    
    switch (uploadType) {
      case 'avatar':
        transformations.push({ 
          width: 400, 
          height: 400, 
          crop: 'fill',
          gravity: 'face'
        })
        break
      case 'cover':
        transformations.push({ 
          width: 1200, 
          height: 400, 
          crop: 'fill'
        })
        break
      case 'post':
        transformations.push({ 
          width: 1920, 
          height: 1080, 
          crop: 'limit'
        })
        break
      case 'story':
        transformations.push({ 
          width: 1080, 
          height: 1920, 
          crop: 'fill'
        })
        break
      default:
        transformations.push({ 
          width: 1920, 
          height: 1080, 
          crop: 'limit'
        })
    }
  } else if (fileType === 'video') {
    transformations.push({ quality: 'auto', fetch_format: 'auto' })
    
    switch (uploadType) {
      case 'story':
        transformations.push({ 
          width: 1080, 
          height: 1920, 
          crop: 'fill'
        })
        break
      default:
        transformations.push({ 
          width: 1280, 
          height: 720, 
          crop: 'limit'
        })
    }
  }

  return transformations
}

export { cloudinary }