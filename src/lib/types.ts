export type TicketEvent = {
  id: string;
  status: string;
  note: string;
  createdAt: string;
  actor?: { name: string; role?: string } | null;
};

export type Ticket = {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  locationId: string;
  lat: number;
  lng: number;
  landmark: string | null;
  reporterId: string;
  assigneeId: string | null;
  slaHours: number;
  dueAt: string;
  resolvedAt: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  reporter?: { id: string; name: string; role: string; department: string | null; hostel?: string | null };
  assignee?: { id: string; name: string; department: string | null } | null;
  events?: TicketEvent[];
};

export type StatsPayload = {
  totals: {
    all: number;
    open: number;
    resolved: number;
    breached: number;
    critical: number;
    avgResolution: number;
  };
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  hotspots: { name: string; count: number; lat: number; lng: number }[];
};
