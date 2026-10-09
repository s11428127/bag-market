# 這個 repo 的固定做法

使用者是電機系大二學生。這是精品包二手行情看盤，練功＋創業雛形。跟 `electronics`、`crypto` 完全獨立，不共用檔案。

- 一律繁體中文，語氣像學長：直接、具體。名詞中英並列（`中文<i>English</i>`）。
- 純前端、零相依、不加 build step。計算在 `assets/stats.js`（不碰 DOM），新計算要在 `test/` 加驗算。
- **掛價（ask）和成交（sold）永遠分開**，行情以成交為主。
- **不編價格。**專櫃價、行情沒查到就留 null；示範資料只能在 `?demo=1`，畫面要標「假資料」。
- 不爬沒有公開 API 的平台（違反使用條款）；自動抓價只走官方 API。
- 排程判斷有沒有變化用 `git status --porcelain`，不要用 `git diff`。
- canvas 顏色從 CSS 變數取，尺寸夾 `Math.max(0, …)`。
- 說做好之前：`npm test` + Playwright 320 / 390 / 680 / 1180 四種寬度（無 console 錯誤、無水平捲動）。
