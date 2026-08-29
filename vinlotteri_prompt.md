# Prompt for Claude Code — "Vinlotteri" weekly wine giveaway site

Copy everything below into Claude Code, run it from inside the `komtekvin` project folder (the one that already contains the `webint_program` and `images` folders), and let it build the app.

---

## What to build

A single-page web app for a weekly wine giveaway in a school class. It has three "pages" that live inside one app and are switched between using a navigation bar fixed to the **bottom** of the screen:

1. **Left page — Payment**: a simple page that just displays "Vipps `X` to `Y`" (a payment instruction).
2. **Middle page — Wheel**: a spinning wheel with names on it that picks a random winner. This is the default page shown when the app loads. Seed it with 5 placeholder test names for now.
3. **Right page — Wine list**: a gallery of the wines that have been given out so far, styled the same way wines are displayed in the `webint_program` folder (see "Visual reference" below).

The app must be built with **React and TypeScript**. Every single piece of user-facing text (nav labels, headings, button text, the payment sentence, placeholder/empty states, etc.) must be pulled from a translation/strings module — **never hardcode text directly in JSX** — so additional languages can be added later just by adding a new locale file. Default the app to one locale (Norwegian, `nb`) for now.

## Reference material already on disk (read before coding)

- **`webint_program/`** — an existing course project ("WineLover"). This is **visual and structural inspiration only** for how the wine list/cards should look and behave — read `src/html/search.html`, `src/styles/global.css`, `src/styles/search.css`, and `src/javascript/utils.js` (specifically `displayReviews()` and `showFullWine()`) to see the exact card markup, the click-to-open modal pattern, the color scheme (`#9c0909` deep red + white), and the serif typography. `webint_program` will be deleted later, so:
  - Do **not** import, copy, or reference any files from inside `webint_program` (its per-wine bottle images, star-rating icons, favicon, fonts, JS, or CSS files). Re-implement the *look* in the new project's own files.
  - Do **not** reuse its backend/data architecture (plain Node `http` server, that exact JSON schema) beyond using it as loose inspiration — this new project has its own stack (see below).
- **`images/`** — contains two files:
  - `pouring_wine_standing.gif` — a clean, transparent, watermark-free illustrated animation of a bottle pouring wine. **Use this one** as a decorative touch (e.g. on the wheel page, or as a flourish when a winner is picked).
  - `pouring_wine_block.png` — **do not use this file.** It's a stock photo with a large tiled "PNGTree" watermark across it and is not cleared for use.

Since no real wine-bottle photos exist yet for the giveaway log, use a simple generic placeholder graphic per wine entry for now (a neutral SVG bottle silhouette in the brand red, or reuse the gif) — this will be swapped for real photos later.

## Visual style

Match the look of `webint_program`'s wine cards as the base aesthetic for the whole app:
- Deep wine red `#9c0909` as the primary accent, white backgrounds.
- Serif typography (Times New Roman / serif fallback stack).
- Wine cards: 2px solid red border, rounded corners (~8px), padding, subtle hover lift with a red-tinted shadow.
- Clicking a wine card opens a centered modal with a backdrop showing full details, with a close button — same interaction pattern as `showFullWine()` in the reference project.
- Fully responsive: cards wrap into a flexible grid on desktop and stack to a single column under ~768px, same breakpoint behavior as the reference project.
- The bottom navigation bar should be persistent across all three pages (fixed to the bottom of the viewport), clearly showing which of the 3 pages is active.

## Page 1 — Payment (left)

- Centered, large, simple. Displays a sentence built from the strings module combining a payment amount and a phone number, e.g. "Vipps `{amount}` to `{number}`".
- Store the amount and number as clearly separated, easy-to-edit config values (e.g. `config/payment.ts` exporting `VIPPS_AMOUNT` and `VIPPS_NUMBER`). Seed them with the literal placeholder values `"X"` and `"Y"` — the real values will be filled in later.

## Page 2 — Wheel (middle, default page)

- A wheel (canvas or SVG) divided into equal segments, one per name, each showing the name.
- Seed the data with **5 placeholder test names** (e.g. `Navn 1`–`Navn 5`, or generic first names — your choice).
- A spin button triggers an animated spin (several rotations easing to a stop) that lands on a uniformly random segment — every name has equal probability every time, **including names that have already won before** (no removal from the pool after a win; repeat wins across different weeks are fine).
- After the wheel stops, prominently announce the winner's name.
- Build the wheel to render generically from an array of names of any length — it must **not** be hardcoded to exactly 5 — since adding/removing names from this pool is a feature that will be added later. For now, the array itself is edited directly in the source/data file; no add/edit UI is needed yet.

