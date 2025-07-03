# 登入問題故障排除指南

## 🚨 問題描述

您遇到了以下錯誤：
- `帳號或密碼錯誤`
- `Failed to load resource: the server responded with a status of 403 ()`
- `Failed to load resource: the server responded with a status of 406 ()`

這些錯誤通常是由 Supabase 的 RLS (Row Level Security) 權限問題引起的。

## 🔧 解決方案

### 方案 1: 禁用 RLS（推薦，快速解決）

1. **在 Supabase SQL Editor 中執行以下腳本**：

```sql
-- 禁用登入相關表的 RLS
ALTER TABLE hanami_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_employee DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Hanami_Students" DISABLE ROW LEVEL SECURITY;

-- 設置表權限
GRANT ALL ON hanami_admin TO authenticated;
GRANT ALL ON hanami_employee TO authenticated;
GRANT ALL ON "Hanami_Students" TO authenticated;
GRANT ALL ON hanami_admin TO service_role;
GRANT ALL ON hanami_employee TO service_role;
GRANT ALL ON "Hanami_Students" TO service_role;
GRANT ALL ON hanami_admin TO anon;
GRANT ALL ON hanami_employee TO anon;
GRANT ALL ON "Hanami_Students" TO anon;
```

2. **或者直接執行 `disable_rls_for_login.sql` 文件**

### 方案 2: 設置正確的 RLS 策略

如果您想保持 RLS 啟用，請執行 `login_rls_policies.sql` 文件。

## 🧪 測試步驟

### 1. 檢查資料庫連接

在 Supabase SQL Editor 中執行：

```sql
-- 檢查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('hanami_admin', 'hanami_employee', 'Hanami_Students');

-- 檢查 RLS 狀態
SELECT 
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN 'RLS 已啟用' ELSE 'RLS 已禁用' END as status
FROM pg_tables 
WHERE tablename IN ('hanami_admin', 'hanami_employee', 'Hanami_Students');
```

### 2. 測試查詢

```sql
-- 測試管理員表
SELECT COUNT(*) FROM hanami_admin;

-- 測試老師表
SELECT COUNT(*) FROM hanami_employee;

-- 測試學生表
SELECT COUNT(*) FROM "Hanami_Students";
```

### 3. 檢查權限

```sql
-- 檢查表權限
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('hanami_admin', 'hanami_employee', 'Hanami_Students')
AND grantee IN ('authenticated', 'service_role', 'anon');
```

## 🔍 調試工具

### 1. 瀏覽器開發者工具

1. 打開瀏覽器開發者工具 (F12)
2. 切換到 Network 標籤
3. 嘗試登入
4. 查看失敗的請求詳情

### 2. 控制台調試

```javascript
// 檢查 Supabase 客戶端
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 測試資料庫連接
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
const supabase = createClientComponentClient();

// 測試查詢
supabase.from('hanami_admin').select('*').limit(1).then(console.log);
```

### 3. 使用測試頁面

訪問 `/admin/account-test` 頁面來測試資料庫連接和帳戶驗證。

## 📋 檢查清單

### 部署前檢查
- [ ] Supabase 專案設置正確
- [ ] 環境變數配置正確
- [ ] 資料庫表存在
- [ ] RLS 設置正確
- [ ] 表權限設置正確

### 功能測試
- [ ] 資料庫連接正常
- [ ] 查詢執行成功
- [ ] 登入驗證正常
- [ ] 用戶重定向正確
- [ ] 會話管理正常

## 🚀 常見問題解決

### 問題 1: 403 Forbidden
**原因**：RLS 策略阻止了查詢
**解決方案**：
```sql
-- 禁用 RLS 或設置正確的策略
ALTER TABLE hanami_admin DISABLE ROW LEVEL SECURITY;
```

### 問題 2: 406 Not Acceptable
**原因**：權限不足或表不存在
**解決方案**：
```sql
-- 授予權限
GRANT ALL ON hanami_admin TO authenticated;
GRANT ALL ON hanami_admin TO anon;
```

### 問題 3: 表不存在
**原因**：表名大小寫問題
**解決方案**：
```sql
-- 使用正確的表名（注意大小寫）
SELECT * FROM "Hanami_Students";  -- 注意引號
```

### 問題 4: 環境變數問題
**原因**：Supabase 配置不正確
**解決方案**：
1. 檢查 `.env.local` 文件
2. 確認 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 重新啟動開發服務器

## 📞 進一步支援

如果問題仍然存在，請：

1. **收集錯誤信息**：
   - 完整的錯誤訊息
   - 瀏覽器控制台日誌
   - Network 標籤中的失敗請求

2. **檢查 Supabase 設置**：
   - 專案設置
   - 資料庫設置
   - API 設置

3. **提供環境信息**：
   - 作業系統
   - Node.js 版本
   - Next.js 版本
   - Supabase 版本

## 🎯 預期結果

解決後，您應該能夠：

1. ✅ 正常訪問登入頁面
2. ✅ 使用資料庫中的帳戶登入
3. ✅ 成功重定向到對應的儀表板
4. ✅ 正常使用所有功能
5. ✅ 沒有 403/406 錯誤

## 🔒 安全注意事項

- 禁用 RLS 是一個臨時解決方案
- 在生產環境中，建議設置適當的 RLS 策略
- 定期檢查和更新安全設置
- 監控異常登入活動 