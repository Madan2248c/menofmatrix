const BACKEND = process.env.BACKEND_URL || "https://backend-two-delta-twnhtuwv4g.vercel.app";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "10";

  const [blogsRes, newsRes] = await Promise.allSettled([
    fetch(`${BACKEND}/api/blog?limit=${limit}`, { cache: "no-store" }).then((r) => r.json()),
    fetch(`${BACKEND}/api/news?limit=${limit}`, { cache: "no-store" }).then((r) => r.json()),
  ]);

  const blogs = blogsRes.status === "fulfilled" ? blogsRes.value.data || [] : [];
  const news = newsRes.status === "fulfilled" ? newsRes.value.data || [] : [];

  return Response.json({
    blogs,
    news,
  });
}
