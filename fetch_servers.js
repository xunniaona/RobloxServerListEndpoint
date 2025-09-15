// fetch_servers.js
// Node 18+

const fs = require("fs");
const path = require("path");

const PLACE_ID = 109983668079237;
const PAGE_LIMIT = 100;
const OUTPUT_FILE = path.join(__dirname, "server_list.json");

async function fetchPage(cursor) {
  let url = `https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public?sortOrder=Desc&limit=${PAGE_LIMIT}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Roblox API error: ${res.status}`);
  return res.json();
}

(async () => {
  try {
    const servers = [];
    let cursor = null;
    let tries = 0;

    while (true) {
      let data;
      try {
        data = await fetchPage(cursor);
      } catch (err) {
        tries++;
        if (tries > 5) throw err;
        const delay = 30 * tries; // 30s, 60s, 90s...
        console.warn("Fetch page failed (429?), retrying after", delay, "seconds");
        await new Promise(r => setTimeout(r, delay * 1000));
        continue;
      }

      tries = 0;
      for (const s of data.data || []) {
        if (s.playing < s.maxPlayers) {
          servers.push({
            id: s.id,
            playing: s.playing,
            maxPlayers: s.maxPlayers,
            created: s.created || null
          });
        }
      }

      cursor = data.nextPageCursor;
      if (!cursor) break;
      await new Promise(r => setTimeout(r, 200));
    }

    const payload = {
      fetched_at: Math.floor(Date.now() / 1000),
      placeId: Number(PLACE_ID),
      servers: servers
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), "utf8");
    console.log(`Wrote ${servers.length} servers to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error("Fatal:", err);
    process.exit(1);
  }
})();
