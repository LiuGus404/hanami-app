# 3D 動態角色元件系統

## 概述

這是一個完整的 3D 動態角色元件系統，專為 Hanami 音樂教育平台設計。系統包含三個核心組件：

- **StudentAvatarWidget** - 3D 動態角色主組件
- **GrowthTreeVisualization** - 成長樹視覺化組件  
- **LearningProgressCards** - 學習進度卡片組件

## 功能特色

### 🎭 3D 動態角色 (StudentAvatarWidget)
- ✨ 根據學生性別自動選擇角色圖像
- 🎯 點擊觸發互動動畫和表情變化
- 🔊 內建音效系統（可開關）
- 📊 即時顯示學習統計資料
- 📱 完全響應式設計
- 🎨 符合 Hanami 設計風格

### 🌳 成長樹視覺化 (GrowthTreeVisualization)
- 🗺️ 樹狀圖顯示能力發展路徑
- 📈 動畫進度條和節點狀態
- 🔄 支援多樹切換
- 💡 懸停顯示詳細資訊
- 🎮 節點點擊互動
- 📏 響應式佈局適應

### 📋 學習進度卡片 (LearningProgressCards)
- 📑 多標籤內容展示
- ⚡ 進度條動畫效果
- 🏷️ 活動類型分類顯示
- 🏆 成就系統和稀有度
- 🔄 即時資料更新
- 📊 詳細統計資訊

## 快速開始

### 1. 安裝依賴

```bash
npm install framer-motion lucide-react
```

### 2. 基本使用

```tsx
import { 
  StudentAvatarWidget,
  GrowthTreeVisualization,
  LearningProgressCards 
} from '@/components/ui';

// 基本用法
function StudentDashboard() {
  const student = {
    id: 'student-123',
    full_name: '張小明',
    nick_name: '小明',
    gender: 'male',
    student_age: 6,
    course_type: '兒童音樂基礎',
    ongoing_lessons: 12,
    upcoming_lessons: 4
  };

  return (
    <div className="space-y-6">
      {/* 3D 角色 */}
      <StudentAvatarWidget
        student={student}
        size="md"
        enableSound={true}
      />
      
      {/* 成長樹 */}
      <GrowthTreeVisualization
        studentId={student.id}
        treeData={growthTreeData}
        variant="detailed"
        onNodeClick={(node) => console.log('點擊節點:', node)}
      />
      
      {/* 學習進度 */}
      <LearningProgressCards
        studentId={student.id}
        variant="detailed"
        maxItems={5}
      />
    </div>
  );
}
```

### 3. 使用自定義 Hook

```tsx
import { useStudentAvatarData, useGrowthTreeInteraction } from '@/hooks/useStudentAvatarData';

function AdvancedStudentWidget() {
  // 載入學生資料
  const {
    data,
    loading,
    error,
    studentStats,
    refresh
  } = useStudentAvatarData('student-123', {
    enableAutoRefresh: true,
    refreshInterval: 60000
  });

  // 成長樹互動
  const {
    selectedNode,
    handleNodeClick,
    clearSelection
  } = useGrowthTreeInteraction('student-123');

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤: {error}</div>;

  return (
    <div>
      <h2>總進度: {studentStats.overallProgress}%</h2>
      {/* 其他組件... */}
    </div>
  );
}
```

## API 說明

### StudentAvatarWidget Props

| 屬性名 | 類型 | 必需 | 預設值 | 說明 |
|--------|------|------|--------|------|
| student | Student | ✅ | - | 學生基本資料 |
| size | 'sm' \| 'md' \| 'lg' | ❌ | 'md' | 角色大小 |
| enableSound | boolean | ❌ | true | 是否啟用音效 |
| className | string | ❌ | '' | 自定義樣式類 |

### GrowthTreeVisualization Props

| 屬性名 | 類型 | 必需 | 預設值 | 說明 |
|--------|------|------|--------|------|
| studentId | string | ✅ | - | 學生 ID |
| treeData | GrowthTreeData[] | ✅ | - | 成長樹資料 |
| variant | 'compact' \| 'detailed' \| 'full' | ❌ | 'detailed' | 顯示模式 |
| onNodeClick | (node) => void | ❌ | - | 節點點擊回調 |
| className | string | ❌ | '' | 自定義樣式類 |

