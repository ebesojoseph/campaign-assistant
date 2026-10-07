# AI Campaign Assistant – Web (DME Systems)

TypeScript (strict) · React 19 · Vite · Tailwind CSS 4 · Zustand · React Router 7 · Axios · Recharts · lucide-react

## Run
```bash
npm install
cp .env.example .env     # optional; defaults work with the backend on :4000
npm run dev              # http://localhost:3000  (proxies /api -> http://localhost:4000)
npm run typecheck        # tsc --noEmit (strict)
npm run build            # typecheck + production bundle in dist/
```
Start the API first (`DB_SYNC=true npm run dev`, then `npm run seed`). On a fresh database use
**"Create the admin account"** on the login page (the API only allows public registration for the very first user).

> Requires the API's new `GET /api/customers/stats` endpoint (included in the updated backend zip).

## Architecture (feature-based)
```
src/
├── components/   shared UI primitives (Button, Card, Modal, Table, Pagination, form fields, AppLayout…)
├── types/        shared domain + API types (User, Customer, Segment, Campaign, Paginated<T>…)
├── config/       env + domain constants (statuses, channels, tones, channel limits)
├── lib/          axios.js (auth interceptors, single-flight refresh), chart.js (theme)
├── hooks/        useDebounce, useAsync
├── utils/        formatters, cn, error helpers
├── features/
│   ├── auth/         api · components · store (useAuthStore)
│   ├── dashboard/    api · components (KPIs, charts, table) · store
│   ├── segmentation/ api · components · store · utils
│   └── campaigns/    api · components · store
├── pages/        thin route views composing features
├── routes/       router, ProtectedRoute / PublicOnlyRoute, AppShell
└── App.jsx
```
Features import each other **only through their `index.js`**. `components/`, `lib/`, `hooks/`, `utils/` never import
from `features/`: the auth store plugs into `lib/axios` via `registerAuthHandlers`, and `AppLayout` receives
`user`/`onLogout` as props.

## Auth & HTTP design
- Access token is held **in memory only** (Zustand, not persisted). The refresh token is the API's HttpOnly cookie.
- On load, `initialize()` calls `/auth/refresh` to resume the session.
- Request interceptor adds `Authorization: Bearer`. On a 401 (non-auth endpoint) the response interceptor refreshes once and
  replays the request; a definitive refresh failure clears the session and the router redirects to `/login`.
- Refresh is **single-flight**: the API rotates single-use refresh tokens and treats a replay as theft, so concurrent 401s and
  React StrictMode's double mount must share one request.
- Dev uses the Vite proxy so SPA and API share an origin (needed for the `SameSite=Strict` cookie). In production serve the SPA
  behind the same origin / reverse-proxy `/api`; for cross-site hosting relax the API's `COOKIE_SAMESITE` and set `CORS_ORIGINS`.

## Features
- **Dashboard**: KPI cards, revenue trend, status mix, top countries, searchable/sortable/paginated customer table.
- **Segments**: rule builder with instant validation, debounced live audience preview, saved segments with member counts.
- **Campaigns**: brief, AI draft (saved server-side), inline edits with per-channel character limits, regenerate with feedback,
  approve / schedule / archive workflow, history table.

## TypeScript notes
- `strict`, `noUnusedLocals/Parameters`; no `any` in the codebase. Path alias `@/*` → `src/*` is configured in both `tsconfig.json` and `vite.config.ts`.
- `src/types` mirrors the API contract; stores, API modules and components are all typed against it (e.g. `useAsync<T>` infers data types from the API function you pass).
- Generic building blocks: `Table<T>` with `Column<T>[]`, `useAsync<T>`, `useDebounce<T>`, typed Zustand stores (`create<State>()(...)`).
- Env vars are typed in `src/vite-env.d.ts`.
