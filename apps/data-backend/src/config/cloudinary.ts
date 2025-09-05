export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
  folder?: string;
}

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'livestream',
  folder: process.env.CLOUDINARY_FOLDER || 'livestreams'
};

// Validate required configuration
export function validateCloudinaryConfig(): boolean {
  const required = ['cloudName', 'apiKey', 'apiSecret'];
  const missing = required.filter(key => !cloudinaryConfig[key as keyof CloudinaryConfig]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required Cloudinary configuration:', missing);
    return false;
  }
  
  console.log('✅ Cloudinary configuration validated');
  return true;
}

// Get Cloudinary URL for a resource
export function getCloudinaryUrl(publicId: string, options: {
  transformation?: string;
  format?: string;
  quality?: string;
} = {}): string {
  const { transformation = '', format = '', quality = '' } = options;
  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}`;
  
  let url = `${baseUrl}/video/upload`;
  
  if (transformation) {
    url += `/${transformation}`;
  }
  
  if (quality) {
    url += `/q_${quality}`;
  }
  
  url += `/${publicId}`;
  
  if (format) {
    url += `.${format}`;
  }
  
  return url;
}

// Get Cloudinary livestream URL
export function getCloudinaryLivestreamUrl(streamId: string): string {
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/video/upload/live/${streamId}`;
}
