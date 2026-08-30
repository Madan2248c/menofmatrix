export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "12";

  try {
    const prod = await fetch(
      `https://backend-two-delta-twnhtuwv4g.vercel.app/api/stories?limit=${limit}`,
      { cache: "no-store" }
    );
    if (prod.ok) {
      const j = await prod.json();
      if (j.data?.length) return Response.json(j);
    }
  } catch {}

  try {
    const r = await fetch(
      `https://backend-two-delta-twnhtuwv4g.vercel.app/api/posts?limit=${limit}`,
      { cache: "no-store" }
    );
    const j = await r.json();
    const data = (j.data || []).slice(0, 1).map((p) => ({
      ...p,
      id: `live-${p.id}`,
      media_product_type: "STORY",
      caption: p.caption || "Live story",
    }));
    return Response.json({ source: "live-fallback", data });
  } catch {
    return Response.json({ source: "live", data: [] });
  }
}
