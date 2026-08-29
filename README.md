# Vinlotteri

Program for å hoste vinfredag på mastersal — a single-page app for a weekly wine
giveaway in a school class. Pay via Vipps, spin the wheel to draw a winner, and
browse the running log of wines given out.

Built with **React + TypeScript** (Vite) on the frontend and **Express +
TypeScript** on the backend. In production the Express server serves the built
frontend, so the whole app runs as one process on one port.

## The three pages

One SPA with a persistent bottom nav switching between:

1. **Betaling** (left) — a Vipps payment instruction (`Vipps X til Y`). The amount
   and number are placeholder config values in `src/config/payment.ts`.
2. **Hjulet** (middle, default) — a spinning wheel that draws a uniformly random
   winner from the name pool every spin (past winners stay in the pool).
3. **Viner** (right) — a responsive grid logging the wines given out, each with the
   winner's name; clicking a card opens a detail modal.

## Development

```bash
npm install
npm run dev        # Vite client on :5173 (proxies /api to the Express server on :3000)
```

Other scripts: `npm run build` (client + server), `npm start` (run the built
server), `npm run typecheck`.

## Data

Three JSON files under `data/` act as a lightweight database, edited directly (no
admin UI yet):

- `wheelNames.json` — the name pool for the wheel.
- `wines.json` — the giveaway log.
- `spinLog.json` — optional append-only history of spin results.

Served read-only at `GET /api/wheel-names` and `GET /api/wines`; the frontend
falls back to local seed data if a request fails. `POST /api/spins` appends to the
spin log.

## Translations

Every user-facing string comes from a typed locale module — no text is hardcoded in
components. `src/i18n/types.ts` defines the `LocaleStrings` interface, `src/i18n/
locales/nb.ts` implements Norwegian (the default), and components read text via
`useStrings()`. Adding a language is a single new locale file that TypeScript
checks for completeness.

## Docker

```bash
# Production-like (behind a reverse proxy; no published host port)
docker compose up --build

# Local (publishes http://localhost:3000, bind-mounts data/)
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

The `data/` directory is bind-mounted so edits to the seed JSON survive rebuilds.
Set `PORT` to override the default `3000`.

Both files join the external network `web` — the shared network the Caddy reverse
proxy sits on in production. It is not created by this project, so before the first
local run:

```bash
docker network create web
```

## Deployment

The container joins `web`, and Caddy proxies the domain to it by container name:

```caddyfile
komteksvinklubb.online, www.komteksvinklubb.online {
    reverse_proxy vinlotteri-app:3000
}
```

One line covers everything — the same Express process serves the API, the uploaded
images and the built frontend. Create `.env` (from `.env.example`) on the server
first; it is gitignored, and compose will not start without it.
