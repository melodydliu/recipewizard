# Recipe Wizard

Recipe Wizard is a floral recipe and proposal management app designed for florists. It lets you build arrangement recipes from a master flower and hard goods catalog, organize them into events with sections, track costs and markup, generate client proposals, and manage a reusable recipe library — all in one place.

## Setup

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd Recipe-Wizard
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `DATABASE_URL` with your Neon connection string (see below).

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Push the database schema to Neon**
   ```bash
   pnpm db:push
   ```

5. **Seed the database** (inserts master catalog data and a demo event)
   ```bash
   pnpm db:seed
   ```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string. Get it from [console.neon.tech](https://console.neon.tech) → your project → Connection Details. Format: `postgresql://user:password@host/dbname?sslmode=require` |
| `SINGLE_USER_ID` | UUID used to scope all data to a single user. Defaults to `00000000-0000-0000-0000-000000000001` if not set. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token for image uploads. Get it from Vercel dashboard → Storage → Blob. |

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

1. Push to GitHub.
2. Connect the repo to [Vercel](https://vercel.com/new).
3. Add environment variables in Vercel dashboard: `DATABASE_URL`, `SINGLE_USER_ID`, `BLOB_READ_WRITE_TOKEN`.
4. Deploy.
