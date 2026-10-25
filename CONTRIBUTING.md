# Contributing to OmniCheck Studio

Thank you for your interest in contributing to OmniCheck Studio.

## Code of Conduct

This project is strictly for legitimate business purposes. Contributors must not
submit code that:
- Facilitates document forgery or identity theft
- Replicates bank security patterns or proprietary features
- Extracts signatures from documents without consent
- Generates fake government IDs, passports, or official documents

## Development Setup

1. Fork and clone the repository
2. Run `./install.sh` to install dependencies
3. Set a strong `JWT_SECRET` in `.env`
4. Start backend: `cd backend && npm run dev`
5. Start frontend: `cd frontend && npm start`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure TypeScript compiles: `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`
4. Run tests: `cd frontend && npm test` and `cd backend && npm test`
5. Update documentation if needed
6. Submit a PR with a clear description of changes

## Security

If you discover a security vulnerability, please email security@omnicheck.test
instead of opening a public issue. See `SECURITY.md` for details.
