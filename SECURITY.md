# Security

## Reporting

Report vulnerabilities privately to the repository owner (TechCodinz) —
do not open a public issue for a security problem.

## Deployment checklist

- Set `JWT_SECRET` to a fresh random value of at least 32 characters
  (`openssl rand -hex 32`). The server fails closed without one.
- Set `CORS_ORIGIN` to your real frontend origin. Do not use a wildcard.
- Run the backend over HTTPS (behind a reverse proxy) in production; JWTs
  are bearer tokens.
- **Rotate any credential that ever appeared in client code or chat.**
  A client-side admin password that shipped in the frontend bundle before
  the 2026-10-24 hardening pass must be treated as public and changed
  everywhere it was reused.
- Do not commit a filled-in `.env`, a database file, or a licensed MICR
  font — all are covered by `.gitignore`.

## Known limitations (see AUDIT-2026-10-24.md)

- Plan/licence state is still held client-side (localStorage) and is a UI
  convenience only. Paid entitlements are enforced server-side only where
  routes check a JWT / admin role; a full server-side entitlement system
  is still outstanding.
- Auth tokens are stored in `localStorage` by parts of the frontend, which
  is XSS-sensitive. Moving to httpOnly cookies is recommended.
- Legacy high-risk modules (document/check cloning, signature extraction,
  ID/tax document specialists, bank security-plate generators at the repo
  root) remain in the tree at the owner's direction and are flagged in the
  audit for removal or hard gating before any public launch.
