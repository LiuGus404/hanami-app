# 趨勢模態框改進總結

## 修改概述

根據用戶需求，對能力趨勢模態框進行了兩項重要改進：
1. 將模態框背景改為透明
2. 使用真實資料顯示進度趨勢圖，而不是模擬資料

## 實現內容

### 1. 背景透明化
**檔案**: `src/components/ui/AbilityTrendModal.tsx`

#### 修改前
```typescript
className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
```

#### 修改後
```typescript
className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4"
```

**效果**: 模態框背景從半透明黑色改為完全透明，提供更清爽的視覺效果。

### 2. 真實資料 API
**檔案**: `src/app/api/ability-trend-data/route.ts`

#### API 功能
- **端點**: `/api/ability-trend-data`
- **參數**: 
  - `student_id`: 學生ID
  - `ability_id`: 能力ID
  - `days`: 資料天數（預設30天）

#### 資料處理邏輯
1. **載入評估記錄**: 從 `hanami_ability_assessments` 表獲取學生的所有評估記錄
2. **目標匹配**: 根據 `ability_id` 匹配對應的成長目標
3. **進度計算**: 從 `selected_goals` 中提取 `progress_level` 計算進度百分比
4. **資料格式化**: 將評估資料轉換為趨勢圖表所需的格式

#### 返回資料結構
```typescript
{
  success: boolean;
  data: Array<{
    date: string;           // 評估日期
    progress: number;       // 進度百分比
    level: number;          // 當前等級
    assessment_id?: string; // 評估記錄ID
    lesson_date?: string;   // 課程日期
    overall_rating?: number; // 總體評分
  }>;
  goal_info: {
    id: string;
    name: string;
    description: string;
    max_level: number;
    progress_contents: string[];
  };
}
```

### 3. 模態框組件改進
**檔案**: `src/components/ui/AbilityTrendModal.tsx`

#### 資料載入邏輯
```typescript
const loadTrendData = async () => {
  setLoading(true);
  try {
    const response = await fetch(
      `/api/ability-trend-data?student_id=${studentId}&ability_id=${ability?.id}&days=30`
    );
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        setTrendData(result.data);
      } else {
        // 錯誤處理：使用當前能力資料作為單一資料點
        setTrendData([{
          date: new Date().toISOString().split('T')[0],
          progress: ability?.progress || 0,
          level: ability?.level || 0
        }]);
      }
    }
  } catch (error) {
    // 錯誤處理：使用當前能力資料作為單一資料點
    setTrendData([{
      date: new Date().toISOString().split('T')[0],
      progress: ability?.progress || 0,
      level: ability?.level || 0
    }]);
  } finally {
    setLoading(false);
  }
};
```

#### 增強資料顯示
- **懸停提示**: 顯示進度百分比、等級和總體評分
- **錯誤處理**: 當 API 失敗時，使用當前能力資料作為備用顯示
- **動態提示框**: 根據是否有總體評分調整提示框大小

#### 介面更新
```typescript
interface TrendData {
  date: string;
  progress: number;
  level: number;
  assessment_id?: string;    // 新增
  lesson_date?: string;      // 新增
  overall_rating?: number;   // 新增
}
```

## 技術實現細節

### API 資料處理
1. **資料庫查詢**: 使用 Supabase 查詢評估記錄和目標資料
2. **資料轉換**: 將 `selected_goals` 中的 `progress_level` 轉換為進度百分比
3. **排序**: 按評估日期排序確保趨勢線正確
4. **限制**: 支援限制資料點數量（預設30天）

### 錯誤處理策略
1. **API 失敗**: 使用當前能力資料作為單一資料點
2. **資料缺失**: 生成基礎資料點確保圖表可顯示
3. **網路錯誤**: 優雅降級，顯示可用資料

### 視覺改進
1. **透明背景**: 提供更清爽的視覺效果
2. **增強提示**: 顯示更多評估相關資訊
3. **動態調整**: 根據資料內容調整 UI 元素大小

## 資料流程

### 修復前
```
用戶點擊能力 → 顯示模擬趨勢資料 → 固定資料點
```

### 修復後
```
用戶點擊能力 → 調用 API → 查詢真實評估記錄 → 計算進度趨勢 → 顯示真實資料
```

## 使用方式

### 基本使用
1. 用戶點擊能力評估點點
2. 模態框以透明背景顯示
3. 自動載入該能力的真實趨勢資料
4. 顯示互動式趨勢圖表

### API 調用範例
```typescript
const response = await fetch(
  `/api/ability-trend-data?student_id=${studentId}&ability_id=${abilityId}&days=30`
);
const result = await response.json();
```

## 效能優化

### 資料快取
- API 支援限制資料天數，避免載入過多歷史資料
- 錯誤處理確保即使 API 失敗也能顯示基本資訊

### 載入狀態
- 顯示載入動畫提升用戶體驗
- 非阻塞式載入，不影響其他功能

## 未來擴展

### 可能的改進
1. **資料快取**: 實現客戶端快取減少 API 調用
2. **更多時間範圍**: 支援週、月、年等不同時間範圍
3. **資料導出**: 支援將趨勢資料導出為圖片或 PDF
4. **比較功能**: 支援比較不同能力的趨勢
5. **預測功能**: 基於歷史資料預測未來趨勢

### 資料分析
- 可以基於真實資料進行更深入的學習分析
- 支援識別學習瓶頸和進步模式
- 提供個性化的學習建議

## 相關檔案

- `src/components/ui/AbilityTrendModal.tsx` - 模態框組件改進
- `src/app/api/ability-trend-data/route.ts` - 新增的趨勢資料 API
- `docs/trend-modal-improvements-summary.md` - 本總結文檔

## 測試建議

1. **功能測試**: 點擊不同能力，確認顯示真實趨勢資料
2. **錯誤處理測試**: 模擬 API 失敗，確認錯誤處理正常
3. **資料驗證**: 確認顯示的趨勢資料與資料庫中的評估記錄一致
4. **視覺測試**: 確認透明背景效果符合預期
5. **效能測試**: 確認大量資料載入時的效能表現

實現完成後，用戶可以查看基於真實評估資料的學習進度趨勢，提供更準確和有價值的學習分析。
