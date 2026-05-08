import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('Warning: Cloudinary environment variables are not configured');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  type: string;
  resource_type: string;
}

/**
 * Upload a file to Cloudinary from a buffer
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = 'employme'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        public_id: filename.split('.')[0],
        overwrite: false,
        use_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve(result as CloudinaryUploadResult);
        } else {
          reject(new Error('Cloudinary upload returned no result'));
        }
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete from Cloudinary: ${publicId}`, error);
  }
}

/**
 * Get a secure signed URL for a file
 */
export function getCloudinarySignedUrl(publicId: string, expiresIn: number = 3600): string {
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    transformation: [
      {
        quality: 'auto',
        fetch_format: 'auto',
      },
    ],
  });
}
