# AFK Monorepo

This monorepo contains all core applications and packages for the AFK project, managed with Turborepo.

## Structure

- `apps/pwa` — Main web app (Next.js PWA)
- `apps/data-backend` — Main backend (Node.js/TypeScript)
- `packages/` — Shared libraries and SDKs
- `backend/`, `pixel-backend/` — Go backends for canvas and pixel features
- `onchain/` — Smart contracts and blockchain scripts

## Getting Started

1. **Install dependencies:**  
   `pnpm install` (from the root)

2. **Run all apps:**  
   `npx turbo run dev`

3. **Run a specific app:**  
   `cd apps/pwa && pnpm run dev`
   `cd apps/data-backend && pnpm run start:dev`

## Main Apps

- [PWA App](./apps/pwa/README.md)
- [Data Backend](./apps/data-backend/README.md)

## More

- [Shared Packages](./packages/)
- [Backend Services](./backend/)
- [Onchain Contracts](./onchain/)

---