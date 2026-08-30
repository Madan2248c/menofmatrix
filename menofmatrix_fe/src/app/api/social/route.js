const BACKEND = process.env.BACKEND_URL || "https://backend-two-delta-twnhtuwv4g.vercel.app";

export async function GET() {
  const [accountsRes, followersRes, twitterRes, videosRes] = await Promise.allSettled([
    fetch(`${BACKEND}/api/public/accounts`, { cache: "no-store" }).then((r) => r.json()),
    fetch(`${BACKEND}/api/public/followers`, { cache: "no-store" }).then((r) => r.json()),
    fetch(`${BACKEND}/api/public/twitter`, { cache: "no-store" }).then((r) => r.json()),
    fetch(`${BACKEND}/api/public/youtube/videos?limit=10`, { cache: "no-store" }).then((r) => r.json()),
  ]);

  const accounts = accountsRes.status === "fulfilled" ? accountsRes.value.data || [] : [];
  const followers = followersRes.status === "fulfilled" ? followersRes.value.data || [] : [];
  const twitter = twitterRes.status === "fulfilled" ? twitterRes.value : null;
  const videos = videosRes.status === "fulfilled" ? videosRes.value.data || [] : [];

  const byPlatform = (platform) => {
    const account = accounts.find((a) => a.platform === platform);
    const stats = followers.find((f) => f.platform === platform);
    return {
      connected: !!account,
      username: account?.name || null,
      avatarUrl: account?.avatar_url || stats?.avatar_url || null,
      followersCount: stats?.followers_count ?? null,
      channelId: account?.external_id || null,
    };
  };

  return Response.json({
    instagram: byPlatform("instagram"),
    youtube: { ...byPlatform("youtube"), videos },
    twitter: {
      connected: !!twitter?.username,
      username: twitter?.username || null,
      avatarUrl: null,
      followersCount: twitter?.followersCount ?? null,
      tweets: twitter?.tweets || [],
    },
  });
}
