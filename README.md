# 包包行情 Bag Market

精品包二手行情看盤：每款包的**成交中位數、掛價中位數、溢價率（二手 ÷ 專櫃 − 1）、每週走勢、哪個平台目前最便宜**。
練功作品，同時是創業的第一步：先把「值多少」做可信，再談比價和投資。

## 怎麼用

```bash
npm test          # 計算層驗算
npm run serve     # http://localhost:8099 ；加 ?demo=1 看示範（亂數假資料）
```

## 資料

| 檔案 | 內容 |
|---|---|
| `data/models.json` | 追蹤的 15 款包；`retail_twd` 專櫃價還沒填（請以專櫃當下報價為準） |
| `data/prices.csv` | 價格記錄，一列一筆 |
| `data/fx.json` | 換台幣的匯率（暫定值，請更新） |
| `data/demo.csv` | **假資料**，只給示範模式用（`npm run demo` 重新產生） |

`prices.csv` 欄位：`date, model, source, kind, price, currency, condition, url, note`
- `kind`：`sold` = 成交（真的賣掉），`ask` = 掛價（賣家開價）。**一定要分清楚**，兩者常差一成以上。
- 手動記：網頁下方「記一筆」→ 存在瀏覽器 →「下載合併後的 prices.csv」覆蓋 `data/prices.csv` 後 commit。

## 自動排程

`.github/workflows/fetch.yml` 每週一跑 `scripts/fetch-ebay.mjs`：用 eBay 官方 Browse API 搜每款「目前在賣」的價格，縮成一筆中位數寫進 CSV。
- 要先申請 eBay 開發者帳號，把金鑰放進 repo 的 Secrets：`EBAY_CLIENT_ID`、`EBAY_CLIENT_SECRET`。沒設就自動跳過。
- eBay 的 Buy API 正式環境可能要額外申請核准，請以 eBay 開發者後台顯示為準。
- 只抓得到**掛價**、抓不到成交價；搜尋結果會混到配件、仿品、別的尺寸，只能當參考。
- 其他二手平台（Vestiaire、The RealReal、Fashionphile…）沒有公開 API，爬網頁違反使用條款，**不做**。

## 結構

- `assets/stats.js` 純計算（CSV、中位數、換匯、溢價率、週走勢），瀏覽器和 Node 共用，`test/` 有驗算
- `assets/app.js` / `app.css` / `index.html` 畫面，零相依、不用 build
