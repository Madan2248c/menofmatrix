const BACKEND = process.env.BACKEND_URL || "https://backend-two-delta-twnhtuwv4g.vercel.app";

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/api/newsletter/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
