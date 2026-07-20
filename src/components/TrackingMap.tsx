import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Loader2, Globe, Truck, Play, Anchor, Plane } from 'lucide-react';
import { ShipmentStatus, ShippingMethod } from '../types';

// Fallback exact coordinates of key international ports and logistical hubs
const CITY_COORDINATES_CACHE: Record<string, { lat: number; lng: number }> = {
  'NEW YORK': { lat: 40.7128, lng: -74.0060 },
  'CHICAGO': { lat: 41.8781, lng: -87.6298 },
  'LOS ANGELES': { lat: 34.0522, lng: -118.2437 },
  'HOUSTON': { lat: 29.7604, lng: -95.3698 },
  'MIAMI': { lat: 25.7617, lng: -80.1918 },
  'SAN FRANCISCO': { lat: 37.7749, lng: -122.4194 },
  'SEATTLE': { lat: 47.6062, lng: -122.3321 },
  'DALLAS': { lat: 32.7767, lng: -96.7970 },
  'ATLANTA': { lat: 33.7490, lng: -84.3880 },
  'BOSTON': { lat: 42.3601, lng: -71.0589 },
  'WASHINGTON': { lat: 38.9072, lng: -77.0369 },
  'ANCHORAGE': { lat: 61.2181, lng: -149.9003 },
  'HONOLULU': { lat: 21.3069, lng: -157.8583 },
  'LONDON': { lat: 51.5074, lng: -0.1278 },
  'PARIS': { lat: 48.8566, lng: 2.3522 },
  'FRANKFURT': { lat: 50.1109, lng: 8.6821 },
  'HAMBURG': { lat: 53.5511, lng: 9.9937 },
  'AMSTERDAM': { lat: 52.3676, lng: 4.9041 },
  'ROTTERDAM': { lat: 51.9244, lng: 4.4777 },
  'TOKYO': { lat: 35.6762, lng: 139.6503 },
  'SHANGHAI': { lat: 31.2304, lng: 121.4737 },
  'SINGAPORE': { lat: 1.3521, lng: 103.8198 },
  'HONG KONG': { lat: 22.3193, lng: 114.1694 },
  'SEOUL': { lat: 37.5665, lng: 126.9780 },
  'MUMBAI': { lat: 19.0760, lng: 72.8777 },
  'DUBAI': { lat: 25.2048, lng: 55.2708 },
  'TORONTO': { lat: 43.6532, lng: -79.3832 },
  'VANCOUVER': { lat: 49.2827, lng: -123.1207 },
  'MELBOURNE': { lat: -37.8136, lng: 144.9631 },
  'SYDNEY': { lat: -33.8688, lng: 151.2093 }
};

interface TrackingMapProps {
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  status: ShipmentStatus;
  shippingMethod: ShippingMethod;
  carrier: string;
}

// Map Controller for dynamic viewport boundaries and vector drawing
function MapController({
  originCoords,
  destinationCoords,
  progressCoords
}: {
  originCoords: google.maps.LatLngLiteral;
  destinationCoords: google.maps.LatLngLiteral;
  progressCoords: google.maps.LatLngLiteral | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google) return;

    // Adjust the map viewport to present both ends of the shipping corridor securely
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(originCoords);
    bounds.extend(destinationCoords);
    
    map.fitBounds(bounds, {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60
    });
  }, [map, originCoords, destinationCoords]);

  useEffect(() => {
    if (!map || !window.google) return;

    // Render geodesic transit polyline on top of interactive tile layers
    const transitCorridorLine = new window.google.maps.Polyline({
      path: [originCoords, destinationCoords],
      geodesic: true,
      strokeColor: '#0ea5e9', // high visibility sky blue
      strokeOpacity: 0.7,
      strokeWeight: 4,
    });

    transitCorridorLine.setMap(map);

    return () => {
      transitCorridorLine.setMap(null);
    };
  }, [map, originCoords, destinationCoords]);

  return null;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  'AIzaSyD-TcCe5L_EA4KZx1Tift2l7kB9VHFOquw';

// Clean city strings to lookup in cached logs
function normalizeCityName(city: string): string {
  return city ? city.split(',')[0].trim().toUpperCase() : '';
}

// Calculate vessel location coordinates along transit corridor vector
function calculateTransitPoint(
  origin: google.maps.LatLngLiteral,
  dest: google.maps.LatLngLiteral,
  status: ShipmentStatus
): google.maps.LatLngLiteral {
  let progressFraction = 0;
  switch (status) {
    case 'received':
      progressFraction = 0.05;
      break;
    case 'transit':
      progressFraction = 0.45;
      break;
    case 'customs':
      progressFraction = 0.75;
      break;
    case 'out_for_delivery':
      progressFraction = 0.90;
      break;
    case 'delivered':
      progressFraction = 1.0;
      break;
    default:
      progressFraction = 0.5;
  }

  return {
    lat: origin.lat + (dest.lat - origin.lat) * progressFraction,
    lng: origin.lng + (dest.lng - origin.lng) * progressFraction
  };
}

