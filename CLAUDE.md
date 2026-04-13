# Finance Dashboard

Next.js 16 App Router project. No separate backend — data fetching is done server-side.

## Stack
- **Next.js 16** (App Router, Turbopack)
- **React 19** with Server Components
- **yahoo-finance2** for market data (class, must instantiate: `new YahooFinance()`)
- **TypeScript** (strict mode, bundler module resolution)

## Architecture
- `lib/FinanceService.ts` — pure Node.js library, all Yahoo Finance logic and shared types. No React/Next.js imports.

## Key decisions
- No `/api` routes. Stock data = SSR. Search = server action called from Navbar.
- `yahoo-finance2` instance created once at module load in `FinanceService.ts` (not per request).
- Search runs 3 parallel Yahoo queries (bare / +' corp' / +' index') to improve coverage.
- Both mobile (375px+) and desktop views must be supported. Use the `480px` breakpoint for mobile-specific rules.

## Commands
```bash
npm run dev    # Next.js dev server on :3000
npm run build  # Production build
npm run start  # Production server (serves app + handles server actions)
npm run lint   # ESLint
```
