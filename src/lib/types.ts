export type TicketEvent = {
  id: string;
  status: string;
  action: string;
  note: string;
  createdAt: string;
  actor?: { name: string; role?: string } | null;
};

export type TicketComment = {
  id: string;
  body: string;
  createdAt: string;
  actor: { id: string; name: string; role: string };
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
  evidence: string | null;
  reporterId: string;
  assigneeId: string | null;
  slaHours: number;
  dueAt: string;
  acknowledgedAt: string | null;
  assignedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  reopenCount: number;
  rating: number | null;
  ratingComment: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: { id: string; name: string; role: string; department: string | null; hostel?: string | null };
  assignee?: { id: string; name: string; department: string | null; role?: string } | null;
  events?: TicketEvent[];
  comments?: TicketComment[];
};

export type StatsPayload = {
  totals: {
    all: number;
    open: number;
    resolved: number;
    breached: number;
    critical: number;
    avgResolution: number;
    slaCompliance: number;
  };
  speed: {
    avgResolutionHours: number;
    medianResolutionHours: number;
    avgFirstResponseHours: number;
    buckets: { label: string; count: number }[];
  };
  departments: {
    id: string;
    name: string;
    total: number;
    open: number;
    resolved: number;
    resolutionRate: number;
    responseRate: number;
    respondedWithin24h: number;
    avgResponseHours: number;
    avgResolutionHours: number;
    slaCompliance: number;
    avgRating: number;
    ratings: number;
  }[];
  recurring: { location: string; category: string; count: number; open: number; reopened: number; lastAt: string }[];
  trend: { categories: string[]; weeks: Record<string, string | number>[] };
  feedback: {
    average: number;
    count: number;
    responseRate: number;
    distribution: { stars: number; count: number }[];
    recent: { ticketNo: string; rating: number; comment: string; category: string }[];
  };
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byDay: { day: string; count: number }[];
  hotspots: { id: string; name: string; count: number; open: number; overdue: number; high: number; lat: number; lng: number }[];
  workload: {
    id: string;
    name: string;
    department: string | null;
    assigned: number;
    inProgress: number;
    resolved: number;
    overdue: number;
    avgHours: number;
  }[];
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  complaintId: string | null;
  createdAt: string;
};
