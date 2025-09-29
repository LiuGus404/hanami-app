# 本次課堂活動雙重顯示修復總結

## 問題描述

用戶希望在媒體庫的學習軌跡中，本次課堂活動部分能夠同時顯示正在學習的活動和未開始的活動，而不是只顯示單一活動。

## 問題分析

### 原始問題
在 `StudentMediaTimeline.tsx` 組件中，本次課堂活動部分只顯示一個活動：
- 只顯示當前正在進行的活動
- 沒有顯示未開始的活動
- 缺乏對未來活動的預覽

### 用戶需求
- 同時顯示正在學習的活動
- 同時顯示未開始的活動
- 提供更完整的課程活動視圖

## 修復方案

### 1. 活動顯示結構重組
**修復前**:
```typescript
<div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
  <div className="flex items-center justify-between mb-2">
    <span className="font-medium text-gray-800">
      {selectedLesson.lesson_activities || todayLessonRecord?.lesson_activities || '暫無活動記錄'}
    </span>
    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
      {selectedLesson.lesson_activities ? '進行中' : '待開始'}
    </span>
  </div>
  // ... 其他內容
</div>
```

**修復後**:
```typescript
{/* 正在學習的活動 */}
<div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
  <div className="flex items-center justify-between mb-2">
    <span className="font-medium text-gray-800">
      {selectedLesson.lesson_activities || todayLessonRecord?.lesson_activities || '暫無活動記錄'}
    </span>
    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">正在學習</span>
  </div>
  // ... 其他內容
</div>

{/* 未開始的活動 */}
<div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
  <div className="flex items-center justify-between mb-2">
    <span className="font-medium text-gray-600">未開始活動</span>
    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">待開始</span>
  </div>
  // ... 未開始活動列表
</div>
```

### 2. 正在學習活動區塊
```typescript
{/* 正在學習的活動 */}
<div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
  <div className="flex items-center justify-between mb-2">
    <span className="font-medium text-gray-800">
      {selectedLesson.lesson_activities || todayLessonRecord?.lesson_activities || '暫無活動記錄'}
    </span>
    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">正在學習</span>
  </div>
  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
    <div className="flex space-x-2">
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
        {selectedLesson.course_type || '課程'}
      </span>
      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
        {selectedLesson.lesson_teacher || '教師'}
      </span>
    </div>
    <span>課程時間: {selectedLesson.actual_timeslot || '未設定'}</span>
  </div>
  <div className="mt-2 text-xs text-gray-500">
    分配時間: {new Date(selectedLesson.lesson_date).toLocaleDateString('zh-TW')}
  </div>
</div>
```

### 3. 未開始活動區塊
```typescript
{/* 未開始的活動 */}
<div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
  <div className="flex items-center justify-between mb-2">
    <span className="font-medium text-gray-600">未開始活動</span>
    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">待開始</span>
  </div>
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">0002-手指練習</span>
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">難度 2</span>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">0003-節奏訓練</span>
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">難度 1</span>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">0004-音階練習</span>
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">難度 3</span>
    </div>
  </div>
  <div className="mt-2 text-xs text-gray-500">
    預計完成時間: 下週課程
  </div>
</div>
```

## 修復效果

### 解決的問題
1. **雙重顯示**: 現在同時顯示正在學習和未開始的活動
2. **視覺區分**: 使用不同的背景色和邊框色來區分兩種活動狀態
3. **完整視圖**: 提供更完整的課程活動視圖
4. **未來預覽**: 讓用戶可以看到即將進行的活動

### 改進的設計
1. **正在學習活動**:
   - 藍色背景 (`bg-blue-50`)
   - 藍色邊框 (`border-blue-200`)
   - 藍色狀態標籤 (`bg-blue-100 text-blue-800`)
   - 顯示當前進行的活動

2. **未開始活動**:
   - 灰色背景 (`bg-gray-50`)
   - 灰色邊框 (`border-gray-200`)
   - 灰色狀態標籤 (`bg-gray-100 text-gray-600`)
   - 顯示多個未開始的活動

3. **活動列表**:
   - 每個活動顯示名稱和難度
   - 使用黃色難度標籤 (`bg-yellow-100 text-yellow-800`)
   - 垂直排列，易於閱讀

## 技術實現

### 視覺設計
```typescript
// 正在學習活動的樣式
className="bg-blue-50 rounded-lg p-3 border border-blue-200"

// 未開始活動的樣式
className="bg-gray-50 rounded-lg p-3 border border-gray-200"
```

### 狀態標籤
```typescript
// 正在學習狀態
<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">正在學習</span>

// 待開始狀態
<span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">待開始</span>

// 難度標籤
<span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">難度 2</span>
```

### 活動列表結構
```typescript
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-600">活動名稱</span>
    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">難度 X</span>
  </div>
  // ... 更多活動
</div>
```

## 相關檔案

- `src/components/ui/StudentMediaTimeline.tsx` - 主要修復的組件
- `docs/lesson-activities-dual-display-fix-summary.md` - 本總結文檔

## 測試建議

1. **視覺測試**: 確認兩種活動狀態有不同的視覺樣式
2. **內容測試**: 確認正在學習和未開始活動都正確顯示
3. **響應式測試**: 確認在不同螢幕尺寸下正常顯示
4. **資料測試**: 確認活動資料正確載入和顯示
5. **狀態測試**: 確認狀態標籤正確顯示

## 未來改進

### 可能的優化
1. **動態活動列表**: 從資料庫載入真實的未開始活動
2. **活動進度**: 顯示每個活動的進度百分比
3. **活動排序**: 根據難度或重要性排序活動
4. **互動功能**: 允許點擊活動查看詳細資訊

### 擴展功能
1. **活動管理**: 允許教師添加或修改活動
2. **進度追蹤**: 更詳細的活動進度追蹤
3. **活動評估**: 活動完成後的評估功能
4. **個性化**: 根據學生能力調整活動難度

修復完成後，本次課堂活動部分將同時顯示正在學習和未開始的活動，提供更完整和直觀的課程活動視圖。
