import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, toCSV, median, summarize, weekOf, weekly, validate, aggregateListings, rowKey } from '../assets/stats.js';

const fx = { TWD: 1, USD: 30 };
const model = { id: 'm1', retail_twd: 100000 };

test('CSV 來回轉換：引號、逗號、換行都保留', () => {
  const rows = [{ date: '2026-10-01', model: 'm1', source: 'A, B', kind: 'sold', price: 5, currency: 'TWD', condition: '近新', url: '', note: '他說 "很新"\n第二行' }];
  const back = parseCSV(toCSV(rows));
  assert.deepEqual(back, rows);
});

test('CSV 支援 CRLF 與空行', () => {
  const r = parseCSV('date,model,price\r\n2026-01-01,m1,10\r\n\r\n');
  assert.equal(r.length, 1);
  assert.equal(r[0].price, 10);
});

test('中位數：奇數、偶數、空、忽略非數字', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([]), null);
  assert.equal(median([null, NaN, 5]), 5);
});

test('週的開始是週一', () => {
  assert.equal(weekOf('2026-10-09'), '2026-10-05'); // 週五
  assert.equal(weekOf('2026-10-05'), '2026-10-05'); // 週一
  assert.equal(weekOf('2026-10-11'), '2026-10-05'); // 週日
});

test('摘要：換匯、溢價率、開價落差、最便宜平台、時間視窗', () => {
  const rows = [
    { date: '2026-10-01', model: 'm1', source: 'X', kind: 'sold', price: 4000, currency: 'USD' }, // 120000
    { date: '2026-10-02', model: 'm1', source: 'Y', kind: 'sold', price: 110000, currency: 'TWD' },
    { date: '2026-10-03', model: 'm1', source: 'Y', kind: 'ask', price: 150000, currency: 'TWD' },
    { date: '2026-10-03', model: 'm1', source: 'X', kind: 'ask', price: 4500, currency: 'USD' }, // 135000
    { date: '2026-01-01', model: 'm1', source: 'Z', kind: 'sold', price: 1, currency: 'TWD' }, // 視窗外
    { date: '2026-10-03', model: 'm2', source: 'Z', kind: 'sold', price: 1, currency: 'TWD' }, // 別款
    { date: '2026-10-03', model: 'm1', source: 'Z', kind: 'sold', price: 1, currency: 'GBP' }, // 沒匯率
  ];
  const s = summarize(rows, model, fx, { asOf: '2026-10-09', days: 90 });
  assert.equal(s.sold, 115000);
  assert.equal(s.ask, 142500);
  assert.equal(s.nSold, 2);
  assert.ok(Math.abs(s.premium - 0.15) < 1e-12);
  assert.ok(Math.abs(s.askGap - (142500 / 115000 - 1)) < 1e-12);
  assert.equal(s.cheapest.source, 'X');
  assert.equal(s.last, '2026-10-03');
});

test('摘要：沒有專櫃價就不算溢價率；沒資料全是 null', () => {
  const s = summarize([], { id: 'm1', retail_twd: null }, fx, { asOf: '2026-10-09' });
  assert.equal(s.sold, null);
  assert.equal(s.premium, null);
  assert.equal(s.askGap, null);
  assert.equal(s.cheapest, null);
});

test('週走勢：分週、分種類取中位數並排序', () => {
  const rows = [
    { date: '2026-10-08', model: 'm1', kind: 'sold', price: 10, currency: 'TWD' },
    { date: '2026-10-06', model: 'm1', kind: 'sold', price: 20, currency: 'TWD' },
    { date: '2026-09-29', model: 'm1', kind: 'ask', price: 30, currency: 'TWD' },
  ];
  const w = weekly(rows, 'm1', fx);
  assert.deepEqual(w.map(x => x.week), ['2026-09-28', '2026-10-05']);
  assert.equal(w[1].sold, 15);
  assert.equal(w[0].ask, 30);
  assert.equal(w[0].sold, null);
});

test('驗證：抓出錯誤欄位', () => {
  const ok = { date: '2026-10-01', model: 'm1', source: 'X', kind: 'sold', price: 1, currency: 'TWD' };
  assert.deepEqual(validate(ok, fx), []);
  assert.equal(validate({ ...ok, date: '10/1' }, fx).length, 1);
  assert.equal(validate({ ...ok, kind: 'buy' }, fx).length, 1);
  assert.equal(validate({ ...ok, price: NaN }, fx).length, 1);
  assert.equal(validate({ ...ok, currency: 'GBP' }, fx).length, 1);
});

test('自動排程：一次搜尋縮成一筆中位數，沒結果回 null', () => {
  const r = aggregateListings([100, 300, 200, -5, null], { date: '2026-10-09', model: 'm1', source: 'eBay', currency: 'USD' });
  assert.equal(r.price, 200);
  assert.equal(r.kind, 'ask');
  assert.match(r.note, /n=3/);
  assert.equal(aggregateListings([], { date: 'd', model: 'm', source: 's', currency: 'USD' }), null);
  assert.equal(rowKey(r), '2026-10-09|m1|eBay|ask');
});
