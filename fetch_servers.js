// fetch_servers.js
// Node 18+

const fs = require("fs");
const path = require("path");
const PLACE_ID = 109983668079237;
const PAGE_LIMIT = 100;
const OUTPUT_FILE = path.join(__dirname, "server_list.json");
const RAW_DIR = path.join(__dirname, "raw_responses");
if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR);
}
let pageCount = 0;
const MAX_PAGES = 3;
async function fetchPage(cursor) {
  let url = `https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public?sortOrder=Desc&limit=${PAGE_LIMIT}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("API error response:", text);
    throw new Error(`Roblox API error: ${res.status}`);
  }
  const json = await res.json();
  return json;
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