## Page 3 — Wine list (right)

- A responsive grid of wine cards in the visual style described above (name, image, optional price, optional keywords, short description, and a place/year/date row — reuse whichever of these fields make sense for a "wines given out" log).
- Add a `winner` field per entry (the name of the class member who won that wine), shown on the card and in the modal, since this is a giveaway history rather than a review catalogue.
- Clicking a card opens the full-detail modal (see interaction pattern above).
- Seed with a small number of example entries (2–4 is enough) in the placeholder-image style described above. This list is edited directly in its data file for now — no add/edit UI yet.

## Text & translations

- Create a typed locale interface (e.g. `i18n/types.ts`) describing every UI string used in the app, grouped by section (`nav`, `payment`, `wheel`, `wines`, common/shared strings, etc.).
- Implement one locale file that satisfies that interface, e.g. `i18n/locales/nb.ts`, with the Norwegian text as the initial/default language. Because it's typed against the shared interface, TypeScript will immediately flag anything missing when a second locale is added later.
- Provide a small context/hook (e.g. `useStrings()`) that components use to read the current locale's strings — no other way to render text should exist in the app.
- A language switcher UI is **not** needed yet — just make sure the architecture doesn't block adding one later.

## Data & backend

- Add a small **Express + TypeScript** backend that reads from simple JSON files on disk (similar spirit to `webint_program`'s "two JSON files as a lightweight database" approach, just reimplemented in TypeScript):
  - `data/wheelNames.json` — the 5 seed names for the wheel.
  - `data/wines.json` — the seeded wine-giveaway entries.
- Expose read endpoints (e.g. `GET /api/wheel-names`, `GET /api/wines`) that the frontend fetches on load, with a sensible local fallback if the request fails.
- Optionally (nice-to-have, skip if it adds too much complexity) log each spin result with a timestamp to a third JSON file, for future reference — this is not required to satisfy "no removal from the pool," it's just a history log.
- Don't build any admin/write UI yet (no forms to add wheel names or wine entries) — editing the JSON seed files directly is the intended workflow for now, per the plan above. Just keep the backend's data-access code isolated enough (e.g. a small module per JSON file) that write endpoints can be added later without restructuring.
- In production, the Express server should also serve the built React frontend as static files, so the whole app runs as one process on one port (mirroring how `webint_program` runs as a single Node process).

## Docker

Set this project up with the same two-file Docker Compose pattern used by `webint_program` (see its `Dockerfile`, `docker-compose.yml`, `docker-compose.local.yml`, `.dockerignore` for the exact pattern to mirror), adapted for a project that needs a build step:

- **`Dockerfile`** — multi-stage build: an initial stage installs dependencies and builds both the React frontend (Vite build) and the compiled Express server, then a slim `node:22-alpine` runtime stage copies over just the built output (+ `data/`) and runs the compiled server. `EXPOSE 3000`, `ENV PORT=3000`.
- **`docker-compose.yml`** (production/VPS) — builds the image, `restart: unless-stopped`, `expose: "3000"` only (no published host port — this sits behind a reverse proxy like Caddy on the VPS, same as `webint_program`), bind-mounts `./data:/app/data` so edits to the seed JSON survive rebuilds, its own Docker network.
- **`docker-compose.local.yml`** (local dev overlay) — adds `ports: "3000:3000"` so it's reachable at `http://localhost:3000`, bind-mounts the source folders for live editing, `restart: "no"`. Usage: `docker compose -f docker-compose.yml -f docker-compose.local.yml up --build`.
- **`.dockerignore`** — exclude `node_modules`, `.git`, build output, README, etc.

## A few implementation notes

- Keep TypeScript strict mode on; the project should build with no type errors.
- Copy `pouring_wine_standing.gif` into the frontend's own assets folder as part of the build — don't reference it from outside the project directory.
- If you hit a genuine ambiguity not covered above, make the most reasonable choice, note the assumption in your summary, and keep going rather than stopping.

---

*Context for whoever reads this later: this is a weekly wine giveaway run in a school class. Students pay via Vipps (a Norwegian mobile payment app), a name is drawn on the spinning wheel, and the winner takes home a bottle — logged on the wine list page as a running history of the giveaway.*
