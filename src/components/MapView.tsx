import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, MapPin, Loader } from 'lucide-react';

// Fix Leaflet default marker icons (broken in Vite/webpack builds)
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom purple marker matching weOut brand
const purpleMarker = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper: re-center map when coords change
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng]);
  return null;
}

interface MapViewProps {
  lat: number;
  lng: number;
  title: string;
  address: string;
}

// Geocode an address string using Nominatim (free, no API key needed)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Always bias results to Nairobi area
    const query = address.toLowerCase().includes('nairobi') ? address : `${address}, Nairobi, Kenya`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ke`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn('Geocoding failed:', e);
  }
  return null;
}

// Nairobi city centre as fallback
const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };

export default function MapView({ lat, lng, title, address }: MapViewProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);

  useEffect(() => {
    // If lat/lng are valid (non-zero), use them directly
    if (lat !== 0 && lng !== 0) {
      setCoords({ lat, lng });
      return;
    }

    // Otherwise geocode the address string
    if (!address) {
      setCoords(NAIROBI_CENTER);
      return;
    }

    setGeocoding(true);
    geocodeAddress(address).then((result) => {
      if (result) {
        setCoords(result);
      } else {
        // Fall back to Nairobi centre
        setCoords(NAIROBI_CENTER);
        setGeocodeFailed(true);
      }
      setGeocoding(false);
    });
  }, [lat, lng, address]);

  const directionsUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(address)}`;

  if (geocoding || !coords) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-stone-100 rounded-3xl">
        <div className="flex flex-col items-center gap-2 text-stone-400">
          <Loader size={24} className="animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest">Locating venue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative z-0 rounded-3xl overflow-hidden">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapUpdater lat={coords.lat} lng={coords.lng} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LeafletMarker position={[coords.lat, coords.lng]} icon={purpleMarker}>
          <Popup>
            <div className="p-1 min-w-[160px]">
              <p className="font-bold text-stone-900 text-sm m-0">{title}</p>
              <p className="text-xs text-stone-500 mt-1 mb-2">{address}</p>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-violet-700 hover:underline"
              >
                Get Directions <ExternalLink size={10} />
              </a>
            </div>
          </Popup>
        </LeafletMarker>
      </MapContainer>

      {/* Floating info bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md text-white rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} className="text-violet-400 flex-shrink-0" />
            <span className="text-xs font-medium truncate">{address}</span>
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-violet-400 hover:text-violet-300 flex-shrink-0 ml-3"
          >
            Directions <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Geocode fallback notice */}
      {geocodeFailed && (
        <div className="absolute top-3 left-3 z-[1000] bg-amber-500/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
          Showing approximate location
        </div>
      )}
    </div>
  );
}