### LearningProgressCards Props

| 屬性名 | 類型 | 必需 | 預設值 | 說明 |
|--------|------|------|--------|------|
| studentId | string | ✅ | - | 學生 ID |
| variant | 'compact' \| 'detailed' \| 'dashboard' | ❌ | 'detailed' | 顯示模式 |
| maxItems | number | ❌ | 5 | 最大顯示項目數 |
| className | string | ❌ | '' | 自定義樣式類 |

## 資料結構

### Student 介面

```typescript
interface Student {
  id: string;
  full_name: string;
  nick_name?: string | null;
  gender?: string | null;
  student_age?: number | null;
  course_type?: string | null;
  ongoing_lessons?: number | null;
  upcoming_lessons?: number | null;
}
```

### GrowthTree 介面

```typescript
interface GrowthTreeData {
  id: string;
  tree_name: string;
  tree_description?: string;
  tree_icon?: string;
  nodes: GrowthNode[];
  totalProgress: number;
  currentLevel: number;
}

interface GrowthNode {
  id: string;
  name: string;
  description?: string;
  level: number;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  prerequisites: string[];
  color?: string;
}
```

## 客製化

### 主題顏色

組件使用 Hanami 設計系統的色彩變數：

```css
--hanami-primary: #FFD59A;      /* 主要櫻花色 */
--hanami-secondary: #EBC9A4;    /* 次要溫暖色 */
--hanami-accent: #FFB6C1;       /* 可愛粉色 */
--hanami-background: #FFF9F2;   /* 溫暖背景色 */
--hanami-surface: #FFFDF8;      /* 表面色 */
--hanami-text: #4B4036;         /* 主要文字色 */
--hanami-text-secondary: #2B3A3B; /* 次要文字色 */
--hanami-border: #EADBC8;       /* 邊框色 */
```

### 動畫效果

所有動畫效果基於 Framer Motion，可通過 variants 自定義：

```tsx
const customVariants = {
  hover: {
    scale: 1.1,
    transition: { duration: 0.2 }
  }
};

<StudentAvatarWidget
  student={student}
  // 其他 props...
/>
```

### 音效自定義

音效系統支援三種音效類型：

- `click` - 點擊音效
- `achievement` - 成就音效  
- `welcome` - 歡迎音效

可透過修改 `useAudioManager` Hook 來自定義音效。

## 效能優化

### 1. 圖片優化
- 使用 WebP 格式角色圖片
- 實作圖片懶加載
- 響應式圖片尺寸

### 2. 動畫優化
- 使用 CSS Transform 而非 Position
- 避免佈局抖動
- 合理的動畫持續時間

### 3. 資料載入優化
- 實作快取機制
- 並行載入資料
- 增量更新策略

## 瀏覽器支援

- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ iOS Safari 12+
- ✅ Android Chrome 70+

## 疑難排解

### 常見問題

1. **角色圖片不顯示**
   - 確認圖片檔案存在於 `/public/` 目錄
   - 檢查性別欄位值是否正確

2. **動畫效果不流暢**
   - 檢查是否有過多的同時動畫
   - 確認瀏覽器硬體加速已啟用

3. **音效無法播放**
   - 確認瀏覽器允許自動播放音效
   - 檢查 `enableSound` 屬性是否設為 true

4. **資料載入失敗**
   - 檢查 API 端點是否正確
   - 確認學生 ID 有效
   - 查看瀏覽器控制台錯誤訊息

### 偵錯模式

啟用開發模式來檢視詳細資訊：

```tsx
// 在開發環境中
if (process.env.NODE_ENV === 'development') {
  console.log('學生資料:', data);
  console.log('載入狀態:', loading);
  console.log('錯誤資訊:', error);
}
```

## 更新紀錄

### v1.0.0 (2024-12-19)
- ✨ 初始版本發布
- 🎭 3D 動態角色功能
- 🌳 成長樹視覺化
- 📋 學習進度卡片
- 🔊 音效系統整合
- 📱 響應式設計
- 🛠️ 自定義 Hooks
- 📡 API 整合

## 授權

MIT License - 詳見 LICENSE 檔案

## 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個組件系統！

---

**開發團隊**: Hanami 開發團隊  
**最後更新**: 2024-12-19  
**版本**: 1.0.0
