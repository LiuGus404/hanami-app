# Hanami Web 資料庫權限設定說明

## 📋 概述

此文件說明如何為 Hanami Web 專案的班別和時段管理功能設定資料庫權限。

## 🎯 目標

設定 Supabase 的 Row Level Security (RLS) 政策，允許：
- ✅ 新增班別和時段
- ✅ 編輯班別和時段  
- ✅ 刪除班別和時段
- ✅ 查詢相關資料

## ⚠️ 重要：無限遞迴問題解決

如果遇到 `infinite recursion detected in policy for relation "hanami_user_permissions"` 錯誤：

### 緊急修復步驟：

1. **執行緊急修復腳本**
   ```sql
   -- 複製並執行 emergency_fix.sql 的內容
   ```

2. **測試功能**
   - 確認班別和時段管理功能恢復正常
   - 檢查課堂空缺情況是否正常顯示

3. **安全重啟 RLS** (可選)
   ```sql
   -- 複製並執行 restore_rls_safely.sql 的內容
   ```

## 📁 檔案說明

### 1. `emergency_fix.sql` (緊急修復)
- **用途**：解決無限遞迴錯誤
- **特點**：暫時禁用所有 RLS
- **適用場景**：遇到遞迴錯誤時使用

### 2. `restore_rls_safely.sql` (安全重啟)
- **用途**：安全地重新啟用 RLS
- **特點**：只為必要表啟用 RLS
- **適用場景**：緊急修復後使用

### 3. `simple_permissions.sql` (正常設定)
- **用途**：簡化版權限設定，適用於開發和測試
- **特點**：允許所有操作，設定簡單快速
- **適用場景**：開發環境、測試環境

### 4. `database_permissions.sql`
- **用途**：完整版權限設定，包含詳細政策
- **特點**：分離的 SELECT、INSERT、UPDATE、DELETE 政策
- **適用場景**：生產環境、需要精細控制

### 5. `check_and_remove_policies.sql`
- **用途**：檢查現有政策和移除政策
- **特點**：診斷和清理工具
- **適用場景**：故障排除、政策重置

## 🚀 快速開始

### 步驟 1：進入 Supabase 後台
1. 登入您的 Supabase 專案
2. 點擊左側選單的 **SQL Editor**
3. 點擊 **New Query**

### 步驟 2：執行權限設定
1. 複製 `simple_permissions.sql` 的內容
2. 貼上到 SQL Editor
3. 點擊 **Run** 執行

### 步驟 3：驗證設定
1. 執行 `check_and_remove_policies.sql` 中的檢查查詢
2. 確認政策已正確建立

## 🛠️ 故障排除

### 問題 1：無限遞迴錯誤
**錯誤訊息**：`infinite recursion detected in policy for relation "hanami_user_permissions"`

**解決方案**：
1. 立即執行 `emergency_fix.sql`
2. 測試功能是否恢復
3. 如需要，執行 `restore_rls_safely.sql`

### 問題 2：仍然出現 401 錯誤
**解決方案**：
1. 檢查 RLS 是否已啟用
2. 確認政策已正確建立
3. 重新整理應用程式頁面

### 問題 3：政策衝突
**解決方案**：
1. 使用 `check_and_remove_policies.sql` 檢查現有政策
2. 移除衝突的政策
3. 重新建立正確的政策

### 問題 4：權限不足
**解決方案**：
1. 確認 Supabase 專案設定
2. 檢查用戶認證狀態
3. 驗證資料表名稱是否正確

## 🔒 安全性考量

### 開發環境
- 使用 `simple_permissions.sql` 快速設定
- 允許所有操作以方便開發

### 生產環境
- 考慮使用更嚴格的權限控制
- 基於用戶角色或認證狀態
- 定期審查權限設定

## 📞 支援

如果遇到問題：
1. 檢查 Supabase 專案日誌
2. 查看瀏覽器 Console 錯誤訊息
3. 確認 SQL 語法是否正確
4. 聯繫技術支援

## 📝 注意事項

- ⚠️ 執行 SQL 前請備份資料
- ⚠️ 生產環境請謹慎設定權限
- ⚠️ 定期檢查和更新權限政策
- ✅ 建議先在測試環境驗證
- ⚠️ 遇到遞迴錯誤時立即使用緊急修復腳本 