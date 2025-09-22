# 花見老師專區功能

## 功能概述

花見老師專區是一個專為教師設計的功能模組，通過跨資料庫查詢來驗證用戶的教師身份，並提供專門的教學管理工具。

## 快速開始

### 1. 環境變數配置

在 `.env.local` 文件中添加以下配置：

```bash
# 主資料庫配置 (hanami_employee 所在)
NEXT_PUBLIC_SUPABASE_URL=your_main_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_main_supabase_anon_key

# SAAS 系統資料庫配置 (saas_users 所在)
NEXT_PUBLIC_SUPABASE_SAAS_URL=your_saas_supabase_url
NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY=your_saas_supabase_anon_key
```

### 2. 測試功能

1. 訪問 `/aihome`
2. 登入系統
3. 如果您的 email 同時存在於兩個資料庫中，會看到「🎯 花見老師專區」選項
4. 點擊進入專區使用教師專用功能

### 3. 測試頁面

訪問 `/aihome/test-teacher-access` 可以：
- 測試任意 email 的教師權限
- 查看詳細的檢查結果
- 調試權限問題

## 功能特色

- ✅ 跨資料庫權限驗證
- ✅ 自動權限檢查
- ✅ 教師專用界面
- ✅ 課程管理功能
- ✅ 響應式設計
- ✅ 錯誤處理和用戶提示

## 頁面結構

```
/aihome
├── 主頁面 (自動檢查教師權限)
├── /teacher-zone (花見老師專區)
│   ├── 主頁面
│   └── /course-management (課程管理)
└── /test-teacher-access (權限測試頁面)
```

## 技術實現

- **API**: `/api/check-teacher-access` - 跨資料庫查詢
- **Hook**: `useTeacherAccess` - 權限管理
- **組件**: 響應式 UI 組件
- **動畫**: Framer Motion 動畫效果

## 故障排除

### 權限檢查失敗
1. 檢查環境變數配置
2. 確認兩個資料庫連接正常
3. 使用測試頁面調試

### 專區選項不顯示
1. 確認用戶已登入
2. 檢查 email 是否同時存在於兩個表
3. 查看瀏覽器控制台錯誤

## 開發指南

詳細的開發文檔請參考：`docs/teacher-zone-setup.md`

## 支援

如有問題，請檢查：
1. 環境變數配置
2. 資料庫連接
3. 測試頁面結果
4. 瀏覽器控制台日誌
