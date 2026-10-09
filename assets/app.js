import { bagArt } from './bags.js';
import { parseCSV, toCSV, toCSVLine, summarize, weekly, validate, toTWD, isNum, KINDS } from './stats.js';

const $ = s => document.querySelector(s);
const C = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const DEMO = new URLSearchParams(location.search).has('demo');
const LS = 'bag-market:pending';

const fmt = v => (isNum(v) ? Math.round(v).toLocaleString('zh-TW') : '—');
const pct = v => (isNum(v) ? (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%' : '—');
const cls = v => (isNum(v) ? (v >= 0 ? 'up' : 'down') : 'na');
const escHTML = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let models = [], fx = {}, base = [], rows = [], sel = null;

const loadPending = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; } };
const savePending = p => { try { localStorage.setItem(LS, JSON.stringify(p)); } catch {} };

async function load() {
  const get = async (p, as) => { const r = await fetch(p, { cache: 'no-store' }); if (!r.ok) throw new Error(p + ' ' + r.status); return r[as](); };
  const [m, f, csv] = await Promise.all([
    get('data/models.json', 'json'), get('data/fx.json', 'json'),
    get(DEMO ? 'data/demo.csv' : 'data/prices.csv', 'text'),
  ]);
  models = m.models; fx = f; base = parseCSV(csv);
  if (DEMO) {
    const retail = await get('data/demo-retail.json', 'json');
    models = models.map(x => ({ ...x, retail_twd: retail[x.id] ?? null }));
    $('#demoBar').hidden = false;
  }
}

function merge() { rows = DEMO ? base : base.concat(loadPending()); }
const asOf = () => rows.map(r => r.date).sort().at(-1);

function renderTable() {
  const days = +$('#days').value, end = asOf();
  $('#empty').hidden = rows.length > 0;
  $('#asof').textContent = end ? `資料到 ${end}` : '';
  const tb = $('#mkt tbody');
  tb.innerHTML = models.map(m => {
    const s = end ? summarize(rows, m, fx, { asOf: end, days }) : {};
    return `<tr data-id="${m.id}" class="${m.id === sel ? 'on' : ''}">
      <td class="l nm"><div class="nm-in">${bagArt(m)}<div><b>${escHTML(m.name)}</b><span>${escHTML(m.brand)}</span></div></div></td>
      <td>${fmt(s.sold)}<span class="sub">${s.nSold ? s.nSold + ' 筆' : ''}</span></td>
      <td>${fmt(s.ask)}<span class="sub">${s.nAsk ? s.nAsk + ' 筆' : ''}</span></td>
      <td class="retail">${fmt(m.retail_twd)}</td>
      <td class="${cls(s.premium)}">${pct(s.premium)}</td>
      <td class="spark"><canvas class="spark" data-id="${m.id}"></canvas></td>
    </tr>`;
  }).join('');
  tb.querySelectorAll('canvas.spark').forEach(cv => {
    if (getComputedStyle(cv).display === 'none') return;
    drawSpark(cv, weekly(rows, cv.dataset.id, fx).map(w => w.sold).filter(isNum));
  });
}

