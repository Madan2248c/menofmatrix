const BACKEND = process.env.BACKEND_URL || "https://backend-two-delta-twnhtuwv4g.vercel.app";

export async function GET(request, { params }) {
  const { slug } = await params;

  try {
    const res = await fetch(`${BACKEND}/api/blog/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    const json = await res.json();
    return Response.json(json, { status: res.status });
  } catch {
    return Response.json({ error: "Backend unreachable" }, { status: 502 });
  }
}