import fetch from "node-fetch";

export async function getRedditData(req, res) {
  try {
    const [topRes, aboutRes] = await Promise.all([
      fetch("https://www.reddit.com/r/NorthGeorgiaEBikes/top.json?t=week&limit=3"),
      fetch("https://www.reddit.com/r/NorthGeorgiaEBikes/about.json")
    ]);

    const topJson = await topRes.json();
    const aboutJson = await aboutRes.json();

    const posts = topJson?.data?.children?.map(c => c.data) ?? [];
    const about = aboutJson?.data ?? null;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({ posts, about });
  } catch (err) {
    console.error("Reddit API error:", err);
    res.status(500).json({ posts: [], about: null });
  }
}