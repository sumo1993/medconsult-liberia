import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { uploadToCloudinary } from '@/lib/cloudinary';

function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

function extensionForMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
  };
  return map[mime] || '.bin';
}

/**
 * Uploads media to Cloudinary when configured; otherwise saves under public/uploads/media.
 * Returns a URL suitable for storing in DB (absolute Cloudinary URL or site-relative path).
 */
export async function uploadMediaBuffer(
  buffer: Buffer,
  mimeType: string,
  cloudFolder = 'medconsult/media'
): Promise<{ url: string; usedCloudinary: boolean }> {
  if (isCloudinaryConfigured()) {
    const url = await uploadToCloudinary(buffer, cloudFolder);
    return { url, usedCloudinary: true };
  }

  const dir = path.join(process.cwd(), 'public', 'uploads', 'media');
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const ext = extensionForMime(mimeType);
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  return { url: `/uploads/media/${filename}`, usedCloudinary: false };
}
