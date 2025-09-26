# 響應式底部導航元件 (MobileBottomNavigation)

## 概述

這是一個專為手機、平板和窄螢幕設備設計的響應式底部導航元件，結合了圖中的設計風格和 Hanami 系統的色彩體系。

## 功能特色

### 🎯 響應式設計
- 只在螢幕寬度小於 1024px 時顯示
- 自動適應不同設備尺寸
- 提供適當的底部間距避免內容被遮擋
- 直接顯示四個導航按鈕，無需展開操作

### 🎨 設計風格
- 採用半橢圓設計，真正的弧形形狀
- 淺米色背景配合淡化效果
- 圓形圖標容器和邊框設計
- 柔和的漸層背景和陰影
- 符合現代簡潔的設計理念

### 🚀 動畫效果
- 流暢的載入動畫
- 懸停時的微動畫效果
- 彈簧動畫提供自然的互動感受
- 觸覺反饋（支援的設備）
- 按鈕間的延遲動畫效果

### 📱 動態導航功能
**基礎功能（所有用戶）：**
1. **首頁** (`/aihome/dashboard`) - 主要管理面板 (房屋圖標)
2. **AI夥伴** (`/aihome/ai-companions`) - AI夥伴和專案協作 (訊息圖標)
3. **家長連結** (`/aihome/parent/connect`) - 家長連接功能 (群組圖標)
4. **設定** (`/aihome/settings`) - 系統設置 (齒輪圖標)

**管理員專用功能：**
5. **管理面板** (`/admin`) - 花見音樂管理系統 (盾牌圖標，僅管理員可見)

### 🔐 智能角色檢測
- 自動檢測用戶角色（Hanami 管理員或一般管理員）
- 根據角色動態顯示相應的導航按鈕
- 管理員可同時訪問 AI Home 和管理面板

## 使用方式

### 基本使用

```tsx
import MobileBottomNavigation from '@/components/ui/MobileBottomNavigation';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
      <MobileBottomNavigation />
    </div>
  );
}
```

### 已整合的頁面

元件已自動整合到 `aihome` 佈局中，無需額外配置即可在所有相關頁面使用。

## 設計細節

### 色彩系統
```css
/* 主色調 */
--hanami-primary: #FFD59A;      /* 主要櫻花色 */
--hanami-secondary: #EBC9A4;    /* 次要溫暖色 */
--hanami-accent: #FFB6C1;       /* 可愛粉色 */
--hanami-background: #FFF9F2;   /* 溫暖背景色 */
--hanami-text: #4B4036;         /* 主要文字色 */
--hanami-border: #EADBC8;       /* 邊框色 */
```

### 動畫配置
- **展開動畫**: 0.3秒緩動
- **按鈕動畫**: 彈簧效果 (stiffness: 100, damping: 15)
- **懸停效果**: 0.2秒過渡
- **觸覺反饋**: 50ms 震動

### 響應式斷點
- **桌面**: >= 1024px (隱藏底部導航)
- **平板**: < 1024px (顯示底部導航)
- **手機**: < 768px (完整功能)

## 互動行為

### 半橢圓設計
- 五個圖標直接顯示，無需展開操作
- 純圖標設計，無文字標籤
- 真正的半橢圓形狀背景
- 圓形圖標容器，活動狀態有特殊高亮
- 中間按鈕（AI夥伴）稍微突出
- 適合快速導航的設計

### 當前頁面指示
- 自動檢測當前頁面
- 高亮顯示當前功能
- 視覺上區分活動和非活動狀態

### 導航跳轉
- 點擊任何導航項目跳轉到對應頁面
- 提供觸覺反饋（支援設備）
- 流暢的動畫過渡效果

## 技術實現

### 依賴
- `framer-motion` - 動畫效果
- `next/navigation` - 路由管理
- `@heroicons/react` - 圖標庫

### 主要 Hook
- `useRouter` - 路由導航
- `usePathname` - 當前路徑檢測
- `useEffect` - 響應式邏輯
- `useState` - 狀態管理

### 性能優化
- 條件渲染避免不必要的 DOM
- 事件監聽器正確清理
- 動畫使用 GPU 加速
- 最小化重渲染

## 自定義配置

### 修改導航項目
在 `navigationItems` 陣列中修改：

```tsx
const navigationItems = [
  {
    id: 'custom',
    label: '自定義',
    icon: CustomIcon,
    href: '/custom-route',
    color: 'from-[#FFD59A] to-[#EBC9A4]',
    description: '自定義功能'
  },
  // ... 其他項目
];
```

### 調整響應式斷點
修改 `checkScreenSize` 函數中的寬度值：

```tsx
const checkScreenSize = () => {
  const width = window.innerWidth;
  setIsVisible(width < 1200); // 修改為 1200px
};
```

### 自定義動畫
調整 `transition` 屬性：

```tsx
transition={{ 
  delay: index * 0.1, // 增加延遲
  type: 'spring',
  stiffness: 150,     // 增加彈性
  damping: 20         // 調整阻尼
}}
```

## 瀏覽器支援

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ 移動端瀏覽器

## 注意事項

1. **觸覺反饋**: 僅在支援的移動設備上工作
2. **安全區域**: 自動處理 iPhone 的底部安全區域
3. **性能**: 在低端設備上可能會有輕微的動畫延遲
4. **無障礙**: 支援鍵盤導航和螢幕閱讀器

## 更新日誌

### v2.1.0 (2024-12-19)
- 💬 AI夥伴按鈕圖標改為訊息圖案
- 🔐 新增智能角色檢測功能
- 🛡️ 管理員專用「管理面板」按鈕
- ❌ 移除「個人資料」按鈕
- 🎨 調整為 Hanami 溫暖色系
- 📱 動態導航按鈕配置

### v1.0.0 (2024-12-19)
- ✨ 初始版本發布
- 🎨 整合 Hanami 設計系統
- 📱 響應式底部導航
- 🚀 流暢動畫效果
- 🎯 核心功能整合
