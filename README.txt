永康值班室｜超級工程版監視器覆蓋模型

檔案內容：
- index.html：主頁面
- styles.css：樣式
- main.js：3D 邏輯
- scene.glb：原始 3D 模型（由使用者提供）

用途：
- 顯示 3D 空間模型
- 顯示兩支攝影機位置
- 顯示 100° 覆蓋區
- 顯示值班桌近似位置
- 可在手機上旋轉、縮放

注意：
- 目前屬工程示意近似版，不是正式鑑定版
- 若要更精準，需補：
  1. 攝影機實際型號
  2. 精準安裝高度
  3. 鏡頭俯角
  4. 水平安裝位置尺寸

GitHub + Cloudflare Pages 快速上線：
1. 建立 GitHub repository
2. 把本資料夾四個檔案全部上傳
3. 到 Cloudflare Dashboard > Workers & Pages > Create application > Pages > Connect to Git
4. 選你的 repo
5. Framework preset 選 None
6. Build command 留空
7. Output directory 填 /
8. Deploy

部署完成後，把 Pages 網址貼到 LINE，就可以直接旋轉查看。
