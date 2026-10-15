# RentRoom

A full-stack rental platform built as one Next.js codebase with two apps inside it: a **portal** where tenants and landlords find, book and rent rooms, and a **management console** where administrators run the whole system.

RentRoom started as my 2021 university graduation project. In 2025–2026 I rebuilt it from scratch as a single full-stack app on Next.js, Prisma and serverless PostgreSQL, and migrated the original data into the new schema.

<!-- Screenshots: add 2–3 images here, e.g. the map search, a room page and the console dashboard.
![Map search](docs/screenshots/map-search.png)
-->

## Features

### Portal (`/portal`) — tenants and landlords

- **Find a room** by district, by subway line, on an interactive map (Baidu Maps), or by residential community
- **Room pages** with photos, amenities and a location map
- **Favourites, viewing appointments and notifications** (with unread counts)
- **Landlord tools**: any tenant can become a landlord by completing their contact details, then add communities and publish and manage their own rooms
- **Rental contracts**: sign, pay, renew and check out, with an order history
- **Wallet**: top up a balance and review every transaction
- Account profile and password settings

### Management console (`/manage`) — administrators

- Dashboard
- Create, edit and delete administrators, users, communities, rooms, amenities, homepage banners and notifications
- Oversee appointments, favourites, contracts (pay, renew, check out) and orders
- Top up user wallets and review wallet history

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS 4, Sonner |
| Data | PostgreSQL on Neon, Prisma ORM 6 |
| Auth | HS256 JWT implemented with Node's built-in `crypto`, with separate secrets for the portal and the console |
| File storage | Vercel Blob (avatars and room photos) |
| Maps | Baidu Maps JavaScript API via `react-bmapgl` |
| Hosting | Vercel |

## How it is put together

- **One codebase, two apps.** `/portal/*` and `/manage/*` share one database but have independent authentication, layouts and UI.
- **API routes** live under `app/api/portal/*` and `app/api/manage/*`. Every protected route starts with `requirePortalAuth()` or `requireManageAuth()`, which verify the token and return a ready-made 401 response on failure.
- **Client requests** go through one helper per app that attaches the bearer token and sends the user back to the login page when a session expires.
- **Passwords** are salted and hashed with scrypt from Node's `crypto` (`lib/password.ts`). Accounts migrated from 2021 still had plain-text passwords; each one is re-hashed automatically on its next successful sign-in, so no separate migration was needed.
- **Data model** (`prisma/schema.prisma`): `admin`, `user`, `community`, `room`, `facility`, `carousel`, `collection`, `appointment`, `notification`, `contract`, `order`, `walletRecord`.
- **Data migration.** `scripts/migrate-*.ts` move appointments, favourites, contracts and orders from the 2021 MySQL database into the new PostgreSQL schema, mapping old status codes and timestamps to the new fields. `scripts/seed-*.ts` load communities, rooms, amenities and banners.

## Getting started

**You need:** Node.js 20 or newer, a PostgreSQL database (a free Neon project works), a Vercel Blob store, and a Baidu Maps browser key.

```bash
git clone https://github.com/Moses-xm/rent-room.git
cd rent-room
npm install                 # also runs `prisma generate`
cp .env.example .env        # then fill in the values
npx prisma db push          # create the tables
npm run dev
```

Then open <http://localhost:3000/portal> for the portal and <http://localhost:3000/manage> for the console. To sign in to the console, add a row to the `admin` table first (for example with `npx prisma studio`).

### Environment variables

| Variable | What it is for |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `PORTAL_JWT_SECRET` | Signing secret for portal sessions |
| `MANAGE_JWT_SECRET` | Signing secret for console sessions |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for image uploads |
| `NEXT_PUBLIC_BLOB_BASE_URL` | Public base URL of the Blob store |
| `NEXT_PUBLIC_BAIDU_MAP_AK` | Baidu Maps browser key |

## Project structure

```text
app/
  portal/        tenant and landlord pages
  manage/        administrator console pages
  api/portal/    portal API routes
  api/manage/    console API routes
  api/upload/    image uploads (Vercel Blob)
components/      shared UI, including the Baidu Maps components
lib/             authentication, Prisma client, contract logic
prisma/          database schema
scripts/         data migration and seed scripts
utils/           constants and request helpers
localData/       static district and subway-line data
doc/             design documents (Chinese)
```

## Background

The 2021 version was three separate projects: an Egg.js API, plus an admin app and a tenant portal built with Umi, React and Ant Design, on MySQL. Rebuilding it as one Next.js app let me work through modern full-stack practice end to end — server routes, typed database access with Prisma, token-based auth without a third-party library, image storage and deployment on Vercel — on a domain I already knew well.
