"use client";

import dynamic from "next/dynamic";
import type { CampusLocation } from "@/lib/campus";
import type { Ticket } from "@/lib/types";

const Canvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-[28px] border border-cyan-400/15 bg-[#070b14]">
      <div className="text-center">
        <p className="font-display text-sm tracking-[0.35em] text-cyan-300/80">ACQUIRING CAMPUS TILES</p>
        <p className="mt-2 text-xs text-slate-500">BIT Sathy · 11.4947°N 77.2773°E</p>
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
    <div className={props.className ?? "h-full min-h-[420px] w-full overflow-hidden rounded-[28px] border border-cyan-400/20 shadow-[0_0_80px_rgba(34,211,238,0.08)]"}>
      <Canvas {...props} />
    </div>
  );
}