function setup(cv) {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, cv.clientWidth), h = Math.max(1, cv.clientHeight);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function drawSpark(cv, ys) {
  const { ctx, w, h } = setup(cv);
  if (ys.length < 2) { ctx.fillStyle = C('--mute'); ctx.font = '11px system-ui'; ctx.textAlign = 'right'; ctx.fillText('資料不足', w, h / 2 + 4); return; }
  const lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo || 1;
  ctx.strokeStyle = ys.at(-1) >= ys[0] ? C('--up') : C('--down'); ctx.lineWidth = 1.5; ctx.beginPath();
  ys.forEach((y, i) => { const X = 2 + (i / (ys.length - 1)) * Math.max(0, w - 4), Y = 3 + (1 - (y - lo) / span) * Math.max(0, h - 6); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();
}

function renderDetail() {
  const m = models.find(x => x.id === sel);
  $('#detail').hidden = !m;
  if (!m) return;
  const end = asOf(), days = +$('#days').value;
  const s = end ? summarize(rows, m, fx, { asOf: end, days }) : {};
  $('#dTitle').innerHTML = `${escHTML(m.name)}`;
  $('#dArt').innerHTML = bagArt(m, 'lg') + (m.img ? '' : '<span class="art-note">示意圖</span>');
  $('#dBrand').textContent = `${m.brand}・近 ${days} 天`;
  const ch = s.cheapest;
  const stat = (k, v, sub = '', c = '') => `<div class="stat"><div class="k">${k}</div><div class="v ${c}">${v}</div><div class="s">${sub}</div></div>`;
  $('#dStats').innerHTML =
    stat('成交中位 Sold', fmt(s.sold), `${s.nSold || 0} 筆`) +
    stat('掛價中位 Ask', fmt(s.ask), `${s.nAsk || 0} 筆`) +
    stat('溢價率 Premium', pct(s.premium), isNum(m.retail_twd) ? `專櫃 ${fmt(m.retail_twd)}` : '專櫃價還沒填', cls(s.premium)) +
    stat('開價落差 Ask gap', pct(s.askGap), '掛價比成交高多少') +
    stat('目前最便宜', ch ? fmt(toTWD(ch, fx)) : '—', ch ? `${escHTML(ch.source)}・${ch.date}` : '');
  drawChart($('#chart'), weekly(rows, m.id, fx), m.retail_twd);
  const rec = rows.filter(r => r.model === m.id).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12);
  $('#dRec tbody').innerHTML = rec.map(r => `<tr>
    <td class="l" title="${r.date}">${r.date.slice(5)}</td><td class="l">${r.url ? `<a href="${escHTML(r.url)}" target="_blank" rel="noopener">${escHTML(r.source)}</a>` : escHTML(r.source)}</td>
    <td class="l">${KINDS[r.kind] || r.kind}</td><td>${fmt(r.price)} ${escHTML(r.currency)}</td><td>${fmt(toTWD(r, fx))}</td><td class="l">${escHTML(r.condition)}</td>
  </tr>`).join('') || '<tr><td class="l na" colspan="6">還沒有記錄</td></tr>';
}

function drawChart(cv, ws, retail) {
  const { ctx, w, h } = setup(cv);
  const padL = 58, padR = 10, padT = 10, padB = 24;
  const pw = Math.max(0, w - padL - padR), ph = Math.max(0, h - padT - padB);
  const vals = ws.flatMap(x => [x.sold, x.ask]).concat(isNum(retail) ? [retail] : []).filter(isNum);
  ctx.font = '11px system-ui'; ctx.fillStyle = C('--mute');
  if (ws.length < 2 || !vals.length) { ctx.textAlign = 'center'; ctx.fillText('至少要兩週的記錄才畫得出走勢', w / 2, h / 2); return; }
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo) * 0.08 || hi * 0.05 || 1; lo -= pad; hi += pad;
  const X = i => padL + (i / (ws.length - 1)) * pw, Y = v => padT + (1 - (v - lo) / (hi - lo)) * ph;
  ctx.strokeStyle = C('--line'); ctx.lineWidth = 1; ctx.textAlign = 'right';
  for (let k = 0; k <= 4; k++) {
    const v = lo + (k / 4) * (hi - lo), y = Y(v);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
    ctx.fillText(Math.round(v).toLocaleString('zh-TW'), padL - 6, y + 4);
  }
  ctx.textAlign = 'center';
  const step = Math.max(1, Math.ceil(ws.length / Math.max(1, Math.floor(pw / 70))));
  ws.forEach((x, i) => { if (i % step && i !== ws.length - 1) return; const tw = ctx.measureText(x.week.slice(5)).width / 2; ctx.fillText(x.week.slice(5), Math.min(Math.max(X(i), tw), w - tw), h - 6); });
  if (isNum(retail)) {
    ctx.strokeStyle = C('--retail'); ctx.setLineDash([5, 4]); ctx.beginPath();
    ctx.moveTo(padL, Y(retail)); ctx.lineTo(padL + pw, Y(retail)); ctx.stroke(); ctx.setLineDash([]);
  }
  const line = (key, color, wd) => {
    ctx.strokeStyle = color; ctx.lineWidth = wd; ctx.beginPath(); let on = false;
    ws.forEach((x, i) => { if (!isNum(x[key])) return; on ? ctx.lineTo(X(i), Y(x[key])) : ctx.moveTo(X(i), Y(x[key])); on = true; });
    ctx.stroke();
  };
  line('ask', C('--ask'), 1.5);
  line('sold', C('--accent'), 2.2);
}

function renderPending() {
  const p = loadPending();
  $('#pending').hidden = DEMO || !p.length;
  $('#pN').textContent = p.length;
  $('#pText').textContent = p.map(toCSVLine).join('\n');
}

function setupForm() {
  $('#fModel').innerHTML = models.map(m => `<option value="${m.id}">${escHTML(m.brand)}・${escHTML(m.name)}</option>`).join('');
  $('#fCur').innerHTML = Object.keys(fx).filter(k => isNum(fx[k])).map(k => `<option>${k}</option>`).join('');
  const f = $('#form');
  f.date.value = new Date().toISOString().slice(0, 10);
  $('#srcList').innerHTML = [...new Set(rows.map(r => r.source).concat(['Vestiaire Collective', 'The RealReal', 'Fashionphile', 'Rebag', 'eBay', '旋轉拍賣', '二手精品店']))]
    .map(s => `<option value="${escHTML(s)}">`).join('');
  f.addEventListener('submit', e => {
    e.preventDefault();
    const r = Object.fromEntries(new FormData(f));
    r.price = Number(r.price);
    const msg = $('#fMsg');
    if (DEMO) { msg.className = 'msg err'; msg.textContent = '示範模式不能記錄，請回真實資料'; return; }
    const err = validate(r, fx);
    if (err.length) { msg.className = 'msg err'; msg.textContent = err.join('；'); return; }
    const p = loadPending(); p.push(r); savePending(p);
    msg.className = 'msg ok'; msg.textContent = '已加入，記得匯出';
    f.price.value = ''; f.url.value = ''; f.note.value = '';
    sel = r.model; refresh();
  });
  $('#pCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#pText').textContent); $('#pCopy').textContent = '已複製'; }
    catch { $('#pCopy').textContent = '複製失敗，請手動選取'; }
  });
  $('#pDl').addEventListener('click', () => {
    const all = base.concat(loadPending()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toCSV(all)], { type: 'text/csv' }));
    a.download = 'prices.csv'; a.click(); URL.revokeObjectURL(a.href);
  });
  $('#pClear').addEventListener('click', () => { if (confirm('清空這台裝置上還沒匯出的記錄？')) { savePending([]); refresh(); } });
}

function refresh() { merge(); renderTable(); renderDetail(); renderPending(); }

async function main() {
  try { await load(); }
  catch (e) { $('main').innerHTML = `<section class="panel empty">資料載入失敗：${escHTML(e.message)}</section>`; return; }
  merge();
  sel = DEMO ? models[0]?.id : null;
  setupForm();
  $('#mkt tbody').addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (!tr) return; sel = tr.dataset.id; renderTable(); renderDetail(); $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#days').addEventListener('change', () => { renderTable(); renderDetail(); });
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { renderTable(); renderDetail(); }, 150); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { renderTable(); renderDetail(); });
  refresh();
}
main();
