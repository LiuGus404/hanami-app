# Hanami Web 註冊系統說明

## 系統概述

這是一個完整的註冊和權限管理系統，支援管理員、教師和家長三種角色的註冊申請。系統採用審核制，所有註冊申請需要管理員審核通過後才能開通帳號。

## 功能特點

### 1. 多角色註冊
- **管理員**：系統管理員，擁有最高權限
- **教師**：教學人員，需要填寫教學背景和銀行資訊
- **家長**：學生家長，可以查看學生相關資訊

### 2. 審核流程
1. 用戶提交註冊申請
2. 管理員審核申請
3. 審核通過後自動創建帳號
4. 用戶使用臨時密碼登入

### 3. 安全機制
- 每個 email 只能申請一次
- 管理員權限驗證
- 臨時密碼機制
- 狀態追蹤

## 資料庫結構

### registration_requests 表
```sql
CREATE TABLE public.registration_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'parent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  additional_info jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  reviewed_by uuid NULL,
  reviewed_at timestamp with time zone NULL,
  rejection_reason text NULL,
  CONSTRAINT registration_requests_pkey PRIMARY KEY (id)
);
```

## 使用流程

### 1. 用戶註冊
1. 訪問 `/register` 頁面
2. 填寫基本資訊（姓名、email、電話）
3. 選擇註冊角色
4. 根據角色填寫額外資訊：
   - **教師**：教學背景、銀行帳號、地址、出生日期
   - **家長**：學生姓名、學生年齡
5. 提交申請

### 2. 管理員審核
1. 管理員登入後訪問 `/admin/registration-requests`
2. 查看所有註冊申請
3. 可以按狀態和角色篩選
4. 點擊「查看詳情」查看完整資訊
5. 選擇「通過」或「拒絕」
6. 如果拒絕，需要填寫拒絕原因

### 3. 帳號創建
- 當管理員點擊「通過」時，系統會：
  1. 生成隨機臨時密碼
  2. 創建 Supabase Auth 用戶
  3. 在對應資料表中創建記錄
  4. 顯示臨時密碼給管理員

### 4. 用戶登入
1. 用戶訪問 `/login` 頁面
2. 使用註冊時的 email 和臨時密碼登入
3. 系統會檢查申請狀態和帳號狀態
4. 根據角色重定向到相應儀表板

## 頁面說明

### 註冊頁面 (`/register`)
- 支援三種角色的註冊
- 動態表單，根據角色顯示不同欄位
- 表單驗證和錯誤處理
- 防止重複申請

### 登入頁面 (`/login`)
- 統一的登入介面
- 自動檢查申請狀態
- 根據角色重定向
- 錯誤訊息顯示

### 註冊申請管理 (`/admin/registration-requests`)
- 申請列表顯示
- 狀態和角色篩選
- 詳細資訊查看
- 審核操作
- 拒絕原因填寫

## API 端點

### POST `/api/auth/create-account`
創建用戶帳號的 API 端點

**請求參數：**
```json
{
  "requestId": "uuid",
  "password": "string"
}
```

**響應：**
```json
{
  "success": true,
  "message": "用戶帳號創建成功",
  "userId": "uuid"
}
```

## 安全注意事項

1. **權限控制**：只有管理員可以審核申請
2. **密碼安全**：使用隨機生成的臨時密碼
3. **資料驗證**：所有輸入都經過驗證
4. **狀態追蹤**：完整的審核記錄
5. **錯誤處理**：完善的錯誤處理機制

## 部署步驟

1. **執行 SQL 腳本**：
   ```bash
   # 在 Supabase 中執行 registration_requests_table.sql
   ```

2. **設置環境變數**：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **啟動應用**：
   ```bash
   npm run dev
   ```

## 常見問題

### Q: 用戶忘記密碼怎麼辦？
A: 管理員可以在註冊申請管理中重新生成密碼，或使用 Supabase 的密碼重置功能。

### Q: 如何修改用戶角色？
A: 需要管理員在對應的資料表中手動修改，或通過權限管理系統調整。

### Q: 申請被拒絕後可以重新申請嗎？
A: 可以，用戶可以使用相同的 email 重新提交申請。

### Q: 如何批量處理申請？
A: 目前系統支援單個處理，可以根據需求開發批量處理功能。

## 技術架構

- **前端**：Next.js 14 + TypeScript + Tailwind CSS
- **後端**：Supabase (PostgreSQL + Auth)
- **表單處理**：React Hook Form + Zod
- **狀態管理**：React Context
- **UI 元件**：自定義 Hanami 元件庫

## 維護指南

1. **定期備份**：定期備份 registration_requests 表
2. **監控日誌**：監控 API 調用和錯誤日誌
3. **更新權限**：定期檢查和更新 RLS 策略
4. **性能優化**：根據使用情況優化查詢和索引

## 聯繫支援

如有問題或需要協助，請聯繫技術團隊。 