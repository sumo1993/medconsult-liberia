'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  value: string | null;
  onChange: (file: File | null, preview: string | null) => void;
  label?: string;
  maxSize?: number; // in MB
}

export default function ImageUpload({ value, onChange, label = 'Featured Image', maxSize = 5 }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`Image must be less than ${maxSize}MB`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(file, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onChange(null, null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} <span className="text-gray-500">(Optional)</span>
      </label>
      <p className="text-sm text-gray-500">
        Upload an image for your post (Max {maxSize}MB)
      </p>

      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="text-gray-400 mb-3" size={48} />
            <span className="text-sm font-medium text-gray-700 mb-1">
              Click to upload image
            </span>
            <span className="text-xs text-gray-500">
              PNG, JPG, GIF up to {maxSize}MB
            </span>
          </label>
        </div>
      ) : (
        <div className="relative border border-gray-300 rounded-lg overflow-hidden">
          <div className="relative w-full h-64">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
            title="Remove image"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
