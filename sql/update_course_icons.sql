-- ============================================
-- 更新課程圖標類型
-- ============================================

-- 更新鋼琴課程 - 使用鋼琴/音符圖標
UPDATE "Hanami_CourseTypes"
SET 
  icon_type = 'piano',
  updated_at = NOW()
WHERE id = '4735b1ca-11ae-4935-9999-ca0c021ead3d';

-- 更新音樂專注力 - 使用音符圖標
UPDATE "Hanami_CourseTypes"
SET 
  icon_type = 'musical-note',
  updated_at = NOW()
WHERE id = '7ec0c333-fc2e-40cb-b043-143fc245bb5b';

-- 驗證更新結果
SELECT 
  id,
  name,
  icon_type,
  color_code,
  updated_at
FROM "Hanami_CourseTypes"
WHERE id IN (
  '4735b1ca-11ae-4935-9999-ca0c021ead3d',
  '7ec0c333-fc2e-40cb-b043-143fc245bb5b'
)
ORDER BY name;

-- 顯示完成訊息
SELECT '✅ 課程圖標已更新完成！' as message;






