# Cardly implementation plan

## 1. Foundation

- Initialize React 19, strict TypeScript, Vite, Tailwind, ESLint, Prettier, Vitest and Playwright.
- Add environment validation and prevent production demo builds.
- Implement CSS variables from Pencil tokens and reusable UI primitives.
- Done when install, typecheck, lint and a minimal build pass.

## 2. Application shell and data contracts

- Define Zod schemas and domain types for cards, public snapshots, leads, analytics and Telegram data.
- Add React Router routes, lazy boundaries, Error Boundary, owner/public guards and i18n.
- Add typed Telegram adapter and safe-area synchronization.
- Add production and demo repository boundaries.
- Done when direct route rendering and demo persistence work without Telegram/Firebase.

## 3. Owner experience

- Build onboarding, owner home, editor sections, autosave, publication, statistics/leads and profile.
- Support 320/390/768/1440 layouts and the Pencil navigation patterns.
- Implement image validation/preview and a Vercel Blob repository.
- Done when the demo onboarding/editor/publication flow is fully navigable and persistent.

## 4. Public card

- Build Clean, Dark and Editorial compositions as separate theme components.
- Add public loading/not-found/unpublished states, project dialog, lead form, analytics events, sharing, QR and vCard.
- Done when each theme works at 320 and desktop widths and hidden sections leave no gaps.

## 5. Backend and Vercel services

- Create centralized Express app and minimal Vercel catch-all entry.
- Add request IDs, origin checks, JSON limits, safe errors/logging and auth middleware.
- Implement Telegram initData validation, signed session cookies and Postgres/Blob initialization.
- Implement slug check, publication/unpublication, sanitized snapshots, leads, Telegram notifications, analytics and Postgres-backed rate limiting.
- Done when local `/api/health` and JSON 404 work and server tests cover security-critical helpers.

## 6. Tests and delivery

- Add unit/component tests and Playwright demo smoke tests.
- Add Vercel, Firebase, Telegram, architecture, security and operations documentation.
- Run screenshots against the Pencil references at 320/390/768/1440 and record remaining differences.
- Done when `npm run check` passes, API routing is verified, Playwright is run or its exact infrastructure blocker is documented, and no secrets/server-only modules enter the frontend bundle.

## Acceptance guardrails

- No production deployment or external resource creation during local implementation.
- No real secrets or service-account JSON in the repository.
- Demo bypass is development-only and never accepted by the production API.
- Public snapshots contain only enabled and explicitly public data.
- All network mutations expose loading, error and retry feedback.
- All dialogs are keyboard accessible and restore focus.
- No horizontal overflow at 320 px and no content hidden behind Telegram safe areas/navigation.