export default function TrackingMap({
  originCity,
  originCountry,
  destinationCity,
  destinationCountry,
  status,
  shippingMethod,
  carrier
}: TrackingMapProps) {
  const [originCoords, setOriginCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(true);

  // Address geocoding effect utilizing local fast-caches first and API fallback backup
  useEffect(() => {
    let active = true;
    setIsGeocoding(true);

    const matchCoordinates = async () => {
      const uOrigin = normalizeCityName(originCity);
      const uDest = normalizeCityName(destinationCity);

      let foundOrigin = CITY_COORDINATES_CACHE[uOrigin] || null;
      let foundDest = CITY_COORDINATES_CACHE[uDest] || null;

      // Fallback: Use google maps service globally if missing from simple local cache
      const fetchCoordsGeocode = async (addressQuery: string): Promise<google.maps.LatLngLiteral | null> => {
        if (typeof window !== 'undefined' && window.google && window.google.maps) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoder.geocode({ address: addressQuery }, (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                  resolve(results);
                } else {
                  reject(new Error(`Geocode failed with state ${status}`));
                }
              });
            });
            const location = result[0].geometry.location;
            return { lat: location.lat(), lng: location.lng() };
          } catch (err) {
            console.warn(`Geocoding failed for [${addressQuery}], fallback defaults loaded:`, err);
          }
        }
        return null;
      };

      if (!foundOrigin) {
        const dynamicRes = await fetchCoordsGeocode(`${originCity}, ${originCountry}`);
        if (dynamicRes) foundOrigin = dynamicRes;
      }
      if (!foundDest) {
        const dynamicRes = await fetchCoordsGeocode(`${destinationCity}, ${destinationCountry}`);
        if (dynamicRes) foundDest = dynamicRes;
      }

      // Safe defaults if everything fails
      const finalOrigin = foundOrigin || { lat: 40.7128, lng: -74.0060 }; // NYC
      const finalDest = foundDest || { lat: 34.0522, lng: -118.2437 }; // LAX

      if (active) {
        setOriginCoords(finalOrigin);
        setDestinationCoords(finalDest);
        setIsGeocoding(false);
      }
    };

    matchCoordinates();
    return () => {
      active = false;
    };
  }, [originCity, originCountry, destinationCity, destinationCountry]);

  if (isGeocoding || !originCoords || !destinationCoords) {
    return (
      <div className="w-full h-[320px] bg-slate-950 flex flex-col items-center justify-center rounded-2xl border border-slate-800 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        <span className="text-xs font-mono tracking-wider uppercase">Loading Live Intermodal Telemetry Link...</span>
      </div>
    );
  }

  const transitPosition = calculateTransitPoint(originCoords, destinationCoords, status);

  // Return specific transport mode icons
  const getCarrierIcon = () => {
    switch (shippingMethod) {
      case 'Sea Cargo':
        return <Anchor className="w-4 h-4 text-slate-950" />;
      case 'Air Freight':
        return <Plane className="w-4 h-4 text-slate-950" />;
      default:
        return <Truck className="w-4 h-4 text-slate-950" />;
    }
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner relative">
      <div className="absolute top-3 left-3 z-[100] bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span>Satellite Feed: <strong className="text-sky-400">Connected</strong></span>
      </div>

      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={transitPosition}
          defaultZoom={4}
          mapId="DEMO_MAP_ID"
          gestureHandling="cooperative"
          disableDefaultUI={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '320px' }}
        >
          {/* 1. Origin Depot Pin */}
          <AdvancedMarker position={originCoords} title={`Origin Depot: ${originCity}`}>
            <Pin background="#10b981" glyphColor="#fff" borderColor="#059669">
              <span className="text-[10px] uppercase font-bold text-white px-1 select-none">DEPOT</span>
            </Pin>
          </AdvancedMarker>

          {/* 2. Destination Port Pin */}
          <AdvancedMarker position={destinationCoords} title={`Terminal: ${destinationCity}`}>
            <Pin background="#3b82f6" glyphColor="#fff" borderColor="#2563eb">
              <span className="text-[10px] uppercase font-bold text-white px-1 select-none">TERM</span>
            </Pin>
          </AdvancedMarker>

          {/* 3. Real-Time Moving Transit Carrier Ping */}
          {status !== 'delivered' && (
            <AdvancedMarker position={transitPosition} title={`Active Transit via ${carrier}`}>
              <div className="relative flex items-center justify-center">
                {/* Ping waves aura behind the transport node */}
                <span className="absolute animate-ping inline-flex h-9 w-9 rounded-full bg-sky-400 opacity-75"></span>
                <div className="relative bg-sky-400 border-2 border-white p-2 rounded-full shadow-lg flex items-center justify-center">
                  {getCarrierIcon()}
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Controller handles line rendering and fitting camera boundaries */}
          <MapController 
            originCoords={originCoords} 
            destinationCoords={destinationCoords} 
            progressCoords={transitPosition} 
          />
        </Map>
      </APIProvider>
    </div>
  );
}
