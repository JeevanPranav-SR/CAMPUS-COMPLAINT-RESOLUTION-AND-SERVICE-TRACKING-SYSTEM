# Campus Complaint Resolution and Service Tracking System

Campus service operations platform for [Bannari Amman Institute of Technology](https://www.bitsathy.ac.in), Sathyamangalam.

The application manages the full lifecycle of campus service issues — report, acknowledge, assign, work, resolve, verify, and close — with SLA timers, a live campus map, role-based operations, and analytics.

It is intended as a **campus service operations platform**, not a simple complaint form.

## Overview

Students and faculty file geo-tagged service tickets. Each ticket is routed automatically to one of four operational departments: IT Infrastructure, Electrical, Facilities / Civil, or Hostel Maintenance. That department's head assigns a maintenance technician, the technician updates progress, and the reporter verifies that the issue is actually fixed. A Super Admin oversees every department. The system records a timeline, enforces permissions in the API, and surfaces overdue work on the map and analytics views.

## Problem Statement

Campus maintenance at a large institute is still often handled through verbal reports, WhatsApp groups, or paper registers. That makes it difficult to:

- know who owns a ticket
- see whether work is overdue
- verify that a “resolved” issue is actually fixed
- identify repeating failures in the same building

This project replaces that ad-hoc process with a single tracked workflow.

## Objectives

- Provide one intake path for campus service issues
- Track every ticket through a realistic lifecycle
- Enforce role-based access on both UI and API
- Make SLA a real timestamp-based concept, not a decorative timer
- Use the BIT campus map as an operations tool
- Give administrators workload and hotspot visibility
- Remain explainable for a final-year viva

## Key Features

- Role-based dashboards for Student, Faculty, Maintenance Technician, Department Head, and Super Admin
- Self-registration for students and faculty with a college mail ID; operational accounts are issued by the Super Admin
- Multi-section complaint intake with campus map pin, optional photo, and AI category suggestion
- Automated routing to IT Infrastructure, Electrical, Facilities / Civil, or Hostel Maintenance (`src/lib/routing.ts`), shown on intake and on every ticket
- Duplicate-aware intake: warns when the same issue is already open within 150 m, without revealing other reporters
- Unique reference ID per ticket (`CMP-YYYY-NNNNN`) with a confirmation notification
- Ticket detail with SLA, assignment, comments, evidence, and timeline
- Operations board with acknowledge / assign / start / resolve actions
- Campus GIS with live complaint pins and operational filters
- Analytics from database records: resolution speed (average, median, first response), department response rates, recurring-issue trends and repeat failures, and user feedback ratings
- Technician workload view
- Notifications on status changes, technician assignments and resolutions, delivered in-app (live polling) and optionally by email (Resend) and SMS (Twilio)
- Reporter verification: close with rating, or reopen with a reason
- Settings for profile, password, notification preference, and appearance

The original Streamlit prototype UI is kept at `prototypes/streamlit_app.py`. The live site uses the same classify-and-assign flow inside Next.js (`POST /api/ai/classify`).

## User Roles

| Role | Access |
| --- | --- |
| **Student** | File tickets, track own complaints, comment, verify or reopen resolution |
| **Faculty** | Same reporter workflow for academic-block and campus issues |
| **Maintenance Technician** | Work assigned tickets, take unassigned tickets routed to their department, update progress, mark resolved |
| **Department Head** | All complaints routed to their department; assign technicians from that department; escalate; department analytics |
| **Super Admin** | Campus-wide complaints, every department, users and roles, audit logs, campus analytics |

Every role can also raise and track their own complaints. Older stored role codes (`STAFF`, `WARDEN`, `ADMIN`) are still recognised and are migrated by `npm run db:upgrade`.

## Department Routing

| Department | Categories |
| --- | --- |
| IT Infrastructure | Internet / Wi-Fi |
| Electrical | Electrical (campus-wide, including hostels) |
| Facilities / Civil | Plumbing, water, civil, furniture, cleaning, classroom/lab, transport, security, medical, sports, other |
| Hostel Maintenance | Hostel and mess, plus any non-specialist issue raised inside a hostel |

## What Makes It Different

Most campus helpdesks (generic ticketing tools, ERP grievance modules, Google Forms or WhatsApp groups) stop at "log a complaint and change its status". BIT NEXUS adds:

- **Geo-tagged tickets on the real campus map**, so hotspots are visible spatially
- **Duplicate-aware reporting**, which shows open reports of the same issue nearby before you submit
- **Reporter-verified closure**: a ticket closes only when the reporter confirms and rates it, otherwise it reopens with a fresh SLA
- **Repeat-failure detection**, which flags the same fault at the same place for root-cause repair
- **Per-category × priority SLA clocks**, with department response-rate analytics

Permissions are enforced in API routes, not only by hiding buttons.

## Complaint Lifecycle

```
Submitted → Acknowledged → Assigned → In Progress → Resolved → Student verification → Closed
```

If the reporter says the issue is not fixed:

```
Resolved → Reopened → Assigned again → In Progress
```

Each transition writes a timeline event (actor, role, timestamp, note).

## System Architecture

- **Next.js App Router** — pages, layouts, and Route Handlers
- **Prisma + Neon Postgres** — relational data for users, tickets, timeline, comments, notifications
- **JWT httpOnly cookie** — session after login (`bit_session`)
- **Leaflet** — campus polygon, facility pins, and complaint markers
- **Recharts** — analytics from `/api/stats`

High-level flow:

1. Browser calls `/api/*` with the session cookie
2. Route Handler checks the session and role
3. Prisma reads/writes Postgres
4. Status changes create timeline events and notifications

## Technology Stack

- Next.js 16 · React 19 · TypeScript
- Tailwind CSS 4
- Prisma 6 · Neon Postgres
- jose (JWT) · bcryptjs
- Leaflet / react-leaflet
- Recharts
- Lucide icons

## Database Design

Core models:

- **User** — identity, role, department/hostel, notification preferences (in-app, email, SMS)
- **Complaint** — ticket number, category, priority, status, geo coordinates, SLA timestamps, rating
- **TimelineEvent** — status/action history
- **Comment** — discussion on a ticket
- **Notification** — in-app events for reporters and technicians, with the channels delivered (in-app, email, SMS)

Indexes exist on status, priority, category, reporter, assignee, createdAt, and dueAt.

## API Architecture

Responses follow a consistent envelope:

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "error": { "code": "VALIDATION", "message": "..." } }
```

Principal routes:

- `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/register`
- `GET/POST /api/complaints` · `GET/PATCH /api/complaints/[id]` · `POST /api/complaints/[id]/comments`
- `GET /api/complaints/similar?category=&lat=&lng=` (duplicate-aware intake)
- `GET/PATCH /api/notifications`
- `GET/PATCH /api/account`
- `GET /api/staff` · `GET /api/stats` · `POST /api/ai/classify`

## Security

- Passwords stored with bcrypt; never returned by the API
- Session JWT in an httpOnly, SameSite cookie
- Role checks on every protected route
- Image attachments limited to `data:image/*` and size-capped
- `.env` is gitignored; `AUTH_SECRET` must be set for production
- Demo passwords exist only in seed data for local demonstration

## Screenshots

Run the app locally and capture:

1. Landing page
2. Student dashboard
3. New complaint (map pin)
4. Ticket detail / timeline
5. Operations board
6. Campus map
7. Analytics / workload

## Installation

```bash
npm install
cp .env.example .env
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres connection (Neon) |
| `DATABASE_URL_UNPOOLED` | Direct Postgres connection for Prisma migrations |
| `AUTH_SECRET` | JWT signing secret |
| `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL` | Optional. Enables email notifications |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Optional. Enables SMS notifications |
| `APP_URL` | Optional. Base URL used for ticket links in emails |

Email and SMS are skipped automatically when their variables are not set; in-app notifications always work.

On Vercel these are provisioned by the Neon integration. Locally run `npx vercel env pull .env.local`.

Do not commit `.env` or `.env.local`.

## Database Setup

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

Upgrade an existing database without wiping it (renames legacy roles, adds department-head accounts):

```bash
npm run db:upgrade
```

Reset demo data:

```bash
npm run db:reset
```

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

## Demo Accounts

Seeded for local / viva demonstration only. All campus accounts use `@bitsathy.ac.in`.

| Role | Email | Password |
| --- | --- | --- |
| Student (CSE) | `priya.s@bitsathy.ac.in` | `student123` |
| Student (AIML) | `arjun.k@bitsathy.ac.in` | `student123` |
| Student (AIDS) | `sneha.p@bitsathy.ac.in` | `student123` |
| Student (Sapphire) | `karthik.r@bitsathy.ac.in` | `student123` |
| Student (Cauvery) | `divya.m@bitsathy.ac.in` | `student123` |
| Faculty (ECE) | `meena.k@bitsathy.ac.in` | `faculty123` |
| Technician · Electrical | `ramesh.m@bitsathy.ac.in` | `staff123` |
| Technician · Facilities / Civil | `arun.p@bitsathy.ac.in` | `staff123` |
| Technician · IT Infrastructure | `nisha.v@bitsathy.ac.in` | `staff123` |
| Technician · Hostel Maintenance | `murugan.s@bitsathy.ac.in` | `staff123` |
| Department Head · Hostel Maintenance | `lakshmi.w@bitsathy.ac.in` | `warden123` |
| Department Head · IT Infrastructure | `head.it@bitsathy.ac.in` | `head1234` |
| Department Head · Electrical | `head.electrical@bitsathy.ac.in` | `head1234` |
| Department Head · Facilities / Civil | `head.facilities@bitsathy.ac.in` | `head1234` |
| Super Admin | `admin@bitsathy.ac.in` | `admin123` |

Demo credentials appear on the login page only in development mode.

## Future Enhancements

- WhatsApp notifications
- File storage outside the database (object storage)
- Marker clustering and heatmap at larger ticket volumes
- Native mobile clients
- Scheduled SLA breach jobs (currently SLA is calculated from timestamps on read)

## Campus data

Institute facts used in the product:

| | |
| --- | --- |
| Address | Sathy–Bhavani State Highway, Alathukombai, Sathyamangalam 638 401 |
| Campus | 181 acres · SH-82 |
| Coordinates | OSM way `Bannari Amman Institute` · 11.4947°N, 77.2773°E |
| OSM-verified pins | Main buildings, Principal Office, Sun Flower Block (School of Computing), campus boundary |
| Layout pins | Learning Centre, auditoria, gents hostels Sapphire–Pearl, ladies hostels Ganga–Bhavani, Medical Centre, Data Centre, transport yard, sports complex |
