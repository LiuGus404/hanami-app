# 報名連結功能遷移指南

## 概述

此遷移為系統添加報名連結功能，允許管理員和教師為學生生成報名連結，客戶可以通過連結完成報名流程。

## 執行順序

### 第一步：創建表結構
**文件**: `2025-01-24_create_registration_links.sql`

**執行位置**: 舊 Supabase（`NEXT_PUBLIC_SUPABASE_URL`）

**內容**:
- 創建 `hanami_registration_links` 表
- 創建索引優化查詢
- 創建自動更新過期狀態的函數
- 創建觸發器自動設置過期時間（24小時）
- 創建自動清理過期連結的函數

**執行命令**:
```sql
-- 在 Supabase SQL Editor 中執行此文件的所有內容
```

### 第二步：添加 RLS 保護
**文件**: `2025-01-24_add_rls_registration_links.sql`

**執行位置**: 舊 Supabase（`NEXT_PUBLIC_SUPABASE_URL`）

**前置條件**:
- ✅ 已執行 `2025-01-20_create_hanami_org_identities.sql`
- ✅ 已執行 `2025-01-20_add_rls_policies.sql`（確保 RLS 輔助函數存在）
- ✅ 已執行 `2025-01-24_create_registration_links.sql`

**內容**:
- 啟用 RLS 保護
- 創建 SELECT 策略（組織成員查看、創建者查看）
- 創建 INSERT 策略（組織管理員創建）
- 創建 UPDATE 策略（組織管理員更新、創建者更新）
- 創建 DELETE 策略（組織管理員刪除、創建者刪除）

**執行命令**:
```sql
-- 在 Supabase SQL Editor 中執行此文件的所有內容
```

## RLS 策略說明

### SELECT 策略
1. **Users can view registration links in their orgs**
   - 允許組織成員查看自己組織的報名連結
   - 如果 `org_id` 為 NULL，允許所有已認證用戶查看（系統級連結）

2. **Users can view their own created links**
   - 允許創建者查看自己創建的報名連結
   - 即使創建者不在同一組織也可以查看

### INSERT 策略
1. **Admins can create registration links in their orgs**
   - 只允許組織管理員創建報名連結
   - 如果 `org_id` 為 NULL，允許所有已認證用戶創建（系統級連結）

### UPDATE 策略
1. **Admins can update registration links in their orgs**
   - 允許組織管理員更新自己組織的報名連結

2. **Creators can update their own links**
   - 允許創建者更新自己創建的報名連結

### DELETE 策略
1. **Admins can delete registration links in their orgs**
   - 允許組織管理員刪除自己組織的報名連結

2. **Creators can delete their own links**
   - 允許創建者刪除自己創建的報名連結

## 驗證步驟

執行完兩個腳本後，可以執行以下查詢驗證：

```sql
-- 檢查表是否創建
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'hanami_registration_links';

-- 檢查 RLS 是否啟用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'hanami_registration_links';

-- 檢查策略是否創建
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'hanami_registration_links';

-- 檢查函數是否創建
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'update_expired_registration_links',
  'set_registration_link_expiry',
  'cleanup_expired_registration_links'
);
```

## 注意事項

1. **API 使用 Service Role Key**
   - 前端 API 使用 `SUPABASE_SERVICE_ROLE_KEY`，會繞過 RLS
   - RLS 主要保護直接數據庫訪問
   - 這是正常的設計，因為 API 需要能夠創建和管理連結

2. **過期機制**
   - 連結創建時自動設置 24 小時後過期
   - 查詢時會自動更新過期狀態
   - 可以手動調用 `cleanup_expired_registration_links()` 清理過期超過 7 天的連結

3. **創建者驗證**
   - RLS 策略通過檢查 `created_by` 對應的用戶 email 來驗證創建者
   - 支持 `hanami_admin`、`hanami_employee` 和 `hanami_org_identities` 表

## 如果遇到錯誤

### 錯誤：relation "hanami_registration_links" does not exist
**原因**: 先執行了 RLS 策略腳本，但表尚未創建

**解決方案**: 先執行 `2025-01-24_create_registration_links.sql`

### 錯誤：function is_org_admin does not exist
**原因**: RLS 輔助函數尚未創建

**解決方案**: 先執行 `2025-01-20_add_rls_policies.sql`

### 錯誤：permission denied
**原因**: 當前用戶沒有足夠權限

**解決方案**: 確保使用 Supabase Dashboard 的 SQL Editor 執行，或使用具有足夠權限的數據庫用戶

## 相關文件

- `2025-01-24_create_registration_links.sql` - 表結構創建
- `2025-01-24_add_rls_registration_links.sql` - RLS 策略
- `src/app/api/registrations/links/route.ts` - API 路由
- `src/app/api/registrations/get-prefilled/route.ts` - 預填數據 API
- `src/app/api/registrations/links/complete/route.ts` - 完成連結 API


