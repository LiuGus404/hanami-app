# 機構評論唯一約束修復說明

## 問題描述

原本的唯一約束 `CONSTRAINT hanami_org_reviews_unique UNIQUE (org_id, user_id)` 會阻止用戶在刪除評論後重新創建新評論，因為即使評論被標記為 `deleted`，唯一約束仍然存在。

## 解決方案

將唯一約束改為**部分唯一索引（Partial Unique Index）**，只對 `status = 'active'` 的記錄生效。這樣：

1. ✅ 每個用戶對每個機構只能有一個 `active` 狀態的評論
2. ✅ 用戶可以刪除評論（軟刪除，status 改為 `deleted`）
3. ✅ 用戶刪除評論後可以重新創建新評論（因為已刪除的評論不會觸發唯一約束）

## Migration 執行步驟

1. 連接到 Supabase 資料庫
2. 執行 `2025-01-23_fix_org_reviews_unique_constraint.sql` 文件

## 技術細節

### 部分唯一索引

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_hanami_org_reviews_unique_active 
ON public.hanami_org_reviews(org_id, user_id) 
WHERE status = 'active';
```

這個索引只對 `status = 'active'` 的記錄生效，確保：
- 每個用戶對每個機構只能有一個 `active` 狀態的評論
- 已刪除的評論（`status = 'deleted'`）不會觸發唯一約束
- 用戶可以刪除評論後重新創建

### API 邏輯

API 端點 `/api/organizations/review` 的 POST 方法已經實現了以下邏輯：

1. 檢查是否存在評論（包括已刪除的）
2. 如果存在，更新現有評論（包括恢復已刪除的評論）
3. 如果不存在，創建新評論

這確保了用戶體驗的一致性：
- 用戶刪除評論後，點擊「撰寫評論」會恢復舊評論而不是創建新的
- 用戶可以編輯現有評論
- 用戶可以刪除評論後重新創建

## 前端行為

前端組件 `OrgReviewSection` 的行為：

1. **用戶已有 active 評論**：顯示「編輯我的評論」按鈕
2. **用戶沒有評論或已刪除**：顯示「撰寫評論」按鈕
3. **提交評論時**：
   - 如果存在已刪除的評論，API 會自動恢復它
   - 如果不存在評論，API 會創建新評論

## 測試建議

1. **創建評論**：用戶 A 對機構 X 創建評論 ✅
2. **編輯評論**：用戶 A 編輯自己的評論 ✅
3. **刪除評論**：用戶 A 刪除自己的評論 ✅
4. **重新創建**：用戶 A 刪除評論後重新創建 ✅
5. **唯一性檢查**：用戶 A 嘗試對機構 X 創建第二個 active 評論（應該失敗）✅
6. **多用戶**：用戶 B 對機構 X 創建評論（應該成功）✅

## 注意事項

- 部分唯一索引只在 PostgreSQL 9.2+ 支援
- 索引只對 `status = 'active'` 的記錄生效
- 已刪除的評論（`status = 'deleted'`）不會觸發唯一約束
- 隱藏的評論（`status = 'hidden'`）也不會觸發唯一約束

