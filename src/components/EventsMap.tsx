import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import type { Event } from "../../types";

import "leaflet/dist/leaflet.css";

// Fix default marker icons in react-leaflet (webpack/vite)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Nairobi area / venue name -> [lat, lng] for events without coordinates
const AREA_COORDS: Record<string, [number, number]> = {
  nairobi: [-1.2921, 36.8219],
  kicc: [-1.2889, 36.8231],
  westlands: [-1.2658, 36.8066],
  karen: [-1.3192, 36.6933],
  kasarani: [-1.2196, 36.8917],
  sarit: [-1.264, 36.806],
  kilimani: [-1.297, 36.792],
  cbd: [-1.2921, 36.8219],
  langata: [-1.363, 36.754],
  parklands: [-1.268, 36.818],
  gigiri: [-1.219, 36.812],
  runda: [-1.205, 36.798],
  lavington: [-1.293, 36.775],
  embakasi: [-1.321, 36.894],
};

const NAIROBI_CENTER: [number, number] = [-1.2921, 36.8219];

function getEventCoords(ev: Event): [number, number] {
  if (ev.latitude != null && ev.longitude != null) {
    return [ev.latitude, ev.longitude];
  }
  const key = (ev.area || ev.location || "").toLowerCase().replace(/\s+/g, "");
  for (const [area, coords] of Object.entries(AREA_COORDS)) {
    if (key.includes(area) || area.includes(key)) return coords;
  }
  const locationKey = (ev.location || "").toLowerCase().replace(/\s+/g, "");
  for (const [area, coords] of Object.entries(AREA_COORDS)) {
    if (locationKey.includes(area) || area.includes(locationKey)) return coords;
  }
  return NAIROBI_CENTER;
}

/** Fit map bounds to show all event markers when events change */
function FitBounds({ eventCoords }: { eventCoords: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (eventCoords.length === 0) return;
    if (eventCoords.length === 1) {
      map.setView(eventCoords[0], 14);
      return;
    }
    const bounds = L.latLngBounds(eventCoords);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, eventCoords]);
  return null;
}

interface EventsMapProps {
  events: Event[];
}

export const EventsMap: React.FC<EventsMapProps> = ({ events }) => {
  const eventCoords = useMemo(
    () => events.map((ev) => getEventCoords(ev)),
    [events]
  );

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <h2 style={{ marginBottom: 12 }}>Find events on the map</h2>
      <div style={{ height: 400, borderRadius: 12, overflow: "hidden", border: "1px solid #ddd" }}>
        <MapContainer
          center={NAIROBI_CENTER}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds eventCoords={eventCoords} />
          {events.map((ev) => {
            const [lat, lng] = getEventCoords(ev);
            return (
              <Marker key={ev.id} position={[lat, lng]} icon={defaultIcon}>
                <Popup>
                  <strong>{ev.title}</strong>
                  <br />
                  {ev.location && <>{ev.location}</>}
                  {ev.area && ev.area !== ev.location && ` · ${ev.area}`}
                  {ev.date && (
                    <>
                      <br />
                      <small>{ev.date}{ev.time ? ` · ${ev.time}` : ""}</small>
                    </>
                  )}
                  <br />
                  <Link to={`/event/${ev.id}`}>View event</Link>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default EventsMap;
