'use client';

import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Navigation, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface GPSCaptureProps {
  onLocationCaptured: (lat: number, lng: number, accuracy: number) => void;
  value?: string;
  className?: string;
}

export default function GPSCapture({ onLocationCaptured, value, className = '' }: GPSCaptureProps) {
  const { latitude, longitude, accuracy, error, loading, getLocation, hasLocation, formatCoordinates } = useGeolocation();

  const handleCapture = () => {
    getLocation();
  };

  // Notify parent when location is captured
  if (hasLocation && latitude && longitude && accuracy) {
    onLocationCaptured(latitude, longitude, accuracy);
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            hasLocation 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          } disabled:opacity-50`}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Getting location...
            </>
          ) : hasLocation ? (
            <>
              <CheckCircle size={16} />
              Location Captured
            </>
          ) : (
            <>
              <Navigation size={16} />
              Capture GPS Location
            </>
          )}
        </button>
        
        {hasLocation && (
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin size={14} className="text-emerald-600" />
            {formatCoordinates()}
            {accuracy && (
              <span className="text-xs text-gray-400">
                (±{Math.round(accuracy)}m)
              </span>
            )}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {value && !hasLocation && (
        <p className="text-sm text-gray-500">
          Previous location: {value}
        </p>
      )}
    </div>
  );
}


