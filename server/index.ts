import path from 'node:path';
import { existsSync } from 'node:fs';
import express, { type Request, type Response } from 'express';
import {
  readWheelNames,
  addWheelName,
  removeWheelName,
  wheelNameExists,
} from './store/wheelNames.js';
import { readWines, addWine } from './store/wines.js';
import { readPlayers, computeStats, recordRound, addPlayer } from './store/players.js';
import { appendSpin } from './store/spinLog.js';
import { readPayment, writePayment } from './store/payment.js';
import { saveWineImage, ImageTooLargeError, UPLOAD_DIR } from './store/uploads.js';

// Load .env if present (local dev). In Docker the value comes from the
// environment (env_file / environment), so a missing .env is fine.
try {
  process.loadEnvFile();
} catch {
  /* no .env file — rely on the process environment */
}

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.PASSWORD ?? '';
const CLIENT_DIR = path.resolve(process.cwd(), 'dist');

const app = express();
// Generous limit because a new wine can carry a base64-encoded photo; the image
// itself is capped separately in saveWineImage().
app.use(express.json({ limit: '8mb' }));

// Uploaded wine photos, written by POST /api/wines. Registered before the SPA
// catch-all so these URLs are never answered with index.html.
app.use('/uploads', express.static(UPLOAD_DIR));

/** Constant-ish password check. Returns false if no password is configured. */
function isAdmin(req: Request): boolean {
  if (!ADMIN_PASSWORD) return false;
  const provided =
    (typeof req.body?.password === 'string' && req.body.password) ||
    (typeof req.header('x-admin-password') === 'string' && req.header('x-admin-password')) ||
    '';
  return provided === ADMIN_PASSWORD;
}

// ---- Read API ----
app.get('/api/wheel-names', async (_req: Request, res: Response) => {
  try {
    res.json(await readWheelNames());
  } catch (err) {
    console.error('Failed to read wheel names', err);
    res.status(500).json({ error: 'Could not read wheel names' });
  }
});

app.get('/api/wines', async (_req: Request, res: Response) => {
  try {
    res.json(await readWines());
  } catch (err) {
    console.error('Failed to read wines', err);
    res.status(500).json({ error: 'Could not read wines' });
  }
});

app.get('/api/payment', async (_req: Request, res: Response) => {
  try {
    res.json(await readPayment());
  } catch (err) {
    console.error('Failed to read payment settings', err);
    res.status(500).json({ error: 'Could not read payment settings' });
  }
});

/** Today as "dd.mm.yyyy" — the date format already used across wines.json. */
function todayDDMMYYYY(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
}

/** The roster with each player's derived wine collection — the shape the UI reads. */
async function currentStats() {
  const [players, wines] = await Promise.all([readPlayers(), readWines()]);
  return computeStats(players, wines);
}

app.get('/api/players', async (_req: Request, res: Response) => {
  try {
    res.json(await currentStats());
  } catch (err) {
    console.error('Failed to read players', err);
    res.status(500).json({ error: 'Could not read players' });
  }
});

// ---- Admin ----
// Validates the password so the client can enter ADMIN mode.
app.post('/api/admin/login', (req: Request, res: Response) => {
  if (isAdmin(req)) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: 'Wrong password' });
  }
});

// Records a spin result into the stats — the ONLY write path to the table.
// Admin-only: without the correct password nothing is updated.
app.post('/api/spins/record', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Admin only' });
    return;
  }
  const winner = typeof req.body?.winner === 'string' ? req.body.winner.trim() : '';
  const names: string[] = Array.isArray(req.body?.names)
    ? req.body.names.filter((n: unknown): n is string => typeof n === 'string')
    : [];
  if (!winner) {
    res.status(400).json({ error: 'winner is required' });
    return;
  }
  try {
    const players = await recordRound(names, winner);
    await appendSpin(winner);
    res.status(201).json({ ok: true, players });
  } catch (err) {
    console.error('Failed to record spin', err);
    res.status(500).json({ error: 'Could not record spin' });
  }
});

