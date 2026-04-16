# Vortex - Video Conferencing App

Vortex is a Next.js video conferencing app using Clerk authentication and Stream Video.
It includes a Node-style API layer through Next.js route handlers, Prisma + PostgreSQL persistence, Stream webhook handling, and signed recording URLs.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- Clerk for auth
- Stream Video SDK for calls
- Prisma ORM + PostgreSQL
- Local PostgreSQL via Docker Compose

## Features

- Create instant and scheduled meetings
- Join meetings by shared link
- Upcoming/Previous meeting lists from database APIs
- Recording ingestion from Stream webhooks and API sync fallback
- Signed recording playback URLs (no raw recording URL exposure)

## Prerequisites

- Node.js 18+
- Docker Desktop
- Clerk account and keys
- Stream account and keys

## Environment Variables

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required keys are documented in `.env.example`.

## Local Setup (Docker + Prisma + Next)

1. Install dependencies:

```bash
npm install
```

2. Start local PostgreSQL container:

```bash
docker compose up -d postgres
```

3. Run migrations:

```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Start development server:

```bash
npm run dev
```

6. Open the app:

`http://localhost:3000` (or next available port)

## Helpful Commands

```bash
# type check
npx tsc --noEmit

# production build
npm run build

# stop local db
docker compose down

# stop local db and remove volume
docker compose down -v
```

## Stream Webhooks

Configure Stream webhook endpoint:

`https://YOUR_DOMAIN/api/webhooks/stream`

Subscribe to events:

- `call.started`
- `call.ended`
- `call.recording_ready`

Set `STREAM_WEBHOOK_SECRET` in your environment to match Stream.

## Notes

- Keep `.env` out of version control.
- For local Docker DB, `POSTGRES_*` values in `.env` are consumed by `docker-compose.yml`.
