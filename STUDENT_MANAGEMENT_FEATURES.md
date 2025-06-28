# 學生管理功能說明

## 概述
Hanami Web 教育管理系統的學生管理功能已更新，現在支持停用學生管理，並整合到現有的學生管理頁面中。

## 主要功能

### 1. 學生篩選功能
- **課程篩選**：鋼琴、音樂專注力、未分班、常規、試堂、停用學生
- **星期篩選**：星期一至星期日
- **堂數篩選**：全部、> 2、≤ 2、自訂數字
- **姓名搜尋**：即時搜尋學生姓名

### 2. 停用學生管理
- **停用功能**：選中學生後可停用，將學生資料移至 `inactive_student_list` 表
- **回復功能**：在停用學生篩選中選中學生後可回復，將學生資料移回原表
- **視覺區分**：停用學生顯示為灰色，帶有"已停用"標籤

### 3. 學生操作
- **刪除學生**：永久刪除學生資料（無法復原）
- **編輯學生**：點擊編輯圖標進入學生詳情頁面
- **批量操作**：支持多選學生進行批量操作
- **停用學生刪除**：在停用學生篩選中永久刪除停用學生
- **列表排序**：點擊欄目標題進行升序/降序排序

## 使用流程

### 停用學生
1. 在學生管理頁面選擇要停用的學生
2. 點擊"停用學生"按鈕
3. 確認操作
4. 學生將被移至停用列表，在常規篩選中不再顯示

### 查看停用學生
1. 在篩選課程中選擇"停用學生"
2. 系統將顯示所有停用的學生
3. 停用學生以灰色樣式顯示，帶有停用日期信息

### 回復學生
1. 在停用學生篩選中選擇要回復的學生
2. 點擊"回復學生"按鈕
3. 確認操作
4. 學生將被移回原表，恢復正常顯示

### 刪除停用學生
1. 在停用學生篩選中選擇要刪除的學生
2. 點擊"刪除學生"按鈕
3. 確認操作
4. 學生將被永久刪除，包括相關記錄和原始記錄

## 資料庫結構

### inactive_student_list 表
```sql
CREATE TABLE inactive_student_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  student_type TEXT NOT NULL CHECK (student_type IN ('regular', 'trial')),
  full_name TEXT,
  student_age INTEGER,
  student_preference TEXT,
  course_type TEXT,
  remaining_lessons INTEGER,
  regular_weekday INTEGER,
  gender TEXT,
  student_oid TEXT,
  contact_number TEXT,
  regular_timeslot TEXT,
  health_notes TEXT,
  lesson_date DATE,
  actual_timeslot TEXT,
  inactive_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inactive_reason TEXT DEFAULT '管理員停用',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 權限設置

### Supabase RLS 策略
- 讀取權限：允許所有已認證用戶讀取
- 插入權限：允許所有已認證用戶插入
- 更新權限：允許所有已認證用戶更新
- 刪除權限：允許所有已認證用戶刪除

### 表權限
```sql
GRANT ALL ON inactive_student_list TO authenticated;
GRANT ALL ON inactive_student_list TO service_role;
```

## 錯誤處理

### 常見錯誤及解決方案

#### 1. RLS 策略錯誤
**錯誤**：`ERROR: 42883: operator does not exist: text ->> unknown`
**解決方案**：使用 `simple_rls_setup.sql` 腳本重新設置

#### 2. 權限錯誤
**錯誤**：`permission denied for table inactive_student_list`
**解決方案**：執行權限授予 SQL 語句

#### 3. 表不存在錯誤
**錯誤**：`relation "inactive_student_list" does not exist`
**解決方案**：重新執行表創建腳本

## 測試指南

### 1. 功能測試
- [ ] 停用學生功能正常
- [ ] 停用學生在常規篩選中不顯示
- [ ] 停用學生篩選正常顯示
- [ ] 回復學生功能正常
- [ ] 刪除學生功能正常

### 2. 視覺測試
- [ ] 停用學生顯示灰色樣式
- [ ] 停用學生有"已停用"標籤
- [ ] 停用學生不顯示編輯按鈕
- [ ] 停用學生顯示停用日期

### 3. 資料完整性測試
- [ ] 停用後資料完整保存
- [ ] 回復後資料完整恢復
- [ ] 刪除後資料完全移除

## 部署注意事項

### 1. 資料庫設置
- 執行 `simple_rls_setup.sql` 創建表和設置權限
- 確認 RLS 策略正確設置
- 測試表權限是否正常

### 2. 應用程式部署
- 確認前端代碼已更新
- 測試所有功能正常運作
- 檢查錯誤處理是否完善

### 3. 用戶培訓
- 向管理員說明新功能
- 提供操作指南
- 設置適當的權限

## 維護指南

### 1. 定期檢查
- 檢查停用學生數量
- 確認資料庫性能
- 監控錯誤日誌

### 2. 備份策略
- 定期備份 `inactive_student_list` 表
- 保留重要操作日誌
- 設置資料恢復流程

### 3. 性能優化
- 監控查詢性能
- 優化索引設置
- 清理過期資料

## 聯繫支援

如有問題，請聯繫技術支援團隊：
- 檢查 Supabase 專案日誌
- 確認 SQL 語法正確性
- 驗證用戶權限設置

---
最後更新：2024-03-21 