// Sets the Vipps amount/number and the two dates in the hint ("betal innen X …
// trekningen Y"), all shown on the Payment page. Admin-only. Any value may be
// cleared by sending null/empty, which puts the placeholder back.
app.put('/api/payment', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Admin only' });
    return;
  }
  const rawAmount = req.body?.amount;
  const amount =
    rawAmount === null || rawAmount === '' || rawAmount === undefined ? null : Number(rawAmount);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }
  const rawPhone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  // Norwegian Vipps numbers are digits, but keep +/space so foreign numbers work.
  if (rawPhone && !/^[+\d][\d\s]{2,19}$/.test(rawPhone)) {
    res.status(400).json({ error: 'phone must be a valid number' });
    return;
  }
  // The two dates are free text ("fredag 04.09", "denne uken"), only length-capped.
  const dateField = (value: unknown): string =>
    typeof value === 'string' ? value.trim().slice(0, 60) : '';
  const deadline = dateField(req.body?.deadline);
  const drawDate = dateField(req.body?.drawDate);
  try {
    res.json(
      await writePayment({
        amount,
        phone: rawPhone || null,
        deadline: deadline || null,
        drawDate: drawDate || null,
      }),
    );
  } catch (err) {
    console.error('Failed to save payment settings', err);
    res.status(500).json({ error: 'Could not save payment settings' });
  }
});

// Logs a wine given away. Admin-only. The client sends `winner`, so adding from
// a player's collection page and adding from the general list are the same call —
// the wine lands in wines.json either way and shows up in both views.
app.post('/api/wines', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Admin only' });
    return;
  }
  const body = req.body ?? {};
  const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
  const name = str(body.name);
  const winner = str(body.winner);
  if (!name || !winner) {
    res.status(400).json({ error: 'name and winner are required' });
    return;
  }

  const yearNumber = Number(body.year);
  const keywords = (Array.isArray(body.keywords) ? body.keywords : str(body.keywords).split(','))
    .map((k: unknown) => str(k))
    .filter(Boolean);

  try {
    let img: string | null = null;
    if (typeof body.imageData === 'string' && body.imageData) {
      img = await saveWineImage(name, body.imageData, str(body.imageExt));
    }
    const wine = await addWine({
      name,
      winner,
      year: Number.isFinite(yearNumber) && yearNumber > 0 ? yearNumber : null,
      location: str(body.location),
      date: str(body.date) || todayDDMMYYYY(),
      price: str(body.price),
      keywords,
      description: str(body.description),
      img,
    });
    res.status(201).json(wine);
  } catch (err) {
    if (err instanceof ImageTooLargeError) {
      res.status(413).json({ error: 'Image too large' });
      return;
    }
    console.error('Failed to add wine', err);
    res.status(500).json({ error: 'Could not add wine' });
  }
});

// Adds a name to the wheel and, if they are new, to the stats roster with
// zeroed counters. Admin-only. Someone taken off the wheel earlier can be added
// back here — their existing counters are kept.
app.post('/api/wheel-names', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Admin only' });
    return;
  }
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    if (await wheelNameExists(name)) {
      res.status(409).json({ error: 'Name already on the wheel' });
      return;
    }
    await addPlayer(name);
    res.status(201).json(await addWheelName(name));
  } catch (err) {
    console.error('Failed to add wheel name', err);
    res.status(500).json({ error: 'Could not add name' });
  }
});

// Takes a name off the wheel. Admin-only. Deliberately does NOT touch
// players.json or wines.json: the stats table keeps the person and their history.
app.delete('/api/wheel-names/:name', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Admin only' });
    return;
  }
  const name = req.params.name.trim();
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    res.json(await removeWheelName(name));
  } catch (err) {
    console.error('Failed to remove wheel name', err);
    res.status(500).json({ error: 'Could not remove name' });
  }
});

// ---- Serve the built React client (production) ----
// In dev the client is served by Vite, so dist/ may not exist yet.
if (existsSync(CLIENT_DIR)) {
  app.use(express.static(CLIENT_DIR));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(CLIENT_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Vinlotteri running at http://localhost:${PORT}/`);
});
