// 產生「假的」示範資料，只用來看介面長怎樣（網址加 ?demo=1）。數字全部是亂數，不代表任何真實行情。
import { readFileSync, writeFileSync } from 'node:fs';
import { toCSV, weekOf } from '../assets/stats.js';

const { models } = JSON.parse(readFileSync(new URL('../data/models.json', import.meta.url)));
let seed = 20261009;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const SOURCES = ['示範平台 A', '示範平台 B', '示範平台 C'];
const end = Date.parse('2026-10-09T00:00:00Z');
const rows = [], retail = {};

for (const m of models) {
  const base = Math.round((40000 + rnd() * 400000) / 1000) * 1000;
  retail[m.id] = Math.round(base * (0.75 + rnd() * 0.5) / 1000) * 1000;
  let level = base, drift = (rnd() - 0.5) * 0.01;
  for (let wk = 26; wk >= 0; wk--) {
    level *= 1 + drift + (rnd() - 0.5) * 0.04;
    for (let k = 0; k < 2 + Math.floor(rnd() * 3); k++) {
      const date = new Date(end - (wk * 7 + Math.floor(rnd() * 7)) * 864e5).toISOString().slice(0, 10);
      const sold = rnd() < 0.45;
      const usd = rnd() < 0.3;
      const twd = level * (sold ? 0.95 + rnd() * 0.08 : 1.02 + rnd() * 0.15);
      rows.push({
        date, model: m.id, source: usd ? '示範平台 C' : SOURCES[Math.floor(rnd() * 2)],
        kind: sold ? 'sold' : 'ask', price: usd ? Math.round(twd / 32) : Math.round(twd / 100) * 100,
        currency: usd ? 'USD' : 'TWD', condition: ['全新', '近新', '良好'][Math.floor(rnd() * 3)], url: '', note: '示範（假資料）',
      });
    }
  }
}
rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
writeFileSync(new URL('../data/demo.csv', import.meta.url), toCSV(rows));
writeFileSync(new URL('../data/demo-retail.json', import.meta.url), JSON.stringify(retail, null, 1) + '\n');
console.log(`示範資料 ${rows.length} 筆，${weekOf(rows[0].date)} ～ ${rows.at(-1).date}`);
