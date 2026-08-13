"use client";

import dynamic from "next/dynamic";
import type { CampusLocation } from "@/lib/campus";
import type { Ticket } from "@/lib/types";

const Canvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <p className="text-sm font-medium text-[var(--text)]">Loading campus map</p>
        <p className="mt-2 text-xs text-[var(--muted)]">BIT Sathy · 11.4947°N 77.2773°E</p>
      </div>
    </div>
  ),
});

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
  className?: string;
};

export default function CampusMap(props: Props) {
  return (
    <div className={props.className ?? "relative h-full min-h-[420px] w-full overflow-hidden rounded-lg border border-[var(--border)]"}>
      <Canvas {...props} />
      {props.pickMode ? (
        <div className="pointer-events-none absolute left-1/2 top-4 z-[600] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg">
          Tap the satellite map to pin the issue
        </div>
      ) : null}
    </div>
  );
}
