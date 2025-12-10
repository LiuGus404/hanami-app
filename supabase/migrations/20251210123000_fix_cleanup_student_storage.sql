-- ============================================
-- Fix: Update cleanup_student_storage to use direct SQL instead of missing function
-- Description: The previous implementation called storage.delete_object which doesn't exist.
-- This update replaces it with a direct DELETE FROM storage.objects.
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_student_storage(student_uuid uuid)
 RETURNS TABLE(deleted_files integer, freed_space bigint, remaining_space bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, storage, extensions
AS $function$
DECLARE
  quota_record RECORD;
  total_used BIGINT;
  files_to_delete RECORD;
  deleted_count INTEGER := 0;
  freed_bytes BIGINT := 0;
BEGIN
  -- 獲取用戶配額資訊
  SELECT * INTO quota_record 
  FROM hanami_student_media_quota 
  WHERE student_id = student_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student quota not found for ID: %', student_uuid;
  END IF;
  
  -- 計算當前使用的空間
  SELECT COALESCE(SUM(file_size), 0) INTO total_used
  FROM hanami_student_media
  WHERE student_id = student_uuid;
  
  -- 如果未超出限制，直接返回
  IF total_used <= quota_record.storage_limit_bytes THEN
    RETURN QUERY SELECT 0, 0::bigint, total_used;
    RETURN;
  END IF;
  
  -- 計算需要釋放的空間
  DECLARE
    space_needed BIGINT := total_used - quota_record.storage_limit_bytes;
    current_freed BIGINT := 0;
  BEGIN
    -- 循環刪除最舊的非收藏檔案，直到符合容量限制
    WHILE current_freed < space_needed LOOP
      -- 獲取最舊的非收藏檔案
      SELECT id, file_size, file_path INTO files_to_delete
      FROM hanami_student_media
      WHERE student_id = student_uuid 
        AND is_favorite = false
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- 如果沒有更多檔案可刪除，跳出循環
      IF files_to_delete.id IS NULL THEN
        EXIT;
      END IF;
      
      -- 從 Storage 刪除檔案 (Replaced missing function call with direct delete)
      DELETE FROM storage.objects 
      WHERE bucket_id = 'hanami-media' 
      AND name = files_to_delete.file_path;
      
      -- 從資料庫刪除記錄
      DELETE FROM hanami_student_media WHERE id = files_to_delete.id;
      
      -- 更新統計
      deleted_count := deleted_count + 1;
      freed_bytes := freed_bytes + files_to_delete.file_size;
      current_freed := current_freed + files_to_delete.file_size;
    END LOOP;
  END;
  
  -- 更新配額統計
  UPDATE hanami_student_media_quota
  SET 
    total_used_space = total_used - freed_bytes,
    last_updated = NOW()
  WHERE student_id = student_uuid;
  
  -- 返回結果
  RETURN QUERY SELECT deleted_count, freed_bytes, (total_used - freed_bytes);
END;
$function$;
