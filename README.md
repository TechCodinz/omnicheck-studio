# OmniCheck Studio

A professional check design and document studio for businesses printing checks
drawn on **their own** bank accounts: template-based check layout, MICR line
proofing, check register, PDF export, invoicing, and authenticated API for
templates, tax-document records, deposits, and admin reporting.

> **Legitimate use only.** This software is for printing checks and business
> documents for accounts you own or are authorized to act for. It must not be
> used to clone or reproduce another person's or institution's checks, IDs,
> tax forms, signatures or security patterns, or to create documents intended
> to deceive a bank or any other party.
>
> **Security Notice (2026-10-25):** Legacy modules for document/check cloning,
> signature extraction, ID document generation, and bank security-plate
> replication have been **deprecated and removed** following the security audit.
> See `SECURITY.md` and `AUDIT-2026-10-24.md` for details.

## What's New (2026-10-25)

- **Professional Design System**: Tailwind CSS with custom design tokens, dark theme, glassmorphism effects, responsive breakpoints
- **Mobile-First Layout**: Responsive sidebar with mobile drawer, bottom navigation on phones, touch-optimized controls
- **httpOnly Cookie Auth**: JWT tokens now stored in httpOnly, Secure, SameSite cookies — XSS-resistant with localStorage fallback during transition
- **Modern Components**: Redesigned AuthModal, DocumentTemplateGallery, CheckBuilder with Tailwind CSS and accessibility improvements
- **Security Hardening**: Rate limiting, input validation, suspicious IP detection, session cleanup, admin privilege separation
- **Test Suite**: Frontend and backend tests for auth, API, and middleware
- **Documentation**: SECURITY.md with vulnerability reporting policy

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18 + TypeScript, Tailwind CSS 3.4, react-router, react-icons |
| Backend  | Express + TypeScript, Socket.IO, better-sqlite3 (SQLite), bcrypt |
| PDF      | pdfkit |
| Tests    | Jest + React Testing Library (frontend), Supertest (backend) |

## Run it

Prerequisite: Node.js 20+.

```bash
# Install dependencies
./install.sh

# Set a real secret in .env first:
#   JWT_SECRET=$(openssl rand -hex 32)

# Start backend
cd backend && npm run dev     # API on :3001

# Start frontend (new terminal)
cd frontend && npm start      # UI on :3000
```

Or Docker:

```bash
docker compose up --build
```

Key environment variables:

- `JWT_SECRET` — **required**, >=32 random characters
- `CORS_ORIGIN` — frontend origin allowed to call API (default `http://localhost:3000`)
- `REACT_APP_API_URL` — frontend -> API base URL (default `http://localhost:3001`)

### MICR font

Production check printing needs a licensed MICR E-13B font installed at
`backend/fonts/micr-e13b.ttf`. Without it the server logs a warning and the
MICR line is rendered in a fallback font.

## API (main routes)

### Unauthenticated
- `GET  /api/health` — health check

### Authentication
- `POST /api/auth/register` — create account (rate limited)
- `POST /api/auth/login` — authenticate (sets httpOnly cookie + returns token)
- `POST /api/auth/logout` — clear auth cookie
- `GET  /api/auth/me` — get current user

### Authenticated
- `POST /api/generate-pdf` — validate check fields before generating PDF
- `POST /api/save-template` — save template under caller's user ID
- `GET  /api/templates` — list available templates

### Admin (auth + admin role required)
- `GET  /api/admin/stats` — system statistics
- `GET  /api/admin/verifications` — verification queue
- `GET  /api/admin/ach-batches` — ACH batch processing

## Development

### Running Tests

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test
```

### Type Checking

```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx tsc --noEmit
```

## Mobile Support

The application is fully responsive:
- **Desktop**: Collapsible sidebar (56px-224px), full feature set
- **Tablet**: Adaptive layout, horizontal scroll for tabs
- **Mobile**: Drawer navigation, bottom tab bar, stacked layouts, touch-optimized inputs (16px font), safe area padding

## Security

See [`SECURITY.md`](SECURITY.md) for:
- Security feature details
- Vulnerability reporting process
- Known limitations and production recommendations

## License

This project is provided for legitimate business use only. See the security
notice above and `SECURITY.md` for usage restrictions.
