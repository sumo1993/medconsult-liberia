import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET = 'gallery'; // existing public Supabase bucket

function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL.trim() && SUPABASE_SERVICE_KEY.trim());
}

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
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
  };
  return map[mime] || '.bin';
}

async function uploadToSupabase(buffer: Buffer, mimeType: string, folder: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const ext = extensionForMime(mimeType);
  const path = `${folder}/${randomUUID()}${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  const { uploadToCloudinary: cldUpload } = await import('@/lib/cloudinary');
  return cldUpload(buffer, folder);
}

/**
 * Upload priority:
 *  1. Supabase Storage (already configured — same account as DB)
 *  2. Cloudinary (if CLOUDINARY_* env vars are set)
 *  3. Local filesystem fallback (dev only — does NOT work on Vercel)
 */
export async function uploadMediaBuffer(
  buffer: Buffer,
  mimeType: string,
  cloudFolder = 'medconsult/media'
): Promise<{ url: string; usedCloudinary: boolean }> {
  if (isSupabaseConfigured()) {
    const url = await uploadToSupabase(buffer, mimeType, cloudFolder);
    return { url, usedCloudinary: false };
  }

  if (isCloudinaryConfigured()) {
    const url = await uploadToCloudinary(buffer, cloudFolder);
    return { url, usedCloudinary: true };
  }

  // Local fallback (development only)
  const { writeFile, mkdir } = await import('fs/promises');
  const { existsSync } = await import('fs');
  const path = await import('path');

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
