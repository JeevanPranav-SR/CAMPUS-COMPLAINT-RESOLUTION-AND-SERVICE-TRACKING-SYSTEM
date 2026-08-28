# Campus Complaint Resolution and Service Tracking System

Campus service operations platform for [Bannari Amman Institute of Technology](https://www.bitsathy.ac.in), Sathyamangalam.

The application manages the full lifecycle of campus service issues — report, acknowledge, assign, work, resolve, verify, and close — with SLA timers, a live campus map, role-based operations, and analytics.

It is intended as a **campus service operations platform**, not a simple complaint form.

## Overview

Students and faculty file geo-tagged service tickets. Wardens and estate administrators assign work. Field staff update progress. Reporters verify that the issue is actually fixed. The system records a timeline, enforces permissions in the API, and surfaces overdue work on the map and analytics views.

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

- Role-based dashboards for student, faculty, staff, warden, and estate admin
- Multi-section complaint intake with campus map pin and optional photo
- Ticket detail with SLA, assignment, comments, evidence, and timeline
- Operations board with acknowledge / assign / start / resolve actions
- Campus GIS with live complaint pins and operational filters
- Analytics from database records (not placeholder charts)
- Staff workload view
- In-app notifications tied to real ticket events
- Reporter verification: close with rating, or reopen with a reason
- Settings for profile, password, notification preference, and appearance

## User Roles

| Role | Access |
| --- | --- |
| **Student** | File tickets, track own complaints, comment, verify or reopen resolution |
| **Faculty** | Same reporter workflow for academic-block and campus issues |
| **Staff** | Work assigned tickets, take unassigned queue items, update progress, mark resolved |
| **Warden** | Hostel / residential facilities, assign staff, monitor SLA |
| **Estate admin** | Campus-wide complaints, assignment, analytics, map, workload |

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

- **User** — identity, role, department/hostel, notification preference
- **Complaint** — ticket number, category, priority, status, geo coordinates, SLA timestamps, rating
- **TimelineEvent** — status/action history
- **Comment** — discussion on a ticket
- **Notification** — in-app events for reporters and staff

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
- `GET/PATCH /api/notifications`
- `GET/PATCH /api/account`
- `GET /api/staff` · `GET /api/stats`

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

On Vercel these are provisioned by the Neon integration. Locally run `npx vercel env pull .env.local`.

Do not commit `.env` or `.env.local`.

## Database Setup

```bash
npx prisma generate
npx prisma db push
npm run db:seed
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
| Electrical staff | `ramesh.m@bitsathy.ac.in` | `staff123` |
| Civil/plumbing staff | `arun.p@bitsathy.ac.in` | `staff123` |
| Data Centre staff | `nisha.v@bitsathy.ac.in` | `staff123` |
| Warden | `lakshmi.w@bitsathy.ac.in` | `warden123` |
| Estate admin | `admin@bitsathy.ac.in` | `admin123` |

Demo credentials appear on the login page only in development mode.

## Future Enhancements

- Email / SMS notifications
- File storage outside the database (object storage)
- Marker clustering and heatmap at larger ticket volumes
- Native mobile clients
- Scheduled SLA breach jobs (currently SLA is calculated from timestamps on read)
- PostgreSQL for multi-user production deployment

## Campus data

Institute facts used in the product:

| | |
| --- | --- |
| Address | Sathy–Bhavani State Highway, Alathukombai, Sathyamangalam 638 401 |
| Campus | 181 acres · SH-82 |
| Coordinates | OSM way `Bannari Amman Institute` · 11.4947°N, 77.2773°E |
| OSM-verified pins | Main buildings, Principal Office, Sun Flower Block (School of Computing), campus boundary |
| Layout pins | Learning Centre, auditoria, gents hostels Sapphire–Pearl, ladies hostels Ganga–Bhavani, Medical Centre, Data Centre, transport yard, sports complex |
