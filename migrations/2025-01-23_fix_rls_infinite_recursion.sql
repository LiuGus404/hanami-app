-- ============================================
-- 修復 Hanami_Students 表的 RLS 無限遞迴問題
-- 執行日期: 2025-01-23
-- 說明: 確保 is_org_admin 和 is_org_member 函數不會導致無限遞迴
-- ============================================

-- 問題分析：
-- 1. Hanami_Students 表的 RLS 政策使用 is_org_admin 和 is_org_member 函數
-- 2. 當更新 Hanami_Students 時，RLS 政策會檢查這些函數
-- 3. 如果這些函數內部（直接或間接）查詢了 Hanami_Students 表，就會導致無限遞迴
-- 4. 即使使用 SECURITY DEFINER，如果函數內部查詢的表有 RLS，仍然可能觸發遞迴

-- 解決方案：
-- 確保 is_org_admin 和 is_org_member 函數在查詢任何表時都禁用 RLS
-- 並且確保它們不會查詢 Hanami_Students 表

-- 重新創建 is_org_admin 函數，確保完全禁用 RLS
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result BOOLEAN := FALSE;
  v_old_rls TEXT;
BEGIN
  -- 如果參數無效，直接返回 FALSE
  IF user_email IS NULL OR user_email = '' OR org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 保存當前的 RLS 設置
  v_old_rls := current_setting('row_security', true);
  
  -- 臨時禁用 RLS（在整個函數執行期間）
  PERFORM set_config('row_security', 'off', true);
  
  BEGIN
    -- 檢查 hanami_org_identities 表（如果存在）
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'hanami_org_identities'
    ) THEN
      SELECT EXISTS (
        SELECT 1 FROM hanami_org_identities
        WHERE hanami_org_identities.org_id = is_org_admin.org_id
        AND hanami_org_identities.user_email = is_org_admin.user_email
        AND hanami_org_identities.role_type = 'admin'
        AND hanami_org_identities.status = 'active'
      ) INTO v_result;
      
      IF v_result THEN
        PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
        RETURN TRUE;
      END IF;
    END IF;
    
    -- 檢查 hanami_user_organizations 表
    SELECT EXISTS (
      SELECT 1 FROM hanami_user_organizations
      WHERE hanami_user_organizations.org_id = is_org_admin.org_id
      AND hanami_user_organizations.user_email = is_org_admin.user_email
      AND hanami_user_organizations.role = 'admin'
    ) INTO v_result;
    
    IF v_result THEN
      PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
      RETURN TRUE;
    END IF;
    
    -- 檢查是否是 owner（通過 is_org_owner 函數）
    IF is_org_owner(org_id, user_email) THEN
      PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
      RETURN TRUE;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- 確保在錯誤時也恢復 RLS 設置
      PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
      RAISE;
  END;
  
  -- 恢復 RLS 設置
  PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
  
  RETURN FALSE;
END;
$$;

-- 重新創建 is_org_member 函數，確保完全禁用 RLS
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result BOOLEAN := FALSE;
  v_old_rls TEXT;
BEGIN
  -- 如果參數無效，直接返回 FALSE
  IF user_email IS NULL OR user_email = '' OR org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 如果用戶是管理員，直接返回 TRUE（避免遞迴調用 is_org_admin）
  -- 但我們需要小心，不要導致遞迴
  -- 所以我們直接檢查，而不是調用 is_org_admin
  
  -- 保存當前的 RLS 設置
  v_old_rls := current_setting('row_security', true);
  
  -- 臨時禁用 RLS（在整個函數執行期間）
  PERFORM set_config('row_security', 'off', true);
  
  BEGIN
    -- 先檢查是否是 admin（直接查詢，不調用函數）
    IF EXISTS (
      SELECT 1 FROM hanami_user_organizations
      WHERE hanami_user_organizations.org_id = is_org_member.org_id
      AND hanami_user_organizations.user_email = is_org_member.user_email
      AND hanami_user_organizations.role IN ('admin', 'owner')
    ) THEN
      PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
      RETURN TRUE;
    END IF;
    
    -- 檢查 hanami_org_identities 表（如果存在）
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'hanami_org_identities'
    ) THEN
      SELECT EXISTS (
        SELECT 1 FROM hanami_org_identities
        WHERE hanami_org_identities.org_id = is_org_member.org_id
        AND hanami_org_identities.user_email = is_org_member.user_email
        AND hanami_org_identities.status = 'active'
      ) INTO v_result;
      
      IF v_result THEN
        PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
        RETURN TRUE;
      END IF;
    END IF;
    
    -- 檢查 hanami_user_organizations 表
    SELECT EXISTS (
      SELECT 1 FROM hanami_user_organizations
      WHERE hanami_user_organizations.org_id = is_org_member.org_id
      AND hanami_user_organizations.user_email = is_org_member.user_email
    ) INTO v_result;
    
    IF v_result THEN
      PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
      RETURN TRUE;
    END IF;
    
    -- 檢查 hanami_employee 表（注意：這裡不會導致遞迴，因為我們已經禁用了 RLS）
    SELECT EXISTS (
      SELECT 1 FROM hanami_employee
      WHERE hanami_employee.org_id = is_org_member.org_id
      AND hanami_employee.teacher_email = is_org_member.user_email
    ) INTO v_result;
    
    IF v_result THEN
      PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
      RETURN TRUE;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- 確保在錯誤時也恢復 RLS 設置
      PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
      RAISE;
  END;
  
  -- 恢復 RLS 設置
  PERFORM set_config('row_security', COALESCE(v_old_rls, 'on'), true);
  
  RETURN FALSE;
END;
$$;

-- 添加註釋
COMMENT ON FUNCTION is_org_admin IS '檢查用戶是否是機構管理員，使用 SECURITY DEFINER 和禁用 RLS 來避免無限遞迴';
COMMENT ON FUNCTION is_org_member IS '檢查用戶是否是機構成員，使用 SECURITY DEFINER 和禁用 RLS 來避免無限遞迴';

