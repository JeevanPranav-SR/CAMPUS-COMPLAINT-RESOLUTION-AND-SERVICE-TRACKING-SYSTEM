"use client";

import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  LayerGroup,
  LayersControl,
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CAMPUS_CENTER,
  CAMPUS_LOCATIONS,
  CAMPUS_POLYGON,
  zoneColor,
  type CampusLocation,
} from "@/lib/campus";
import type { Ticket } from "@/lib/types";
import { STATUS_META } from "@/lib/constants";

type Props = {
  tickets?: Ticket[];
  selectedId?: string | null;
  pickMode?: boolean;
  pick?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  onSelectTicket?: (id: string) => void;
  onSelectLocation?: (location: CampusLocation) => void;
  showLocations?: boolean;
  focus?: [number, number] | null;
  heat?: boolean;
};

function Recenter({ focus }: { focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo(focus, 18, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

function ClickPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function statusColor(status: string) {
  if (status === "RESOLVED" || status === "CLOSED") return "#34d399";
  if (status === "IN_PROGRESS") return "#fbbf24";
  if (status === "ON_HOLD") return "#94a3b8";
  if (status === "CRITICAL") return "#fb7185";
  return "#22d3ee";
}

export default function MapCanvas({
  tickets = [],
  selectedId,
  pickMode,
  pick,
  onPick,
  onSelectTicket,
  onSelectLocation,
  showLocations = true,
  focus,
  heat = true,
}: Props) {
  const polygon = useMemo(() => CAMPUS_POLYGON.map(([lat, lng]) => [lat, lng] as [number, number]), []);

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
  }, []);

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={16}
      minZoom={15}
      maxZoom={19}
      scrollWheelZoom
      className="h-full w-full rounded-[28px]"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Night streets">
          <TileLayer
            attribution='&copy; OSM &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked name="BIT campus boundary">
          <Polygon
            positions={polygon}
            pathOptions={{
              color: "#22d3ee",
              weight: 2,
              fillColor: "#22d3ee",
              fillOpacity: 0.06,
              dashArray: "6 10",
            }}
          />
        </LayersControl.Overlay>
        {showLocations ? (
          <LayersControl.Overlay checked name="Campus facilities">
            <LayerGroup>
              {CAMPUS_LOCATIONS.map((location) => (
                <CircleMarker
                  key={location.id}
                  center={[location.lat, location.lng]}
                  radius={location.source === "osm" ? 8 : 6}
                  pathOptions={{
                    color: zoneColor(location.zone),
                    fillColor: zoneColor(location.zone),
                    fillOpacity: 0.85,
                    weight: 1,
                  }}
                  eventHandlers={{
                    click: () => onSelectLocation?.(location),
                  }}
                >
                  <Popup>
                    <div className="min-w-[180px] text-[12px]">
                      <p className="font-semibold text-slate-900">{location.name}</p>
                      <p className="mt-1 text-slate-600">{location.kind} · {location.source === "osm" ? "OSM verified" : "Campus layout"}</p>
                      <p className="mt-1 text-slate-500">{location.note}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        ) : null}
        <LayersControl.Overlay checked name="Live tickets">
          <LayerGroup>
            {tickets.map((ticket) => (
              <CircleMarker
                key={ticket.id}
                center={[ticket.lat, ticket.lng]}
                radius={selectedId === ticket.id ? 16 : ticket.priority === "CRITICAL" ? 13 : 10}
                pathOptions={{
                  color: statusColor(ticket.priority === "CRITICAL" ? "CRITICAL" : ticket.status),
                  fillColor: statusColor(ticket.status),
                  fillOpacity: selectedId === ticket.id ? 0.95 : 0.7,
                  weight: selectedId === ticket.id ? 3 : 1.5,
                }}
                eventHandlers={{ click: () => onSelectTicket?.(ticket.id) }}
              >
                <Popup>
                  <div className="min-w-[200px] text-[12px]">
                    <p className="font-mono text-[10px] tracking-wide text-cyan-700">{ticket.ticketNo}</p>
                    <p className="mt-1 font-semibold text-slate-900">{ticket.title}</p>
                    <p className="mt-1 text-slate-600">
                      {STATUS_META[ticket.status as keyof typeof STATUS_META]?.label} · {ticket.priority}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>
        {heat ? (
          <LayersControl.Overlay checked name="Incident glow">
            <LayerGroup>
              {tickets
                .filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status))
                .map((ticket) => (
                  <CircleMarker
                    key={`heat-${ticket.id}`}
                    center={[ticket.lat, ticket.lng]}
                    radius={28}
                    pathOptions={{
                      color: "transparent",
                      fillColor: ticket.priority === "CRITICAL" || ticket.priority === "HIGH" ? "#fb7185" : "#22d3ee",
                      fillOpacity: 0.12,
                      weight: 0,
                    }}
                  />
                ))}
            </LayerGroup>
          </LayersControl.Overlay>
        ) : null}
      </LayersControl>
      {pickMode && onPick ? <ClickPick onPick={onPick} /> : null}
      {pick ? (
        <CircleMarker
          center={[pick.lat, pick.lng]}
          radius={11}
          pathOptions={{ color: "#f5c542", fillColor: "#f5c542", fillOpacity: 1, weight: 2 }}
        >
          <Popup>Pinned incident location</Popup>
        </CircleMarker>
      ) : null}
      <Recenter focus={focus ?? null} />
    </MapContainer>
  );
}
