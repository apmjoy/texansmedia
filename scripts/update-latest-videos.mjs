const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UChwlfbfmoQMqrqTs_W2e0gQ";
const response = await fetch(feedUrl, {
  headers: { "user-agent": "TexanMediaWeeklyRefresh/1.0 (+https://texansmedia.com)" }
});
if (!response.ok) throw new Error("YouTube feed returned " + response.status);
const xml = await response.text();
const decode = (value) => value
  .replace(/&#([0-9]+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const tag = (entry, name) => {
  const open = "<" + name + ">";
  const close = "</" + name + ">";
  const start = entry.indexOf(open);
  const end = start < 0 ? -1 : entry.indexOf(close, start + open.length);
  return end < 0 ? "" : decode(entry.slice(start + open.length, end).trim());
};
const items = xml.split("<entry>").slice(1)
  .map(entry => entry.split("</entry>")[0])
  .map(entry => ({
    id: tag(entry, "yt:videoId"),
    title: tag(entry, "title"),
    publishedAt: tag(entry, "published")
  }))
  .filter(item => /^[A-Za-z0-9_-]{11}$/.test(item.id) && item.title)
  .slice(0, 15);
if (!items.length) throw new Error("No videos were found in the YouTube feed.");
const { mkdir, writeFile } = await import("node:fs/promises");
await mkdir("data", { recursive: true });
await writeFile("data/latest-videos.json", JSON.stringify(items, null, 2) + "\n");
console.log("Saved " + items.length + " latest Texan Media videos.");