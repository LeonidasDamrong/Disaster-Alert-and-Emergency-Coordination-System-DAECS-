import React, { useCallback, useState } from 'react';
import { useJsApiLoader, GoogleMap, Marker, useGoogleMap } from '@react-google-maps/api';
import type { SOS } from '../lib/types';

const mapContainerStyle = { width: '100%', height: '100%', minHeight: 600 };
const defaultCenter = { lat: 3.1390, lng: 101.6869 }; // Kuala Lumpur
const defaultZoom = 10;

// Dummy/placeholder API key - replace with your Google Maps API key in .env
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

export interface DangerZoneData {
  id: string;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  dangerLevel: string;
  colorHex: string;
}

const LOCATE_ZOOM = 15;

interface SOSMapViewProps {
  sosRequests: SOS[];
  dangerZones?: DangerZoneData[];
  selectedSOSId?: string | null;
  centerOnSOSId?: string | null;
  onMarkerClick?: (sos: SOS) => void;
  className?: string;
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'Critical': return '#DC2626';
    case 'High': return '#EA580C';
    case 'Medium': return '#F59E0B';
    case 'Low': return '#10B981';
    default: return '#6B7280';
  }
}

function MapContent({
  sosRequests,
  dangerZones,
  selectedSOSId,
  centerOnSOSId,
  onMarkerClick,
}: {
  sosRequests: SOS[];
  dangerZones?: DangerZoneData[];
  selectedSOSId?: string | null;
  centerOnSOSId?: string | null;
  onMarkerClick?: (sos: SOS) => void;
}) {
  const map = useGoogleMap();

  // Pan and zoom to specific SOS when "Locate" is clicked
  React.useEffect(() => {
    if (!map || !centerOnSOSId) return;
    const sos = sosRequests.find(s => s.id === centerOnSOSId);
    if (!sos || !sos.latitude || !sos.longitude) return;
    const pos = { lat: Number(sos.latitude), lng: Number(sos.longitude) };
    map.panTo(pos);
    map.setZoom(LOCATE_ZOOM);
  }, [map, centerOnSOSId, sosRequests]);

  const bounds = React.useMemo(() => {
    const points: { lat: number; lng: number }[] = sosRequests
      .filter(s => s.latitude && s.longitude)
      .map(s => ({ lat: Number(s.latitude), lng: Number(s.longitude) }));
    if (dangerZones?.length) {
      dangerZones.forEach(z => {
        points.push({ lat: Number(z.centerLatitude), lng: Number(z.centerLongitude) });
      });
    }
    if (points.length === 0) return null;
    const b = new google.maps.LatLngBounds();
    points.forEach(p => b.extend(p));
    return b;
  }, [sosRequests, dangerZones]);

  // Fit bounds on initial load; skip when user has located to a specific SOS
  React.useEffect(() => {
    if (map && bounds && !centerOnSOSId) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [map, bounds, centerOnSOSId]);

  return (
    <>
      {dangerZones?.map((zone) => (
        <CircleOverlay
          key={zone.id}
          center={{ lat: zone.centerLatitude, lng: zone.centerLongitude }}
          radius={zone.radiusMeters}
          fillColor={zone.colorHex}
          fillOpacity={0.2}
          strokeColor={zone.colorHex}
          strokeWeight={2}
        />
      ))}
      {sosRequests
        .filter(s => s.latitude != null && s.longitude != null)
        .map((sos) => (
          <Marker
            key={sos.id}
            position={{ lat: Number(sos.latitude), lng: Number(sos.longitude) }}
            onClick={() => onMarkerClick?.(sos)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: selectedSOSId === sos.id ? 14 : 10,
              fillColor: getUrgencyColor(sos.urgency),
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
            title={`${sos.id}: ${sos.victimName} - ${sos.status}`}
          />
        ))}
    </>
  );
}

function CircleOverlay({
  center,
  radius,
  fillColor,
  fillOpacity,
  strokeColor,
  strokeWeight,
}: {
  center: { lat: number; lng: number };
  radius: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWeight: number;
}) {
  const map = useGoogleMap();

  React.useEffect(() => {
    if (!map) return;
    const circle = new google.maps.Circle({
      map,
      center,
      radius,
      fillColor,
      fillOpacity,
      strokeColor,
      strokeWeight,
    });
    return () => {
      circle.setMap(null);
    };
  }, [map, center.lat, center.lng, radius, fillColor, fillOpacity, strokeColor, strokeWeight]);

  return null;
}

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export function SOSMapView({
  sosRequests,
  dangerZones = [],
  selectedSOSId,
  centerOnSOSId,
  onMarkerClick,
  className = '',
}: SOSMapViewProps) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapAuthFailed, setMapAuthFailed] = useState(false);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  // Catch Google Maps auth failure (invalid key, referrer restriction, billing disabled)
  React.useEffect(() => {
    window.gm_authFailure = () => {
      setMapAuthFailed(true);
      setLoadError(`API key rejected. Add this URL to your Google Cloud API key restrictions: ${currentOrigin}`);
    };
    return () => { delete window.gm_authFailure; };
  }, [currentOrigin]);

  const { isLoaded, loadError: loaderError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  React.useEffect(() => {
    if (loaderError) {
      const msg = loaderError?.message || 'Failed to load Google Maps';
      setLoadError(msg);
    } else if (isLoaded && !mapAuthFailed) {
      setLoadError(null);
    }
  }, [loaderError, isLoaded, mapAuthFailed]);

  const onLoad = useCallback((_map: google.maps.Map) => { }, []);
  const onUnmount = useCallback((_map: google.maps.Map) => { }, []);

  const effectiveError = loadError || (mapAuthFailed ? `API key rejected. Add this URL to your Google Cloud API key restrictions: ${currentOrigin}` : null);

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={mapContainerStyle}>
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (effectiveError) {
    const keyHint = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY'
      ? `Key ends with: ...${GOOGLE_MAPS_API_KEY.slice(-4)}`
      : 'No key loaded';
    return (
      <div className={`flex flex-col items-center justify-center bg-amber-50 rounded-lg p-6 ${className}`} style={mapContainerStyle}>
        <p className="text-amber-800 font-medium">Google Maps could not be loaded</p>
        <p className="text-sm text-amber-700 mt-1">{effectiveError}</p>
        {currentOrigin && (
          <p className="text-xs text-amber-600 mt-2 font-mono bg-amber-100 px-2 py-1 rounded">
            Add to Google Cloud Console → API key → Website restrictions: {currentOrigin}/*
          </p>
        )}
        {GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY' && (
          <p className="text-xs text-gray-500 mt-1">Add VITE_GOOGLE_MAPS_API_KEY to your .env file (no quotes)</p>
        )}
        <div className="mt-4 p-3 bg-amber-100/50 rounded border border-amber-200 text-left text-xs max-w-md">
          <p className="font-medium text-amber-800">Diagnostics:</p>
          <p className="text-amber-700 mt-1">{keyHint}</p>
          <p className="text-amber-700 mt-1">1. Open DevTools (F12) → Console tab. Look for the exact Google error (e.g. RefererNotAllowedMapError, ApiNotActivatedMapError).</p>
          <p className="text-amber-700 mt-1">2. Try in incognito to rule out extensions (ad blockers can block Maps).</p>
          <p className="text-amber-700 mt-1">3. Ensure .env has no quotes or spaces: VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY</p>
          <p className="text-amber-700 mt-1">4. Restart npm run dev after changing .env.</p>
        </div>
        <div className="mt-4 p-4 bg-white rounded border border-amber-200 text-left text-sm max-h-32 overflow-y-auto">
          <p className="font-medium">SOS Locations (fallback):</p>
          {sosRequests.filter(s => s.latitude && s.longitude).map(s => (
            <p key={s.id} className="text-gray-600 mt-1">
              {s.id}: {s.location} ({s.latitude}, {s.longitude}) - {s.urgency}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`} style={mapContainerStyle}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        <MapContent
          sosRequests={sosRequests}
          dangerZones={dangerZones}
          selectedSOSId={selectedSOSId}
          centerOnSOSId={centerOnSOSId}
          onMarkerClick={onMarkerClick}
        />
      </GoogleMap>
    </div>
  );
}
