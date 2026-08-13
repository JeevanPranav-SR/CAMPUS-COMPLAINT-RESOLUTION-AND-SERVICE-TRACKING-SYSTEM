"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  LayerGroup,
  MapContainer,
  Marker,
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

type Basemap = "hybrid" | "satellite" | "map";

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

function pinIcon(fill: string, selected = false) {
  const size = selected ? 40 : 32;
  const height = selected ? 52 : 42;
  return L.divIcon({
    className: "gmaps-pin",
    html: `<svg width="${size}" height="${height}" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 1C8.3 1 2 7.3 2 15c0 10.5 14 25.5 14 25.5S30 25.5 30 15C30 7.3 23.7 1 16 1z" fill="${fill}" stroke="#fff" stroke-width="1.6"/>
      <circle cx="16" cy="15" r="5.2" fill="#fff"/>
    </svg>`,
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height + 8],
  });
}

function ticketFill(ticket: Ticket) {
  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") return "#16a34a";
  if (ticket.status === "IN_PROGRESS") return "#d97706";
  if (ticket.priority === "CRITICAL" || ticket.priority === "HIGH") return "#dc2626";
  return "#2563eb";
}

function Recenter({ focus }: { focus: [number, number] | null }) {
  const map = useMap();
  const lat = focus?.[0];
  const lng = focus?.[1];
  useEffect(() => {
    if (lat == null || lng == null) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 18), { duration: 0.7 });
  }, [lat, lng, map]);
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

function BasemapSwitch({ mode, onChange }: { mode: Basemap; onChange: (mode: Basemap) => void }) {
  const map = useMap();
  return createPortal(
    <div className="gmaps-basemap">
      <button type="button" className={mode === "map" ? "on" : ""} onClick={() => onChange("map")}>
        Map
      </button>
      <button type="button" className={mode !== "map" ? "on" : ""} onClick={() => onChange("hybrid")}>
        Satellite
      </button>
    </div>,
    map.getContainer(),
  );
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
}: Props) {
  const [basemap, setBasemap] = useState<Basemap>("hybrid");
  const polygon = useMemo(() => CAMPUS_POLYGON.map(([lat, lng]) => [lat, lng] as [number, number]), []);

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
  }, []);

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={17}
      minZoom={14}
      maxZoom={20}
      scrollWheelZoom
      className="h-full w-full"
    >
      {basemap === "map" ? (
        <TileLayer
          attribution="&copy; Google"
          url="https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
          subdomains={["0", "1", "2", "3"]}
          maxZoom={21}
        />
      ) : (
        <TileLayer
          attribution="&copy; Google"
          url="https://mt{s}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
          subdomains={["0", "1", "2", "3"]}
          maxZoom={21}
        />
      )}

      <Polygon
        positions={polygon}
        pathOptions={{
          color: "#16345a",
          weight: 2,
          fillColor: "#16345a",
          fillOpacity: 0.04,
          dashArray: "6 8",
        }}
      />

      {showLocations ? (
        <LayerGroup>
          {CAMPUS_LOCATIONS.map((location) => (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={L.divIcon({
                className: "place-dot",
                html: `<span style="background:${zoneColor(location.zone)}"></span>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              })}
              eventHandlers={{ click: () => onSelectLocation?.(location) }}
            >
              <Popup>
                <div className="min-w-[180px] text-[12px]">
                  <p className="font-semibold text-slate-900">{location.name}</p>
                  <p className="mt-1 text-slate-600">{location.kind}</p>
                  <p className="mt-1 text-slate-500">{location.note}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
      ) : null}

      <LayerGroup>
        {tickets.map((ticket) => (
          <Marker
            key={ticket.id}
            position={[ticket.lat, ticket.lng]}
            icon={pinIcon(ticketFill(ticket), selectedId === ticket.id)}
            zIndexOffset={selectedId === ticket.id ? 1000 : ticket.status === "RESOLVED" ? 100 : 400}
            eventHandlers={{ click: () => onSelectTicket?.(ticket.id) }}
          >
            <Popup>
              <div className="min-w-[210px] text-[12px]">
                <p className="font-mono text-[10px] tracking-wide text-blue-700">{ticket.ticketNo}</p>
                <p className="mt-1 font-semibold text-slate-900">{ticket.title}</p>
                <p className="mt-1 text-slate-600">
                  {STATUS_META[ticket.status as keyof typeof STATUS_META]?.label} · {ticket.priority}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>

      {pickMode && onPick ? <ClickPick onPick={onPick} /> : null}
      {pick ? (
        <Marker position={[pick.lat, pick.lng]} icon={pinIcon("#ea4335", true)} zIndexOffset={2000}>
          <Popup>Issue pinned here — submit to raise the complaint</Popup>
        </Marker>
      ) : null}
      <Recenter focus={focus ?? null} />
      <BasemapSwitch mode={basemap} onChange={setBasemap} />
    </MapContainer>
  );
}
