# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`komtekvin` is **Vinlotteri** — a single-page app for a weekly wine giveaway in a school class (pay via Vipps → spin a wheel → winner takes a bottle, logged as a running history).

**The app is built.** It has four pages behind a fixed bottom nav: Payment (left), Wheel (middle, default), Wine list, and Stats (right). `vinlotteri_prompt.md` is the original spec for the base app; features beyond it (Stats page, per-player collection pages, sponsor tag, extra imagery, colourful theme) were added afterwards.

### Architecture at a glance
- **Frontend** `src/` — React + TypeScript (Vite). `App.tsx` holds the `View` state (the four pages + a `player` sub-view for one person's collection). Pages in `src/pages/`, components in `src/components/`.
- **Backend** `server/` — Express + TypeScript. `server/index.ts` exposes read endpoints and, in production, serves the built client from `dist/`. Each JSON file has its own isolated access module under `server/store/`.
- **Data** `data/` — `wheelNames.json` (`{ name, tickets }[]` — who is on the wheel and how many tickets (lodd) each holds; a legacy `string[]` file is still read, giving everyone one ticket), `wines.json`, `players.json` (roster with **stored** `timesPlayed`/`timesWon` counters; each player's `collection` is **derived** server-side by joining on the wine `winner` field), and append-only `spinLog.json`. `payment.json` holds the admin-editable Vipps amount/number plus the two free-text dates in the payment hint (`deadline`, `drawDate` — "betal innen X … trekningen Y"); `null` = unset, so the `X`/`Y` placeholders in `src/config/payment.ts` are shown. `data/uploads/` (gitignored, created on first upload) holds wine photos added through the app, served at `/uploads/...`; it lives under `data/` so the Docker bind mount keeps them across rebuilds.
- **Admin mode** — password (`PASSWORD` in `.env`, gitignored/dockerignored; loaded via `process.loadEnvFile()`, injected in Docker via `env_file`). `POST /api/admin/login` validates it; the client (`src/admin.tsx`, `AdminUnlock` in the header) then holds it in memory. Spinning the wheel only writes to the stats when admin is active: `POST /api/spins/record` (gated by the `x-admin-password` header) calls `recordRound()` to bump `timesPlayed` for everyone on the wheel (once each, whatever their ticket count) and `timesWon` for the winner. The same call then spends one of the winner's tickets via `consumeTicket()` and answers with the refreshed wheel, so the page redraws with the smaller wedge; a person whose last ticket goes drops off the wheel, keeping their stats row. Non-admin spins are purely visual. The wheel page shows an ADMIN badge (click to log out) and, when not admin, a hint that admin is needed to save results. Admin can also edit the wheel's participants from the **wheel page** (`POST /api/wheel-names`, `PATCH /api/wheel-names/:name` for the ticket count, `DELETE /api/wheel-names/:name`, same header gate). Tickets decide how much of the wheel someone covers — one wedge per person, sized by their share of all tickets, and the draw is weighted to match — and the roster chips carry − / + steppers for them.

  **The wheel has two display modes**, switching on the **total ticket count** (not head count — wedges are ticket shares, so the smallest is `360/total`; see `src/wheelDisplay.ts`, which owns `wheelColor()`, `totalTickets()` and the `namesFitOnWheel()` threshold of 8). At **8 tickets or fewer** the wedges carry names and the `×N` marker, both cats show, and there is no legend. At **9 or more** all text comes off the wheel and each person is identified by their colour instead: `WheelLegend` maps colour → name, shown as a column left of the wheel on a computer (the left cat is hidden by a `.centered-row:has(.wheel-legend)` rule, since `App.tsx` cannot know the roster size) and behind a *"Se hvilken farge du er"* button on a phone, which opens `WheelLegendOverlay` over the whole screen. Colours come from the wedge's **position in `entries`** — the legend sorts a copy for display and carries the original index, so its swatches keep matching the wheel. The two directions are deliberately asymmetric: **adding** writes `wheelNames.json` *and* creates a zeroed `players.json` row, so a new person shows up in the stats immediately; **removing** writes only `wheelNames.json`, so the person keeps their stats row, counters and won wines. Re-adding someone taken off the wheel keeps their existing counters. Setting someone's tickets to 0 takes them off the wheel, exactly like a remove. `wines.json` is never written from here. The Stats page is read-only. Admin can also log a wine from a player's collection page (`POST /api/wines`, same gate) — a modal form modelled on `webint_program`'s add-wine flow, with a click-or-drop image picker that posts the photo as base64; the server whitelists the extension and generates the filename. Since a collection is derived from `winner`, one write puts the bottle both in that player's collection and in the general Viner list. Counters are untouched: only a spin bumps `timesWon`. The same form doubles as an **editor** (`PUT /api/wines/:id`), opened from the "Rediger" button the wine modal shows in admin mode on both the Viner page and a player's page, so a description or photo can be filled in later. Every field is editable including the winner — picked from a `<select>`, because the collection join matches the name exactly — and leaving the photo alone keeps the stored one. The Payment page carries a third admin editor (`GET`/`PUT /api/payment`) for the amount (rendered with the `kr` suffix by the locale), the Vipps number, and the payment-deadline / draw dates shown in the hint. The unlock control in the header is rendered fully transparent by `.admin-lock` — an invisible but clickable corner button, no glyph or tooltip.
- **i18n** — every user-facing string comes from `src/i18n/locales/nb.ts` (typed by `src/i18n/types.ts`) read via `useStrings()`. **Never hardcode text in JSX.** A second locale is one new file TypeScript checks for completeness.
- **Images** — all live in `public/img/` (served at `/img/...`), referenced through the `IMG` map in `src/images.ts`. Data-driven wine images use `/img/...` URLs in `wines.json`; photos uploaded through the app get `/uploads/...` URLs instead. `pouring_wine_standing.gif` is the `.pour-bg` backdrop — Betaling page only, mobile only — anchored top-right just under the header (`--header-height`), pouring down and to the left. `vipps-icon.svg` sits inside the payment box as a link: `vipps://` on touch devices (opens the app), `https://vipps.no` elsewhere, both editable in `src/config/payment.ts`.

### ⚠️ Watermarked images
`public/img/cat.png` and `old_lady.webp` are **watermarked stock previews** (Vecteezy / PngTree) still shown as wine-card images — not licensed for production; replace the files in both `images/` and `public/img/` with clean versions before any real deploy. `confetti_block.png` is also watermarked but is currently **not referenced** anywhere in the UI. Clean assets: `aces.png`, `cat_2.png`, `happy_wine.png`, `pouring_wine.png`, and both `*_standing.gif` files.

### Reference project
- `webint_program/` — an existing course project ("WineLover"). **Reference only, and slated for deletion.** See rules below.

## `webint_program/` — reference only, do not couple to it

Use it as **visual/structural inspiration only** for how wine cards look and behave. The most relevant files:
- `src/javascript/utils.js` — `displayReviews()` (card markup) and `showFullWine()` (click-to-open modal + backdrop pattern) are the interaction reference.
- `src/styles/global.css`, `src/styles/search.css`, `src/html/search.html` — card styling and grid.

Hard rules:
- **Do not import, copy, or reference any file inside `webint_program/`** from the new app (its images, icons, fonts, CSS, JS). Re-implement the *look* in the new project's own files. It will be deleted.
- **Do not reuse its backend architecture** (plain Node `http` server, its JSON schema) beyond loose inspiration — the new app has its own stack.

The look to reproduce: deep wine red `#9c0909` accent on white, serif typography, cards with a 2px red border / ~8px radius / hover lift, click-to-open centered modal with backdrop, responsive grid that stacks to one column under ~768px.

## Target stack (the app to build)

- **Frontend:** React + TypeScript, Vite build. Three "pages" inside one SPA switched by a bottom-fixed nav bar: Payment (left), Wheel (middle, default), Wine list (right).
- **Backend:** Express + TypeScript reading JSON files from `data/` (`wheelNames.json`, `wines.json`). Expose read endpoints (e.g. `GET /api/wheel-names`, `GET /api/wines`) with a local fallback if the fetch fails. Isolate each JSON file's access in its own module so write endpoints can be added later. In production, Express also serves the built React app as static files — one process, one port.
- **Config:** payment amount/number live in editable config values (e.g. `config/payment.ts`), seeded with placeholder `"X"` / `"Y"`.

### i18n is a hard architectural constraint
**Never hardcode user-facing text in JSX.** Every string comes from a typed locale module: a `LocaleStrings` interface describing all strings grouped by section, one locale file (`nb` = Norwegian, the default) satisfying it, read through a single `useStrings()` hook/context. This is so a second locale is a single new file that TypeScript type-checks for completeness. Do not add any other text-rendering path.

### Seed data (placeholders, edited directly in files for now — no admin/write UI yet)
- Wheel: 5 placeholder names. Render the wheel generically from an array of **any** length (not hardcoded to 5).
- Wheel draw: uniformly random over **all** names every spin, including past winners (no removal from the pool; repeat wins are fine).
- Wine list: 2–4 example entries, each with a `winner` field (giveaway history, not a review catalogue). Use a generic placeholder bottle graphic — no real bottle photos yet.
- Copy `pouring_wine_standing.gif` into the frontend's own assets during build; don't reference it from outside the project dir.

Keep TypeScript strict mode on; the project must build with zero type errors.

## Docker (mirror `webint_program`'s two-file compose pattern, adapted for a build step)

- `Dockerfile` — multi-stage: build React (Vite) + compile Express, then a slim `node:22-alpine` runtime stage copying only built output + `data/`, running the compiled server. `EXPOSE 3000`, `ENV PORT=3000`.
- `docker-compose.yml` (prod/VPS) — builds image, `restart: unless-stopped`, `expose: 3000` only (no published host port — sits behind a Caddy reverse proxy), bind-mounts `./data:/app/data`, own network plus the external `web` network shared with Caddy (see Deployment below).
- `docker-compose.local.yml` (local overlay) — adds `ports: "3000:3000"`, bind-mounts source for live editing, `restart: "no"`.
- Run locally: `docker compose -f docker-compose.yml -f docker-compose.local.yml up --build` → http://localhost:3000

## Deployment (VPS, behind Caddy)

The app runs at **komteksvinklubb.online** as one container, `vinlotteri-app`.
Caddy (`~/opt/caddy` on the VPS) terminates TLS and proxies to it over the
pre-existing external Docker network `web`, which every proxied app joins:

```caddyfile
komteksvinklubb.online, www.komteksvinklubb.online {
    reverse_proxy vinlotteri-app:3000
}
```

One `reverse_proxy` line is enough — the same Express process serves `/api/*`,
`/uploads/*` and the built SPA, so there is nothing to split by path.

Caddy resolves the **container name** (`vinlotteri-app`), not the service name
(`app`), which is deliberate: the service is called `app` here, so using the
service name would collide with any other project on `web` that does the same.

On the VPS, `.env` must be created by hand next to `docker-compose.yml` — it is
gitignored, so it never arrives with a clone, and `env_file` makes compose fail
outright without it.
