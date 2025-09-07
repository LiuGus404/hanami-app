# 3D 角色背景設定

這個資料夾包含用於 3D 互動角色的不同場景背景圖片。

## 資料夾結構

### 📚 classroom/
- **用途**: 一般教室場景
- **適用**: 基礎學習活動、理論課程
- **建議尺寸**: 1920x1080 或更高解析度
- **檔案格式**: PNG, JPG, WebP

### 🎵 music-room/
- **用途**: 音樂教室場景
- **適用**: 鋼琴課程、音樂學習活動
- **特色**: 包含鋼琴、樂器等音樂元素
- **建議尺寸**: 1920x1080 或更高解析度

### 🌳 outdoor/
- **用途**: 戶外場景
- **適用**: 戶外活動、自然學習
- **特色**: 自然環境、陽光、綠地
- **建議尺寸**: 1920x1080 或更高解析度

### 🏠 home/
- **用途**: 家庭場景
- **適用**: 家庭作業、親子活動
- **特色**: 溫馨的家庭環境
- **建議尺寸**: 1920x1080 或更高解析度

### 🎤 studio/
- **用途**: 錄音室/工作室場景
- **適用**: 錄音、創作活動
- **特色**: 專業設備、現代化設計
- **建議尺寸**: 1920x1080 或更高解析度

### 🎪 playground/
- **用途**: 遊樂場場景
- **適用**: 遊戲活動、輕鬆學習
- **特色**: 色彩豐富、充滿活力
- **建議尺寸**: 1920x1080 或更高解析度

## 檔案命名規範

建議使用以下命名格式：
- `{場景名稱}_{時間}_{版本}.{副檔名}`
- 例如: `classroom_morning_v1.png`
- 例如: `music-room_evening_v2.jpg`

## 使用方式

在 3D 角色組件中，可以根據不同的學習活動或情境動態切換背景：

```typescript
const backgroundSettings = {
  classroom: '/3d-character-backgrounds/classroom/classroom_morning_v1.png',
  musicRoom: '/3d-character-backgrounds/music-room/music-room_evening_v1.png',
  outdoor: '/3d-character-backgrounds/outdoor/outdoor_sunny_v1.png',
  home: '/3d-character-backgrounds/home/home_cozy_v1.png',
  studio: '/3d-character-backgrounds/studio/studio_modern_v1.png',
  playground: '/3d-character-backgrounds/playground/playground_colorful_v1.png'
};
```

## 注意事項

1. **版權**: 確保所有背景圖片都有適當的使用授權
2. **優化**: 建議使用 WebP 格式以獲得更好的壓縮效果
3. **響應式**: 考慮不同螢幕尺寸的顯示效果
4. **一致性**: 保持與 Hanami 設計風格的視覺一致性
5. **性能**: 控制檔案大小以確保載入速度

## 更新日誌

- **2024-12-19**: 創建初始資料夾結構
- **未來**: 根據需要添加新的場景類型

