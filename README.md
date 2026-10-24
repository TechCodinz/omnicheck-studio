# OmniCheck Studio

A check design and printing studio for businesses printing checks drawn on
**their own** bank accounts: template-based check layout, MICR line layout,
check register, and PDF export, with a small authenticated API for templates,
tax-document records, deposits and admin reporting.

> **Legitimate use only.** This software is for printing checks and business
> documents for accounts you own or are authorized to act for. It must not be
> used to clone or reproduce another person's or institution's checks, IDs,
> tax forms, signatures or security patterns, or to create documents intended
> to deceive a bank or any other party. See `SECURITY.md` and the risk notes
> in `AUDIT-2026-10-24.md` — several legacy modules (document/check cloning,
> signature extraction, ID specialists, bank security-plate replication)
> are flagged there for removal or hard gating before any public launch.

## Stack (as it actually is)

| Layer    | Tech |
|----------|------|
| Frontend | React 18 + TypeScript (Create React App), react-router |
| Backend  | Express + TypeScript, Socket.IO, better-sqlite3 (SQLite) |
| PDF      | pdfkit (`backend/services/AdvancedPDFGenerator.js`) |

There is **no MongoDB or Redis connection in the current backend code**,
despite older compose/docs files claiming otherwise.

## Run it

Prerequisite: Node.js 20+.

```bash
./install.sh            # npm ci for frontend + backend, creates .env
# set a real secret in .env first:
#   JWT_SECRET=$(openssl rand -hex 32)
cd backend && npm run dev     # API on :3001
cd frontend && npm start      # UI on :3000
```

Or Docker (uses `docker-compose.yml`; requires `JWT_SECRET` in `.env`):

```bash
docker compose up --build
```

Key environment variables (see `.env.example`):

- `JWT_SECRET` — **required**, ≥32 random characters. The server refuses to
  start without it.
- `CORS_ORIGIN` — the one frontend origin allowed to call the API
  (default `http://localhost:3000`).
- `REACT_APP_API_URL` — frontend → API base URL (default
  `http://localhost:3001`, defined in `frontend/src/config.ts`).

### MICR font

Production check printing needs a licensed MICR E-13B font installed at
`backend/fonts/micr-e13b.ttf`. Without it the server logs a warning and the
MICR line is rendered in a fallback font — fine for layout proofing, not for
producing negotiable checks.

## API (main routes)

- `GET  /api/health` — unauthenticated health check
- `POST /api/auth/register`, `POST /api/auth/login` — JWT accounts
- `POST /api/generate-pdf` — **auth required**; validates check fields
  (9-digit routing, account, positive amount) before generating
- `POST /api/save-template` — **auth required**; saved under the caller's id
- `GET  /api/tax/documents/:userId` — auth required; the server only ever
  returns the **caller's own** documents
- `GET  /api/admin/*` — auth + **admin role** required

## Verification (2026-10-24)

- Backend: `npx tsc --noEmit` — clean (was 15 errors at the audited commit)
- Frontend: `npx tsc --noEmit` and `npm run build` — clean
- Runtime smoke test: health, auth validation (400/409), unauthenticated PDF
  generation rejected, non-admin rejected from admin routes, tax-document
  IDOR closed, and authenticated PDF generation returns a real PDF
  (previously it failed with a 500 for every request — see audit).

Full findings, evidence and the fixes applied are in
[`AUDIT-2026-10-24.md`](AUDIT-2026-10-24.md).
