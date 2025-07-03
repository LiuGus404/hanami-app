# 學生管理功能部署指南

## 概述
本指南說明如何安全地部署 Hanami Web 教育管理系統的學生管理功能更新，特別是外鍵約束問題的修復。

## 部署前準備

### 1. 環境檢查
- [ ] 確認開發環境功能正常
- [ ] 確認測試環境功能正常
- [ ] 備份生產環境資料庫
- [ ] 檢查 Supabase 服務狀態

### 2. 資料庫備份
```sql
-- 在 Supabase SQL Editor 中執行備份
-- 備份學生相關表
SELECT * FROM "Hanami_Students" INTO OUTFILE 'hanami_students_backup.csv';
SELECT * FROM hanami_student_lesson INTO OUTFILE 'hanami_student_lesson_backup.csv';
SELECT * FROM hanami_student_progress INTO OUTFILE 'hanami_student_progress_backup.csv';
SELECT * FROM "Hanami_Student_Package" INTO OUTFILE 'hanami_student_package_backup.csv';
SELECT * FROM hanami_trial_queue INTO OUTFILE 'hanami_trial_queue_backup.csv';
SELECT * FROM inactive_student_list INTO OUTFILE 'inactive_student_list_backup.csv';
```

### 3. 代碼準備
- [ ] 代碼已通過所有測試
- [ ] 代碼審查完成
- [ ] 版本標籤已創建
- [ ] 部署分支已準備

## 部署步驟

### 階段 1：資料庫檢查和清理

#### 1.1 執行資料庫檢查腳本
```sql
-- 在 Supabase SQL Editor 中執行 database_foreign_key_check.sql
-- 檢查外鍵約束和孤立記錄
```

#### 1.2 清理孤立記錄
```sql
-- 清理 hanami_student_lesson 中的孤立記錄
DELETE FROM hanami_student_lesson 
WHERE student_id IS NOT NULL 
AND student_id NOT IN (SELECT id FROM "Hanami_Students");

-- 清理 hanami_student_progress 中的孤立記錄
DELETE FROM hanami_student_progress 
WHERE student_id IS NOT NULL 
AND student_id NOT IN (SELECT id FROM "Hanami_Students");

-- 清理 Hanami_Student_Package 中的孤立記錄
DELETE FROM "Hanami_Student_Package" 
WHERE student_id IS NOT NULL 
AND student_id NOT IN (SELECT id FROM "Hanami_Students");

-- 清理 hanami_trial_queue 中的孤立記錄
DELETE FROM hanami_trial_queue 
WHERE student_id IS NOT NULL 
AND student_id NOT IN (SELECT id FROM "Hanami_Students");
```

### 階段 2：代碼部署

#### 2.1 部署前端代碼
```bash
# 1. 切換到部署分支
git checkout deployment

# 2. 合併最新代碼
git merge main

# 3. 構建生產版本
npm run build

# 4. 部署到 Vercel
vercel --prod
```

#### 2.2 驗證部署
- [ ] 檢查網站是否正常載入
- [ ] 檢查學生管理頁面是否正常
- [ ] 檢查基本功能是否正常

### 階段 3：功能驗證

#### 3.1 基本功能測試
- [ ] 學生列表載入正常
- [ ] 篩選功能正常
- [ ] 搜尋功能正常
- [ ] 編輯功能正常

#### 3.2 停用功能測試
- [ ] 停用常規學生正常
- [ ] 停用試堂學生正常
- [ ] 查看停用學生正常
- [ ] 停用學生樣式正確

#### 3.3 回復功能測試
- [ ] 回復常規學生正常
- [ ] 回復試堂學生正常
- [ ] 學生資料完整性正確

#### 3.4 刪除功能測試
- [ ] 刪除無依賴學生正常
- [ ] 刪除有依賴學生正常
- [ ] 外鍵約束處理正確
- [ ] 錯誤處理正常

### 階段 4：性能和安全驗證

#### 4.1 性能測試
- [ ] 頁面載入時間 < 3秒
- [ ] 操作響應時間 < 1秒
- [ ] 批量操作時間 < 5秒

#### 4.2 安全測試
- [ ] 權限控制正常
- [ ] 輸入驗證正常
- [ ] 錯誤訊息安全

## 回滾計劃

### 1. 代碼回滾
```bash
# 如果前端代碼有問題，回滾到上一個版本
git checkout HEAD~1
npm run build
vercel --prod
```

### 2. 資料庫回滾
```sql
-- 如果資料庫操作有問題，恢復備份
-- 注意：這會丟失部署期間的資料變更

-- 恢復學生表
TRUNCATE TABLE "Hanami_Students";
COPY "Hanami_Students" FROM 'hanami_students_backup.csv';

-- 恢復其他相關表
TRUNCATE TABLE hanami_student_lesson;
COPY hanami_student_lesson FROM 'hanami_student_lesson_backup.csv';

-- 繼續恢復其他表...
```

### 3. 功能回滾
如果新功能有問題，可以暫時禁用相關功能：
```typescript
// 在學生管理頁面中暫時禁用刪除功能
const handleDeleteStudents = async () => {
  alert('刪除功能暫時停用，請聯繫管理員');
  return;
};
```

## 監控和維護

### 1. 錯誤監控
- [ ] 設置錯誤日誌監控
- [ ] 設置性能監控
- [ ] 設置用戶行為監控

### 2. 定期檢查
- [ ] 每日檢查錯誤日誌
- [ ] 每週檢查性能指標
- [ ] 每月檢查資料庫完整性

### 3. 備份策略
- [ ] 每日自動備份
- [ ] 每週完整備份
- [ ] 每月長期備份

## 用戶通知

### 1. 部署通知
```
標題：系統維護通知
內容：
親愛的用戶，
我們將於 [日期] [時間] 進行系統維護，屆時學生管理功能將暫時不可用。
維護時間預計為 30 分鐘。
感謝您的理解與支持。
```

### 2. 功能更新通知
```
標題：學生管理功能更新
內容：
我們已更新學生管理功能，現在支持：
- 更安全的學生刪除功能
- 改進的停用學生管理
- 更好的錯誤處理
如有問題，請聯繫技術支持。
```

## 聯繫信息

### 技術支持
- 郵箱：tech-support@hanami.com
- 電話：+852 1234 5678
- 緊急聯繫：+852 9876 5432

### 管理員聯繫
- 郵箱：admin@hanami.com
- 電話：+852 1111 2222

## 部署檢查清單

### 部署前
- [ ] 環境檢查完成
- [ ] 資料庫備份完成
- [ ] 代碼測試通過
- [ ] 用戶通知已發送

### 部署中
- [ ] 資料庫檢查完成
- [ ] 代碼部署完成
- [ ] 功能驗證通過
- [ ] 性能測試通過

### 部署後
- [ ] 監控設置完成
- [ ] 用戶通知已發送
- [ ] 文檔已更新
- [ ] 團隊培訓完成

## 常見問題

### 1. 部署失敗
**問題**：代碼部署失敗
**解決方案**：
1. 檢查構建錯誤
2. 檢查環境變數
3. 檢查依賴項

### 2. 功能異常
**問題**：部署後功能異常
**解決方案**：
1. 檢查瀏覽器控制台錯誤
2. 檢查網路請求
3. 檢查資料庫連接

### 3. 性能問題
**問題**：部署後性能下降
**解決方案**：
1. 檢查資料庫查詢
2. 檢查前端優化
3. 檢查快取設置

---

最後更新：2024-03-21
版本：1.0 