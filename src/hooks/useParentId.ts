import { useSaasAuth } from './saas/useSaasAuthSimple';

export function useParentId() {
  const { user } = useSaasAuth();
  
  // 返回當前用戶的 ID，如果沒有用戶則返回 null
  return user?.id || null;
}
