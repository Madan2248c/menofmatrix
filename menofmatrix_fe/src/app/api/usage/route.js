/**
 * POST /api/usage — store LLM usage snapshots (opt-in only).
 * Receives normalized numbers from the extension bridge, not tokens.
 * If DATABASE_URL is set, writes to Neon `llm_usage_snapshots`, else no-op but returns ok.
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const snapshots = Array.isArray(body.snapshots) ? body.snapshots : body.snapshot ? [body.snapshot] : [];

    if (!snapshots.length) {
      return Response.json({ ok: false, error: "No snapshots" }, { status: 400 });
    }

    // light validation
    for (const s of snapshots) {
      if (!s.provider || !s.usage) {
        return Response.json({ ok: false, error: "Invalid snapshot shape" }, { status: 400 });
      }
    }

    // if no DB configured, just ack (dev mode)
    if (!process.env.DATABASE_URL) {
      console.log("[usage] no DATABASE_URL — mocked store", snapshots.length);
      return Response.json({ ok: true, mocked: true, count: snapshots.length });
    }

    // lazy import pg only when needed
    const { Pool } = await import("pg");
    const needsSsl = !/(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL);
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
      max: 1,
    });

    // ensure table exists (idempotent)
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

    // Identify who this belongs to:
    // Priority: Google user email (visitors) -> owner JWT -> device fallback
    let userIdentifier = null;
    // 1) Google Sign-In — sent as plain email header/body (trusted after auth, no JWT verify needed)
    const userEmail = request.headers.get("x-user-email") || body.userEmail || null;
    if (userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      userIdentifier = userEmail.toLowerCase();
    }
    // 2) owner JWT if no Google email
    if (!userIdentifier) {
      const auth = request.headers.get("authorization") || "";
      if (auth.startsWith("Bearer ")) {
        try {
          const { default: jwt } = await import("jsonwebtoken");
          const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
          userIdentifier = payload?.id || payload?.sub || payload?.email || payload?.role || null;
        } catch {}
      }
    }
    // 3) per-browser device fallback (guest without Google)
    const deviceId = request.headers.get("x-device-id") || body.deviceId || null;
    if (!userIdentifier && deviceId) userIdentifier = `device:${deviceId}`;
    if (!userIdentifier) userIdentifier = request.headers.get("x-user-id") || body.userId || "anonymous";

    for (const s of snapshots) {
      await pool.query(
        `INSERT INTO llm_usage_snapshots (provider, windows, spend, captured_at, user_identifier)
         VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5)`,
        [s.provider, JSON.stringify(s.usage.windows || []), s.usage.spend ? JSON.stringify(s.usage.spend) : null, s.at || Date.now(), userIdentifier]
      );
    }

    await pool.end();
    return Response.json({ ok: true, count: snapshots.length });
  } catch (err) {
    console.error("[usage] POST failed", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // simple health + recent check
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: true, db: false, note: "Set DATABASE_URL to persist" });
  }
  try {
    const { Pool } = await import("pg");
    const needsSsl = !/(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL);
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
      max: 1,
    });
    const { rows } = await pool.query(`SELECT provider, windows, spend, captured_at FROM llm_usage_snapshots ORDER BY id DESC LIMIT 5`);
    await pool.end();
    return Response.json({ ok: true, recent: rows });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
