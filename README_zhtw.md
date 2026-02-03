# Patch Hunk Editor (Git 補丁編輯器)

一個專為編輯 `.patch` 與 `.diff` 檔案設計的 GUI 工具，讓您能輕鬆地分割與管理 Git Hunks (程式碼區塊)。

## 功能特色

- **Hunk 分割 (Hunk Splitting)**: 透過選取特定行數，將大型的 Git Hunk 精確地分割成兩個獨立的區塊。
- **拖放開啟檔案 (Drag & Drop)**: 直接將 `.patch` 檔案拖入視窗即可開啟。
- **視覺化編輯**: 提供新增/刪除行的語法高亮顯示。
- **安全編輯**: 使用圖形介面修改 Patch，無需擔心破壞檔案格式。
- **防呆機制**: 關閉程式前若有未儲存的變更，會跳出提示詢問是否儲存，防止資料遺失。

## 安裝與開發

本專案使用 Electron + Vue 3 + Vite 建置。

### 前置需求
- Node.js (建議使用最新的 LTS 版本)
- npm 或 yarn

### 安裝依賴

```bash
npm install
# 或
yarn install
```

### 本地執行

```bash
npm run start
# 或
yarn run start
```

### 打包應用程式

```bash
npm run make
# 或
yarn run make
```

打包後的應用程式將位於 `out` 目錄中。

## 授權

MIT
