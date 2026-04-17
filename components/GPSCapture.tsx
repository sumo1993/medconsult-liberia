'use client';

import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useCallback } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Navigation, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface GPSCaptureProps {
  onLocationCaptured: (lat: number, lng: number, accuracy: number) => void;
  onAddressResolved?: (locationName: string) => void;
  value?: string;
  className?: string;
}

type OfflinePlace = {
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
};

const OFFLINE_WORLD_PLACES: OfflinePlace[] = [
  { city: 'Monrovia', region: 'Montserrado', country: 'Liberia', lat: 6.3005, lng: -10.7969 },
  { city: 'Buchanan', region: 'Grand Bassa', country: 'Liberia', lat: 5.8808, lng: -10.0467 },
  { city: 'Gbarnga', region: 'Bong', country: 'Liberia', lat: 6.9956, lng: -9.4722 },
  { city: 'Ganta', region: 'Nimba', country: 'Liberia', lat: 7.2261, lng: -8.9844 },
  { city: 'Voinjama', region: 'Lofa', country: 'Liberia', lat: 8.4219, lng: -9.7478 },
  { city: 'Beijing', region: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
  { city: 'Shanghai', region: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
  { city: 'Guangzhou', region: 'Guangdong', country: 'China', lat: 23.1291, lng: 113.2644 },
  { city: 'Shenzhen', region: 'Guangdong', country: 'China', lat: 22.5431, lng: 114.0579 },
  { city: 'Wuhan', region: 'Hubei', country: 'China', lat: 30.5928, lng: 114.3055 },
  { city: 'Tokyo', region: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { city: 'Seoul', region: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978 },
  { city: 'Bangkok', region: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { city: 'Singapore', region: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'Dubai', region: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { city: 'London', region: 'England', country: 'United Kingdom', lat: 51.5072, lng: -0.1276 },
  { city: 'Paris', region: 'Ile-de-France', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'New York', region: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
];

export default function GPSCapture({ onLocationCaptured, onAddressResolved, value, className = '' }: GPSCaptureProps) {
  const { latitude, longitude, accuracy, error, loading, getLocation, hasLocation, formatCoordinates } = useGeolocation();
  const lastCapturedKeyRef = useRef<string | null>(null);
  const lastResolvedKeyRef = useRef<string | null>(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvedDisplay, setResolvedDisplay] = useState('');
  const [addressError, setAddressError] = useState('');

  const handleCapture = () => {
    getLocation();
  };

  const buildLocationFromAddress = useCallback((address: Record<string, string | undefined>) => {
    const locality =
      address.suburb ||
      address.neighbourhood ||
      address.city_district ||
      address.district ||
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.state_district ||
      address.state ||
      '';
    const region = address.state || address.province || '';
    const country = address.country || '';
    return [locality, region, country].filter(Boolean).join(', ');
  }, []);

  const haversineKm = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const applyOfflineFallback = useCallback((lat: number, lng: number) => {
    let nearest = OFFLINE_WORLD_PLACES[0];
    let bestDistance = haversineKm(lat, lng, nearest.lat, nearest.lng);

    for (const place of OFFLINE_WORLD_PLACES.slice(1)) {
      const distance = haversineKm(lat, lng, place.lat, place.lng);
      if (distance < bestDistance) {
        nearest = place;
        bestDistance = distance;
      }
    }

    const location = `${nearest.city}, ${nearest.region}, ${nearest.country}`;
    setResolvedAddress(location);
    setResolvedDisplay(`${location} (offline nearest city, ~${bestDistance.toFixed(1)} km)`);
    onAddressResolved?.(location);
  }, [haversineKm, onAddressResolved]);

  const tryBrowserFallback = useCallback(async (lat: number, lng: number) => {
    try {
      const nominatimRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (nominatimRes.ok) {
        const nominatimData = await nominatimRes.json();
        const address = (nominatimData.address || {}) as Record<string, string | undefined>;
        const location = buildLocationFromAddress(address) || nominatimData.display_name || '';
        if (location) {
          setResolvedAddress(location);
          setResolvedDisplay(nominatimData.display_name || location);
          onAddressResolved?.(location);
          setAddressError('');
          return true;
        }
      }
    } catch {
      // next fallback
    }

    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const location =
          [bdcData.locality || bdcData.city || '', bdcData.principalSubdivision || '', bdcData.countryName || '']
            .filter(Boolean)
            .join(', ');
        if (location) {
          setResolvedAddress(location);
          setResolvedDisplay(bdcData.localityInfo?.informative?.join(', ') || location);
          onAddressResolved?.(location);
          setAddressError('');
          return true;
        }
      }
    } catch {
      // ignore
    }

    return false;
  }, [buildLocationFromAddress, onAddressResolved]);

  useEffect(() => {
    if (!hasLocation || latitude == null || longitude == null || accuracy == null) return;

    const currentKey = `${latitude}:${longitude}:${accuracy}`;
    if (lastCapturedKeyRef.current === currentKey) return;

    lastCapturedKeyRef.current = currentKey;
    onLocationCaptured(latitude, longitude, accuracy);
  }, [hasLocation, latitude, longitude, accuracy, onLocationCaptured]);

  useEffect(() => {
    if (!hasLocation || latitude == null || longitude == null) return;

    const coordKey = `${latitude}:${longitude}`;
    if (lastResolvedKeyRef.current === coordKey) return;
    lastResolvedKeyRef.current = coordKey;

    const controller = new AbortController();

    const resolveAddress = async () => {
      setResolvingAddress(true);
      setAddressError('');
      // Always set an immediate offline nearest-city fallback first.
      // If online geocoding succeeds, it will replace this value.
      applyOfflineFallback(latitude, longitude);
      try {
        const response = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          const okFromBrowser = await tryBrowserFallback(latitude, longitude);
          if (!okFromBrowser) {
            applyOfflineFallback(latitude, longitude);
            setAddressError(data?.providerErrors?.join(', ') || data?.error || 'Using offline nearest-city fallback');
          }
          return;
        }
        if (data?.location) {
          setResolvedAddress(data.location);
          setResolvedDisplay(data.display_name || data.location);
          onAddressResolved?.(data.location);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Reverse geocoding error:', err);
          applyOfflineFallback(latitude, longitude);
          setAddressError('Network error: using offline nearest-city fallback');
        }
      } finally {
        setResolvingAddress(false);
      }
    };

    resolveAddress();
    return () => controller.abort();
  }, [hasLocation, latitude, longitude, onAddressResolved, tryBrowserFallback, applyOfflineFallback]);

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

      {hasLocation && (
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            {resolvingAddress ? 'Resolving place name...' : resolvedAddress ? `Location: ${resolvedAddress}` : 'Location name unavailable'}
          </p>
          {!resolvingAddress && resolvedDisplay && resolvedDisplay !== resolvedAddress && (
            <p className="text-xs text-gray-500">{resolvedDisplay}</p>
          )}
          {!resolvingAddress && addressError && (
            <p className="text-xs text-red-600">Geocode error: {addressError}</p>
          )}
        </div>
      )}
    </div>
  );
}
