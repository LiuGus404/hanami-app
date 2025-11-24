-- 修復機構評論唯一約束：改為部分唯一索引，只對 active 狀態的評論生效
-- 這樣用戶刪除評論後可以重新創建新評論

-- 1. 刪除舊的唯一約束
ALTER TABLE public.hanami_org_reviews 
DROP CONSTRAINT IF EXISTS hanami_org_reviews_unique;

-- 2. 創建部分唯一索引（只對 status = 'active' 的記錄生效）
-- 這確保每個用戶對每個機構只能有一個 active 狀態的評論
CREATE UNIQUE INDEX IF NOT EXISTS idx_hanami_org_reviews_unique_active 
ON public.hanami_org_reviews(org_id, user_id) 
WHERE status = 'active';

-- 3. 添加註釋說明
COMMENT ON INDEX idx_hanami_org_reviews_unique_active IS '部分唯一索引：確保每個用戶對每個機構只能有一個 active 狀態的評論。用戶刪除評論後可以重新創建。';

