'use client';

import { useState, useRef } from 'react';
import { showAppAlert } from '@/components/AppDialogsProvider';
import { Camera, X, Image, Upload, Trash2 } from 'lucide-react';

interface PhotoCaptureProps {
  onPhotosCaptured: (photos: { data: string; name: string }[]) => void;
  maxPhotos?: number;
  className?: string;
}

export default function PhotoCapture({ onPhotosCaptured, maxPhotos = 5, className = '' }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<{ data: string; name: string }[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: { data: string; name: string }[] = [];
    
    for (let i = 0; i < files.length && photos.length + newPhotos.length < maxPhotos; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newPhotos.push({ data, name: file.name });
      }
    }

    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    onPhotosCaptured(updatedPhotos);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      void showAppAlert({
        title: 'Camera unavailable',
        message: 'Could not access camera. Please use file upload instead.',
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg', 0.8);
      const newPhoto = { data, name: `photo_${Date.now()}.jpg` };
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      onPhotosCaptured(updatedPhotos);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotosCaptured(updatedPhotos);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
        >
          <Upload size={16} />
          Upload Photos
        </button>

        <button
          type="button"
          onClick={startCamera}
          disabled={photos.length >= maxPhotos}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
        >
          <Camera size={16} />
          Take Photo
        </button>

        <span className="text-sm text-gray-500">
          {photos.length}/{maxPhotos} photos
        </span>
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.data}
                alt={photo.name}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center gap-4">
            <button
              onClick={stopCamera}
              className="p-4 bg-white/20 text-white rounded-full hover:bg-white/30"
            >
              <X size={24} />
            </button>
            <button
              onClick={capturePhoto}
              className="p-6 bg-white rounded-full hover:bg-gray-100"
            >
              <Camera size={32} className="text-gray-900" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


