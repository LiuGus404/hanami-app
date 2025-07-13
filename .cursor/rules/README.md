# Hanami Web 音樂教育管理系統

![Hanami Logo](public/icons/icon-512x512.png)

## 📖 專案概述

Hanami Web 是一個使用 Next.js 14 和 Supabase 建立的專業兒童音樂教育機構管理系統。專案採用現代化的技術棧，提供完整的教師、學生和課程資訊管理功能，專注於為音樂教育機構提供高效、易用的管理解決方案。

## ✨ 主要特色

- 🎨 **可愛設計風格** - 專為兒童音樂教育設計的溫暖櫻花色系 UI
- 📱 **響應式設計** - 完美支援桌面、平板和手機設備
- 🔐 **安全認證** - 基於 Supabase Auth 的多角色權限管理
- 📊 **完整管理功能** - 學生、教師、課程、排程全方位管理
- 🤖 **AI 工具整合** - 智能排程和課程計劃生成
- ⚡ **高性能** - Next.js 14 App Router + Turbopack 優化
- 📦 **PWA 支援** - 可安裝的漸進式網頁應用
- 🎯 **TypeScript** - 完整的型別安全保證

## 🛠 技術棧

### 前端技術
- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript 5
- **樣式**: Tailwind CSS 4.1.4
- **UI 組件**: Headless UI, Heroicons, Lucide React
- **動畫**: Framer Motion 12.10.5
- **表單**: React Hook Form + Zod 驗證
- **狀態管理**: React Context + Custom Hooks
- **通知**: React Hot Toast
- **PWA**: Next PWA

### 後端技術
- **資料庫**: Supabase (PostgreSQL)
- **認證**: Supabase Auth
- **API**: Next.js API Routes
- **即時通訊**: Supabase Realtime

## 🚀 快速開始

### 環境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安裝步驟

1. **克隆專案**
```bash
git clone https://github.com/your-username/hanami-web.git
cd hanami-web
```

2. **安裝依賴**
```bash
npm install
```

3. **環境配置**
```bash
# 複製環境變數範例
cp .env.example .env.local

# 編輯環境變數
# 填入你的 Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **資料庫設置**
```bash
# 生成資料庫型別
npm run db:generate-types

# 推送資料庫結構
npm run db:push
```

5. **啟動開發服務器**
```bash
npm run dev
```

6. **開啟瀏覽器**
訪問 [http://localhost:3000](http://localhost:3000)

## 📁 專案結構

```
hanami-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認證相關頁面
│   │   ├── admin/             # 管理員儀表板
│   │   ├── teacher/           # 教師儀表板
│   │   ├── parent/            # 家長儀表板
│   │   ├── api/               # API 路由
│   │   └── globals.css        # 全局樣式
│   ├── components/            # 可重用組件
│   │   ├── ui/               # 基礎 UI 組件
│   │   ├── admin/            # 管理員專用組件
│   │   └── forms/            # 表單組件
│   ├── lib/                  # 工具函數和配置
│   │   ├── supabase.ts       # Supabase 客戶端
│   │   ├── database.types.ts # 資料庫型別定義
│   │   └── utils.ts          # 通用工具
│   ├── hooks/                # 自定義 Hooks
│   └── types/                # TypeScript 型別定義
├── public/                   # 靜態資源
├── docs/                     # 文檔
└── tests/                    # 測試文件
```

## 🎨 設計系統

### 色彩系統
- **主要色**: `#FFD59A` (櫻花色)
- **次要色**: `#EBC9A4` (溫暖色)
- **強調色**: `#FFB6C1` (可愛粉色)
- **背景色**: `#FFF9F2` (溫暖背景)
- **文字色**: `#4B4036` (主要文字)

### 組件設計原則
1. **圓潤可愛** - 所有按鈕和卡片使用圓角設計
2. **漸層效果** - 使用溫暖的漸層背景
3. **柔和陰影** - 多層陰影營造立體感
4. **動畫互動** - 懸停和點擊時的微動畫
5. **響應式設計** - 移動優先的設計理念

## 📊 資料庫架構

### 核心資料表
- `hanami_employee` - 教師資料
- `Hanami_Students` - 學生資料
- `hanami_student_lesson` - 課程記錄
- `Hanami_Student_Package` - 課程包
- `hanami_trial_students` - 試聽學生
- `hanami_schedule` - 排程管理
- `hanami_lesson_plan` - 課程計劃
- `hanami_admin` - 管理員資料

## 🔧 開發命令

```bash
# 開發模式
npm run dev

# 構建生產版本
npm run build

# 啟動生產服務器
npm run start

# 代碼檢查
npm run lint
npm run lint:fix

# 型別檢查
npm run type-check

# 代碼格式化
npm run format
npm run format:check

# 測試
npm run test
npm run test:watch
npm run test:coverage

# 資料庫操作
npm run db:generate-types
npm run db:push
npm run db:reset
npm run db:migrate

# 清理構建文件
npm run clean
```

## 🧪 測試

專案使用 Jest 和 React Testing Library 進行測試：

```bash
# 運行所有測試
npm run test

# 監視模式
npm run test:watch

# 生成覆蓋率報告
npm run test:coverage
```

## 📦 部署

### Vercel 部署 (推薦)

1. 連接 GitHub 倉庫到 Vercel
2. 設置環境變數
3. 自動部署

### 其他平台

```bash
# 構建
npm run build

# 啟動
npm run start
```

## 🔐 環境變數

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 其他配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 代碼規範

- 使用 TypeScript 進行型別安全開發
- 遵循 ESLint 和 Prettier 配置
- 使用 Conventional Commits 提交訊息
- 編寫單元測試和整合測試

## 📄 授權

本專案採用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 📞 聯繫方式

- **專案維護者**: Hanami 開發團隊
- **郵箱**: [your-email@example.com]
- **網站**: [https://hanami-music.com]

## 🙏 致謝

感謝所有為這個專案做出貢獻的開發者和設計師。

---

**版本**: 2.0.0  
**最後更新**: 2024-12-19
