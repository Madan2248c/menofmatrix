/**
 * POST /api/usage — store LLM usage snapshots (opt-in only).
 * Receives normalized numbers from the extension bridge, not tokens.
 * If DATABASE_URL is set, writes to Neon `llm_usage_snapshots`, else acks.
 */

// Module-scoped pool, reused across warm invocations. Creating (and ending) a
// Pool per request was a full TCP+TLS handshake each call and leaked the
// connection on any error path.
let _pool = null;
let _ensured = false;

async function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!_pool) {
    const { Pool } = await import("pg");
    const needsSsl = !/(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL);
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
      max: 1,
    });
  }
  return _pool;
}

async function ensureTable(pool) {
  if (_ensured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS llm_usage_snapshots (
      id SERIAL PRIMARY KEY,
      provider TEXT NOT NULL,
      windows JSONB NOT NULL DEFAULT '[]',
      spend JSONB,
      captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      user_identifier TEXT
    );
  `);
  _ensured = true;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const snapshots = Array.isArray(body.snapshots) ? body.snapshots : body.snapshot ? [body.snapshot] : [];

    if (!snapshots.length) {
      return Response.json({ ok: false, error: "No snapshots" }, { status: 400 });
    }
    for (const s of snapshots) {
      if (!s.provider || !s.usage) {
        return Response.json({ ok: false, error: "Invalid snapshot shape" }, { status: 400 });
      }
    }

    const pool = await getPool();
    if (!pool) {
      return Response.json({ ok: true, mocked: true, count: snapshots.length });
    }
    await ensureTable(pool);

    // Attribution only — the extension bridge sends its email/device id as a
    // hint, not proof of identity. Never treat this value as authenticated; it
    // only groups a device's own opt-in usage rows.
    let userIdentifier = null;
    const userEmail = request.headers.get("x-user-email") || body.userEmail || null;
    if (userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      userIdentifier = userEmail.toLowerCase();
    }
    if (!userIdentifier) {
      const deviceId = request.headers.get("x-device-id") || body.deviceId || null;
      if (deviceId) userIdentifier = `device:${deviceId}`;
    }
    if (!userIdentifier) userIdentifier = "anonymous";

    for (const s of snapshots) {
      await pool.query(
        `INSERT INTO llm_usage_snapshots (provider, windows, spend, captured_at, user_identifier)
         VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5)`,
        [s.provider, JSON.stringify(s.usage.windows || []), s.usage.spend ? JSON.stringify(s.usage.spend) : null, s.at || Date.now(), userIdentifier]
      );
    }

    return Response.json({ ok: true, count: snapshots.length });
  } catch (err) {
    console.error("[usage] POST failed", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // Health only. Never return usage rows here — they are per-user records and
  // this endpoint is unauthenticated.
  return Response.json({ ok: true, db: !!process.env.DATABASE_URL });
}
