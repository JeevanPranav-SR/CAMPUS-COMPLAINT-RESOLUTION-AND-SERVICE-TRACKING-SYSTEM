# BIT NEXUS

**Campus Complaint Resolution and Service Tracking System** for
[Bannari Amman Institute of Technology](https://www.bitsathy.ac.in), Sathyamangalam.

A geo-ops portal where students, faculty, wardens and estate crews file, route and
close campus service tickets on a live map of the 181-acre BIT campus.

## What it does

- **Map-first intake** — drop a pin on the BIT Sathy GIS (OSM campus polygon + satellite). The ticket snaps to the nearest facility (Sun Flower Block, Learning Centre, Sapphire, Cauvery, Data Centre, …).
- **Service tracking** — courier-style timeline: submitted → acknowledged → assigned → in progress → resolved → closed.
- **SLA clocks** — category-aware windows (Wi-Fi 2h, security 1h, electrical 8h, civil longer).
- **Role decks** — student, faculty, field staff, warden, estate admin.
- **Operations board** — kanban for open work.
- **Analytics** — category mix, pipeline, building hotspots.

## Campus data

Institute facts used in the product:

| | |
| --- | --- |
| Address | Sathy–Bhavani State Highway, Alathukombai, Sathyamangalam 638 401 |
| Campus | 181 acres · SH-82 |
| Coordinates | OSM way `Bannari Amman Institute` · 11.4947°N, 77.2773°E |
| OSM-verified pins | Main buildings, Principal Office, Sun Flower Block (School of Computing), campus boundary |
| Layout pins | Learning Centre, Vedanayagam & main auditoria, gents hostels Sapphire–Pearl, ladies hostels Ganga–Bhavani, Medical Centre, Data Centre, RO, STP, transport yard, sports complex |

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student (CSE) | `priya.s@bitsathy.ac.in` | `student123` |
| Student (Sapphire) | `karthik.r@bitsathy.ac.in` | `student123` |
| Faculty (ECE) | `meena.k@bitsathy.ac.in` | `faculty123` |
| Electrical staff | `ramesh.m@bitsathy.ac.in` | `staff123` |
| Warden | `lakshmi.w@bitsathy.ac.in` | `warden123` |
| Estate admin | `admin@bitsathy.ac.in` | `admin123` |

## Run locally

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js 16 · TypeScript · Tailwind CSS 4 · Prisma + SQLite · Leaflet / OSM + Esri satellite · JWT cookies · Recharts.

## Project modules

1. Authentication & role-based access
2. Geo-tagged complaint filing
3. Ticket tracking & SLA
4. Staff assignment / operations board
5. Campus GIS command map
6. Analytics & hotspots
