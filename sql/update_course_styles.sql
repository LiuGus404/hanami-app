-- ============================================
-- 更新課程圖標和顏色
-- ============================================

-- 更新鋼琴課程 - 鋼琴圖標 + 柔和淺藍色
UPDATE "Hanami_CourseTypes"
SET 
  icon_type = 'piano',
  color_code = 'from-blue-100 to-sky-200',  -- 柔和淺藍色漸層
  updated_at = NOW()
WHERE id = '4735b1ca-11ae-4935-9999-ca0c021ead3d';

-- 更新音樂專注力 - 音符圖標 + 柔和淺黃色
UPDATE "Hanami_CourseTypes"
SET 
  icon_type = 'musical-note',
  color_code = 'from-amber-100 to-yellow-200',  -- 柔和淺黃色漸層
  updated_at = NOW()
WHERE id = '7ec0c333-fc2e-40cb-b043-143fc245bb5b';

-- 驗證更新結果
SELECT 
  name,
  icon_type,
  color_code,
  min_age,
  max_age,
  updated_at
FROM "Hanami_CourseTypes"
WHERE id IN (
  '4735b1ca-11ae-4935-9999-ca0c021ead3d',
  '7ec0c333-fc2e-40cb-b043-143fc245bb5b'
)
ORDER BY name;

-- 顯示完成訊息
SELECT '✅ 課程樣式已更新完成！' as message,
       '🎹 鋼琴 - 柔和淺藍色 (blue-100 to sky-200)' as piano_style,
       '🎵 音樂專注力 - 柔和淺黃色 (amber-100 to yellow-200)' as music_style;

