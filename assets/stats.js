// 純計算層：不碰 DOM、不連網路，瀏覽器和 Node 都能 import。

export const COLS = ['date', 'model', 'source', 'kind', 'price', 'currency', 'condition', 'url', 'note'];
export const KINDS = { ask: '掛價', sold: '成交' };
export const CONDITIONS = ['全新', '近新', '良好', '普通'];

export const isNum = x => typeof x === 'number' && isFinite(x);

// CSV：支援雙引號包住的欄位（裡面可以有逗號、換行、"" 代表一個 "）
export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter(r => r.some(v => v.trim() !== ''));
  if (!head) return [];
  return body.map(r => {
    const o = {};
    head.forEach((h, i) => { o[h.trim()] = (r[i] ?? '').trim(); });
    o.price = Number(o.price);
    return o;
  });
}

const esc = v => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
export const toCSVLine = r => COLS.map(k => esc(r[k])).join(',');
export const toCSV = rows => COLS.join(',') + '\n' + rows.map(toCSVLine).join('\n') + (rows.length ? '\n' : '');

// 一筆記錄是否可用；回傳錯誤訊息陣列（空 = 沒問題）
export function validate(r, fx = {}) {
  const e = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) e.push('日期格式要 YYYY-MM-DD');
  if (!r.model) e.push('沒有款式');
  if (!r.source) e.push('沒有來源平台');
  if (!(r.kind in KINDS)) e.push('種類要是 ask（掛價）或 sold（成交）');
  if (!isNum(r.price) || r.price <= 0) e.push('價格要是正數');
  if (!isNum(fx[r.currency])) e.push(`沒有 ${r.currency || '（空白）'} 的匯率`);
  return e;
}

export function median(arr) {
  const a = arr.filter(isNum).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export const toTWD = (r, fx) => (isNum(r.price) && isNum(fx[r.currency]) ? r.price * fx[r.currency] : null);

const DAY = 864e5;
const parseDay = s => Date.parse(s + 'T00:00:00Z');

// 某款式在 asOf 往前 days 天內的摘要（台幣）
export function summarize(rows, model, fx, { asOf, days = 90 } = {}) {
  const mine = rows.filter(r => r.model === model.id && isNum(toTWD(r, fx)));
  const end = asOf ? parseDay(asOf) : Math.max(0, ...mine.map(r => parseDay(r.date)).filter(isNum));
  const win = mine.filter(r => { const t = parseDay(r.date); return t <= end && t > end - days * DAY; });
  const pick = k => win.filter(r => r.kind === k).map(r => toTWD(r, fx));
  const sold = median(pick('sold')), ask = median(pick('ask'));
  const retail = isNum(model.retail_twd) ? model.retail_twd : null;
  return {
    sold, ask,
    nSold: pick('sold').length, nAsk: pick('ask').length,
    // 溢價率：二手成交中位數比專櫃價高（+）或低（−）多少
    premium: isNum(sold) && retail ? sold / retail - 1 : null,
    // 開價落差：賣家開價比實際成交高多少，越大代表「掛著賣不掉」的越多
    askGap: isNum(sold) && isNum(ask) && sold > 0 ? ask / sold - 1 : null,
    // 哪個平台現在掛得最便宜（只看視窗內的掛價）
    cheapest: win.filter(r => r.kind === 'ask')
      .reduce((b, r) => (b && toTWD(b, fx) <= toTWD(r, fx) ? b : r), null),
    last: win.length ? win.map(r => r.date).sort().at(-1) : null,
  };
}

// 週一當作一週的開始，回傳 YYYY-MM-DD
export function weekOf(dateStr) {
  const t = parseDay(dateStr);
  const dow = (new Date(t).getUTCDay() + 6) % 7;
  return new Date(t - dow * DAY).toISOString().slice(0, 10);
}

// 走勢：每週各種類的中位數（台幣），依週排序
export function weekly(rows, modelId, fx) {
  const m = new Map();
  for (const r of rows) {
    const v = r.model === modelId ? toTWD(r, fx) : null;
    if (!isNum(v)) continue;
    const w = weekOf(r.date);
    if (!m.has(w)) m.set(w, { week: w, ask: [], sold: [] });
    m.get(w)[r.kind]?.push(v);
  }
  return [...m.values()].sort((a, b) => (a.week < b.week ? -1 : 1))
    .map(w => ({ week: w.week, ask: median(w.ask), sold: median(w.sold), nAsk: w.ask.length, nSold: w.sold.length }));
}

// 自動排程：把一次搜尋到的一堆掛價縮成一筆（中位數），避免 CSV 被灌爆
export function aggregateListings(prices, { date, model, source, currency, url = '' }) {
  const ok = prices.filter(p => isNum(p) && p > 0);
  if (!ok.length) return null;
  return { date, model, source, kind: 'ask', price: Math.round(median(ok)), currency, condition: '', url, note: `自動 n=${ok.length} 中位數` };
}

// 同一天、同款、同來源、同種類的自動記錄只留一筆
export const rowKey = r => [r.date, r.model, r.source, r.kind].join('|');
