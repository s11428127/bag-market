// 自動排程：到 eBay 官方 Browse API 搜尋每個款式「目前在賣」的價格，每款縮成一筆中位數，寫進 data/prices.csv。
// 需要 eBay 開發者帳號的金鑰（GitHub repo → Settings → Secrets → EBAY_CLIENT_ID / EBAY_CLIENT_SECRET）。
// 沒設金鑰就直接結束，不會失敗。
// 注意：這只抓得到「掛價」（ask），抓不到「成交價」；而且搜尋結果會混到配件、仿品、別的尺寸，只能當參考。
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCSV, toCSV, aggregateListings, rowKey } from '../assets/stats.js';

const ID = process.env.EBAY_CLIENT_ID, SECRET = process.env.EBAY_CLIENT_SECRET;
if (!ID || !SECRET) { console.log('沒有設定 EBAY_CLIENT_ID / EBAY_CLIENT_SECRET，跳過自動抓價。'); process.exit(0); }

const MIN_USD = 300; // 低於這個價格的多半是防塵袋、吊飾、仿品，先排除
const csvPath = new URL('../data/prices.csv', import.meta.url);
const { models } = JSON.parse(readFileSync(new URL('../data/models.json', import.meta.url)));
const rows = parseCSV(readFileSync(csvPath, 'utf8'));
const seen = new Set(rows.map(rowKey));
const today = new Date().toISOString().slice(0, 10);

async function token() {
  const r = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(`${ID}:${SECRET}`).toString('base64') },
    body: 'grant_type=client_credentials&scope=' + encodeURIComponent('https://api.ebay.com/oauth/api_scope'),
  });
  if (!r.ok) throw new Error(`eBay token 失敗 ${r.status}: ${await r.text()}`);
  return (await r.json()).access_token;
}

const tk = await token();
let added = 0;
for (const m of models) {
  if (!m.ebay_q) continue;
  const q = new URLSearchParams({ q: m.ebay_q, limit: '100', filter: `price:[${MIN_USD}..],priceCurrency:USD,buyingOptions:{FIXED_PRICE}` });
  const r = await fetch('https://api.ebay.com/buy/browse/v1/item_summary/search?' + q, {
    headers: { Authorization: 'Bearer ' + tk, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
  });
  if (!r.ok) { console.warn(`${m.id}: ${r.status}`); continue; }
  const items = (await r.json()).itemSummaries || [];
  const row = aggregateListings(items.map(it => Number(it.price?.value)), {
    date: today, model: m.id, source: 'eBay', currency: 'USD',
    url: 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(m.ebay_q),
  });
  if (row && !seen.has(rowKey(row))) { rows.push(row); seen.add(rowKey(row)); added++; }
  console.log(`${m.id}: ${items.length} 筆 → ${row ? row.price + ' USD' : '無'}`);
}
writeFileSync(csvPath, toCSV(rows));
console.log(`新增 ${added} 筆。`);
