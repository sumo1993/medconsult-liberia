'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface ProfileAvatarProps {
  userId?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showOnlineDot?: boolean;
}

export default function ProfileAvatar({ userId, size = 'md', className = '', onClick, showOnlineDot = false }: ProfileAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useOnlineStatus();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 32,
  };

  useEffect(() => {
    loadProfilePhoto();
    
    // Cleanup function to revoke object URL
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [userId]);

  const loadProfilePhoto = async () => {
    try {
      // Add timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const url = userId 
        ? `/api/profile/photo?userId=${userId}&t=${timestamp}`
        : `/api/profile/photo?t=${timestamp}`;
      
      const token = localStorage.getItem('auth-token');
      const response = await fetch(url, {
        headers: {
          ...(token && !userId ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        cache: 'no-store', // Prevent caching
      });

      if (response.status === 204) {
        setPhotoUrl(null);
      } else if (response.ok) {
        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          setPhotoUrl(null);
          return;
        }
        // Revoke old URL before creating new one
        if (photoUrl) {
          URL.revokeObjectURL(photoUrl);
        }
        const objectUrl = URL.createObjectURL(blob);
        setPhotoUrl(objectUrl);
      } else {
        setPhotoUrl(null);
      }
    } catch (error) {
      console.log('No profile photo available');
      setPhotoUrl(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${photoUrl ? 'bg-transparent' : 'bg-emerald-700'} rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all ${className}`}
      onClick={onClick}
    >
      {photoUrl ? (
        <img 
          src={photoUrl} 
          alt="Profile" 
          className="w-full h-full object-cover rounded-full"
          onError={() => setPhotoUrl(null)}
        />
      ) : (
        <User className="text-white" size={iconSizes[size]} />
      )}
      {showOnlineDot && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-300'
          }`}
          title={isOnline ? 'Active now' : 'Offline'}
        />
      )}
    </div>
  );
}
