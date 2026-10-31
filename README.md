# Hambazi

Hambazi is a mobile-first sports community PWA for discovering nearby games, hosting a match, and keeping up with players before game day. The interface follows the supplied Hambazi screens: purple actions, green availability, Manrope typography, match filters, venue/map details, profile setup, chat, and account settings.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. For a production build, run `npm run build` and `npm run start`.

## Demo account flow

- Guest mode works without an account and stores demo data in this browser.
- Sign-in calls DummyJSON Auth. Use username `emilys` and password `emilyspass` to try its demo login.
- Sign-up calls DummyJSON’s simulated add-user endpoint. DummyJSON does not persist created users, so this is not production account storage.
- Match listings, join requests, hosted games, messages, preferences, and profiles are local demo state. They are not shared with another user or server.
- Push notifications, support inbox, moderation reports, and payments are not connected in this demo. The location picker stores a city name; device coordinates are used only for a one-time approximate lookup against London, Liverpool, and Bristol.
- Entry fees are informational only. No payments are collected.

## Structure

- `app/` contains the Next.js App Router files: `/`, `/offline`, the shared layout, global styles, and manifest.
- `src/application/` composes the client app and coordinates its local screen state; this is application code, not a Next.js route directory.
- `src/features/` contains auth/onboarding, discovery/filtering, matches, messaging, profile, and settings screens.
- `src/components/` contains shared layout and UI components.
- `src/lib/` contains domain types, seed content, validation schemas, auth calls, the pure app reducer, and local persistence.
- `src/styles/` contains global design tokens and shared primitive, shell, feedback, overlay, and layout styles. Each feature keeps its own stylesheet beside its components; `app/globals.css` is only the Tailwind entry point.
- The main app screens are client-side navigation inside `/`; match and profile links use URL hashes. Only `/`, `/offline`, and the manifest are Next.js routes today.

## Quality checks

```bash
npm run lint
npm run test
npm run format:check
npx tsc --noEmit
npm run build
```

## PWA behavior

The manifest includes install icons and standalone display settings. The service worker caches the offline screen, local visual assets, and same-origin Next static assets. It uses network-first page navigation with cached fallbacks and does not cache the cross-origin demo API. Install prompts appear only in browsers that provide the install event.

## Production requirements

Replace DummyJSON auth and browser-local match state with a real account, database, authorization, and messaging service before launch. Server-side access control is required for private matches. Venue map tiles are served by OpenStreetMap and need a network connection.
