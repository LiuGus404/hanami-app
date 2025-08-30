# 評估記錄版本兼容性處理指南

## 問題背景

當成長樹的評估項目結構發生變化時（例如：項目數量變更、評估模式調整、等級數量修改等），舊的評估記錄可能會因為資料結構不匹配而無法正確顯示。這是一個常見的資料版本控制問題。

## 解決方案概述

我們提供了一套完整的版本兼容性處理系統，包括：

1. **自動檢測**：識別所有受影響的評估記錄
2. **智能修復**：自動調整資料結構以適應新的成長樹配置
3. **視覺化警告**：在界面上清楚標示兼容性問題
4. **詳細記錄**：追蹤所有變更和處理過程
5. **管理工具**：專門的管理頁面來處理兼容性問題

## 功能特性

### 1. 自動版本兼容性處理

系統會自動檢測並處理以下類型的兼容性問題：

- **目標已刪除**：評估記錄中的目標已從成長樹中移除
- **等級數量變更**：多選模式的等級數量發生變化
- **最大等級調整**：進度模式的最大等級發生變化
- **評估模式變更**：目標的評估模式從進度模式改為多選模式（或反之）

### 2. 智能資料修復

- **自動過濾**：移除已不存在的等級選項
- **等級調整**：自動調整等級以適應新的最大值
- **模式轉換**：處理評估模式變更的資料轉換
- **資料保留**：保留原始資料以供參考

### 3. 視覺化警告系統

在評估記錄顯示時，系統會顯示清晰的警告標籤：

- 🔴 **已移除**：目標已從成長樹中移除
- 🟠 **等級已變更**：等級數量發生變化
- 🟡 **等級已調整**：最大等級發生調整
- 🔵 **模式已變更**：評估模式發生變化

## 使用方法

### 1. 資料庫遷移

首先執行資料庫遷移腳本來創建必要的表和函數：

```sql
-- 執行遷移腳本
\i database/migration_assessment_compatibility.sql
```

### 2. 檢測兼容性問題

在管理頁面中點擊「檢測問題」按鈕，系統會自動掃描所有評估記錄並識別兼容性問題。

### 3. 自動修復

點擊「自動修復」按鈕，系統會自動處理所有檢測到的兼容性問題：

- 過濾掉不存在的等級
- 調整等級以適應新的最大值
- 更新評估模式
- 保留原始資料以供參考

### 4. 手動處理

對於需要人工審查的問題，可以：

- 查看詳細資訊
- 手動標記為已解決
- 添加解決備註

## 管理頁面功能

### 訪問路徑
```
/admin/assessment-compatibility
```

### 主要功能

1. **摘要統計**
   - 受影響的成長樹數量
   - 總問題數
   - 已解決問題數
   - 待處理問題數

2. **問題檢測**
   - 自動掃描所有評估記錄
   - 識別兼容性問題
   - 生成詳細報告

3. **自動修復**
   - 批量處理兼容性問題
   - 智能資料調整
   - 保留原始資料

4. **篩選和查看**
   - 按狀態篩選（已解決/未解決）
   - 按問題類型篩選
   - 查看詳細資訊

5. **問題管理**
   - 手動標記為已解決
   - 添加解決備註
   - 追蹤處理歷史

## 技術實現

### 1. 資料庫結構

```sql
-- 兼容性問題記錄表
CREATE TABLE hanami_assessment_compatibility_logs (
  id UUID PRIMARY KEY,
  assessment_id UUID REFERENCES hanami_ability_assessments(id),
  tree_id UUID REFERENCES hanami_growth_trees(id),
  issue_type TEXT CHECK (issue_type IN ('deleted_goal', 'level_count_changed', 'max_level_changed', 'assessment_mode_changed')),
  goal_id UUID,
  goal_name TEXT,
  original_data JSONB,
  current_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT
);
```

### 2. 核心函數

- `detect_assessment_compatibility_issues()`: 檢測兼容性問題
- `auto_fix_assessment_compatibility()`: 自動修復問題
- `log_assessment_compatibility_issue()`: 記錄問題變更

### 3. 觸發器

當成長樹目標發生變更時，自動記錄相關的兼容性問題：

```sql
CREATE TRIGGER trigger_log_assessment_compatibility
  AFTER UPDATE OR DELETE ON hanami_growth_goals
  FOR EACH ROW
  EXECUTE FUNCTION log_assessment_compatibility_issue();
```

## 最佳實踐

### 1. 定期檢查

建議定期檢查兼容性問題，特別是在以下情況：

- 更新成長樹結構後
- 大量修改評估項目後
- 系統維護期間

### 2. 備份資料

在執行自動修復前，建議先備份相關資料：

```sql
-- 備份評估記錄
CREATE TABLE hanami_ability_assessments_backup AS 
SELECT * FROM hanami_ability_assessments;
```

### 3. 測試環境

在生產環境執行前，建議先在測試環境中驗證：

1. 在測試環境中執行遷移腳本
2. 測試檢測和修復功能
3. 驗證資料完整性
4. 確認用戶界面顯示正常

### 4. 監控和維護

- 定期查看兼容性摘要報告
- 清理已解決的舊日誌記錄
- 監控系統效能影響

## 故障排除

### 常見問題

1. **檢測函數執行失敗**
   - 檢查資料庫權限
   - 確認表結構正確
   - 查看錯誤日誌

2. **修復後資料不正確**
   - 檢查原始資料備份
   - 驗證修復邏輯
   - 手動調整問題記錄

3. **界面顯示異常**
   - 清除瀏覽器快取
   - 檢查 JavaScript 錯誤
   - 確認 API 端點正常

### 支援和維護

如果遇到問題，請：

1. 查看瀏覽器控制台錯誤
2. 檢查資料庫日誌
3. 聯繫技術支援團隊

## 更新日誌

### v1.0.0 (2024-12-19)
- 初始版本發布
- 支援基本的兼容性檢測和修復
- 提供管理界面
- 實現自動觸發器

### 未來計劃
- 支援更複雜的資料轉換
- 提供更詳細的變更歷史
- 實現批量匯出功能
- 添加更多自訂選項
