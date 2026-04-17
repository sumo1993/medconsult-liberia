'use client';

import Image from 'next/image';
import { useState } from 'react';

interface UserPhotoAvatarProps {
  userId?: number | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isActive?: boolean;
}

export default function UserPhotoAvatar({
  userId,
  name = '',
  size = 'md',
  className = '',
  isActive = false,
}: UserPhotoAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = userId ? `/api/profile/photo?userId=${userId}` : null;
  const showImage = !!src && failedSrc !== src;

  const initial = name.trim().charAt(0).toUpperCase() || 'U';
  const sizeClass =
    size === 'sm' ? 'h-8 w-8 text-sm' : size === 'lg' ? 'h-12 w-12 text-lg' : 'h-10 w-10 text-base';

  return (
    <div
      className={`relative inline-flex ${sizeClass} items-center justify-center overflow-hidden rounded-full bg-emerald-500 font-semibold text-white ${className}`}
      aria-label={name ? `${name} avatar` : 'User avatar'}
    >
      <span>{initial}</span>
      {showImage && src && (
        <Image
          src={src}
          alt={name ? `${name} profile photo` : 'Profile photo'}
          fill
          sizes="48px"
          className="absolute inset-0 object-cover"
          onError={() => setFailedSrc(src)}
          unoptimized
        />
      )}
      <span
        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
          isActive ? 'bg-green-500' : 'bg-gray-300'
        }`}
        title={isActive ? 'Active now' : 'Offline'}
      />
    </div>
  );
}
