# 學習路徑系統設置指南

## 概述

本指南將幫助您在 Hanami 系統中設置完整的學習路徑管理功能。學習路徑系統允許您為每個成長樹創建結構化的學習計劃，包含多個學習節點和進度追蹤。

## 系統架構

### 核心表結構

1. **`hanami_learning_paths`** - 學習路徑主表
   - 存儲學習路徑的基本信息
   - 與成長樹關聯
   - 支持多種路徑類型

2. **`hanami_learning_path_nodes`** - 學習路徑節點表
   - 定義路徑中的具體學習步驟
   - 支持多種節點類型（開始、活動、里程碑、結束）
   - 可與教學活動關聯

3. **`hanami_student_learning_progress`** - 學生學習進度表
   - 追蹤每個學生在每個節點的學習進度
   - 記錄完成狀態和表現評分

4. **`hanami_learning_path_templates`** - 學習路徑模板表
   - 提供預設的學習路徑模板
   - 可重複使用於不同的成長樹

## 設置步驟

### 第一步：執行資料庫遷移

1. **登入 Supabase 控制台**
   - 進入您的專案
   - 點擊左側菜單的 "SQL Editor"

2. **執行遷移腳本**
   ```sql
   -- 複製並執行 database/learning_paths_migration.sql 的內容
   ```

3. **驗證表創建**
   - 檢查左側菜單的 "Table Editor"
   - 確認以下表已創建：
     - `hanami_learning_paths`
     - `hanami_learning_path_nodes`
     - `hanami_student_learning_progress`
     - `hanami_learning_path_templates`

### 第二步：插入示例數據

1. **執行數據插入腳本**
   ```sql
   -- 複製並執行 database/insert_learning_paths_data.sql 的內容
   ```

2. **檢查數據插入結果**
   - 腳本會顯示創建的學習路徑和節點
   - 確認數據已正確插入

### 第三步：更新前端代碼

1. **更新類型定義**
   - 確認 `src/lib/database.types.ts` 已更新
   - 包含新的學習路徑表類型

2. **修改 GrowthTreePathManager 組件**
   - 使用新的學習路徑系統
   - 從資料庫載入學習路徑數據

## 學習路徑設計原則

### 節點類型

- **`start`** - 開始節點：學習旅程的起點
- **`activity`** - 活動節點：具體的學習活動
- **`milestone`** - 里程碑節點：檢查點或評估點
- **`break`** - 休息節點：學習間歇
- **`end`** - 結束節點：學習路徑的終點

### 節點順序

- 每個節點都有 `node_order` 欄位
- 節點按順序排列，形成線性學習路徑
- 支持前置條件檢查

### 活動關聯

- 節點可以與 `hanami_teaching_activities` 關聯
- 節點可以與 `hanami_tree_activities` 關聯
- 支持自定義活動內容

## 自定義學習路徑

### 創建新路徑

```sql
-- 插入新的學習路徑
INSERT INTO hanami_learning_paths (
  tree_id,
  path_name,
  path_description,
  path_type,
  difficulty_level,
  estimated_total_duration,
  is_active,
  is_default
) VALUES (
  'your-tree-id',
  '自定義路徑名稱',
  '路徑描述',
  'custom',
  2,
  180,
  true,
  false
);
```

### 添加節點

```sql
-- 插入路徑節點
INSERT INTO hanami_learning_path_nodes (
  path_id,
  node_order,
  node_type,
  title,
  description,
  duration,
  difficulty,
  is_required
) VALUES (
  'your-path-id',
  1,
  'start',
  '開始學習',
  '學習旅程的起點',
  0,
  1,
  true
);
```

## 進度追蹤

### 學生進度查詢

```sql
-- 使用預設函數查詢學生進度
SELECT * FROM get_student_learning_progress('student-id', 'path-id');
```

### 進度更新

```sql
-- 更新學生節點進度
UPDATE hanami_student_learning_progress
SET 
  status = 'completed',
  progress_percentage = 100,
  completed_at = NOW()
WHERE 
  student_id = 'student-id' 
  AND node_id = 'node-id';
```

## 常見問題

### Q: 如何為現有成長樹創建學習路徑？

A: 使用 `insert_learning_paths_data.sql` 腳本，或手動執行 SQL 語句創建路徑和節點。

### Q: 學習路徑可以有多個嗎？

A: 是的，每個成長樹可以有多個學習路徑，但建議設置一個為預設路徑。

### Q: 如何修改節點順序？

A: 更新 `hanami_learning_path_nodes` 表中的 `node_order` 欄位。

### Q: 支持循環學習路徑嗎？

A: 目前設計為線性路徑，但可以通過前置條件實現分支邏輯。

## 最佳實踐

1. **路徑設計**
   - 保持路徑簡潔，避免過多節點
   - 合理分配學習時長
   - 設置適當的難度等級

2. **節點設計**
   - 使用清晰的標題和描述
   - 設置合理的完成要求
   - 提供有吸引力的獎勵描述

3. **進度管理**
   - 定期檢查學生進度
   - 及時更新節點狀態
   - 記錄學習反饋

## 下一步

1. **測試學習路徑功能**
   - 創建測試路徑
   - 驗證進度追蹤
   - 檢查前端顯示

2. **優化用戶體驗**
   - 改進路徑視覺化
   - 添加進度指示器
   - 實現互動功能

3. **擴展功能**
   - 添加分支路徑支持
   - 實現自適應學習
   - 集成評估系統

## 技術支持

如果在設置過程中遇到問題，請：

1. 檢查 Supabase 控制台的錯誤日誌
2. 確認 SQL 腳本執行成功
3. 驗證表結構和數據完整性
4. 聯繫開發團隊獲取協助

---

**最後更新日期**: 2024-12-19  
**版本**: 1.0.0  
**維護者**: Hanami 開發團隊

