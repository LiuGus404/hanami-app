import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationState {
  [key: string]: any;
}

interface UseNavigationStateOptions {
  key?: string;
  persistTo?: 'sessionStorage' | 'localStorage';
  autoRestore?: boolean;
}

export function useNavigationState<T extends NavigationState>(
  initialState: T,
  options: UseNavigationStateOptions = {}
) {
  const {
    key = 'navigationState',
    persistTo = 'sessionStorage',
    autoRestore = true
  } = options;

  const router = useRouter();
  const pathname = usePathname();

  // 生成唯一的狀態鍵
  const stateKey = `${pathname}_${key}`;

  // 保存狀態
  const saveState = useCallback((state: T) => {
    try {
      const stateToSave = {
        ...state,
        _timestamp: Date.now(),
        _pathname: pathname
      };

      if (persistTo === 'sessionStorage') {
        sessionStorage.setItem(stateKey, JSON.stringify(stateToSave));
      } else if (persistTo === 'localStorage') {
        localStorage.setItem(stateKey, JSON.stringify(stateToSave));
      }
    } catch (error) {
      console.error('保存導航狀態失敗:', error);
    }
  }, [stateKey, pathname, persistTo]);

  // 恢復狀態
  const restoreState = useCallback((): T | null => {
    try {
      let savedState: any = null;

      if (persistTo === 'sessionStorage') {
        const saved = sessionStorage.getItem(stateKey);
        if (saved) {
          savedState = JSON.parse(saved);
        }
      } else if (persistTo === 'localStorage') {
        const saved = localStorage.getItem(stateKey);
        if (saved) {
          savedState = JSON.parse(saved);
        }
      }

      if (savedState) {
        // 移除內部字段
        const { _timestamp, _pathname, ...cleanState } = savedState;
        
        // 檢查狀態是否過期（24小時）
        const isExpired = _timestamp && (Date.now() - _timestamp) > 24 * 60 * 60 * 1000;
        
        if (!isExpired) {
          return cleanState as T;
        }
      }
    } catch (error) {
      console.error('恢復導航狀態失敗:', error);
    }
    return null;
  }, [stateKey, persistTo]);

  // 清除狀態
  const clearState = useCallback(() => {
    try {
      if (persistTo === 'sessionStorage') {
        sessionStorage.removeItem(stateKey);
      } else if (persistTo === 'localStorage') {
        localStorage.removeItem(stateKey);
      }
    } catch (error) {
      console.error('清除導航狀態失敗:', error);
    }
  }, [stateKey, persistTo]);

  // 導航到指定頁面並保存狀態
  const navigateWithState = useCallback((url: string, state?: Partial<T>) => {
    if (state) {
      saveState({ ...initialState, ...state });
    }
    router.push(url);
  }, [router, saveState, initialState]);

  // 返回上一頁並恢復狀態
  const goBackWithState = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/admin');
    }
  }, [router]);

  // 頁面卸載時自動保存狀態
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 這裡可以保存當前頁面的狀態
      // 需要從外部傳入當前狀態
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    saveState,
    restoreState,
    clearState,
    navigateWithState,
    goBackWithState,
    stateKey
  };
} 