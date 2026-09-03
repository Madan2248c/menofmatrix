const BACKEND = process.env.BACKEND_URL || (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "https://backend-two-delta-twnhtuwv4g.vercel.app");

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
