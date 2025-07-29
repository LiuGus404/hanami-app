import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface PageState {
  [key: string]: any;
}

interface UsePageStateOptions {
  key?: string;
  persistTo?: 'sessionStorage' | 'localStorage' | 'url';
  debounceMs?: number;
}

export function usePageState<T extends PageState>(
  initialState: T,
  options: UsePageStateOptions = {}
) {
  const {
    key = 'pageState',
    persistTo = 'sessionStorage',
    debounceMs = 300
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<T>(initialState);
  const [isRestored, setIsRestored] = useState(false);

  // 生成唯一的狀態鍵
  const stateKey = `${pathname}_${key}`;

  // 保存狀態到存儲
  const saveState = useCallback((newState: T) => {
    try {
      const stateToSave = {
        ...newState,
        _timestamp: Date.now(),
        _pathname: pathname
      };

      if (persistTo === 'sessionStorage') {
        sessionStorage.setItem(stateKey, JSON.stringify(stateToSave));
      } else if (persistTo === 'localStorage') {
        localStorage.setItem(stateKey, JSON.stringify(stateToSave));
      } else if (persistTo === 'url') {
        // URL 狀態保存邏輯
        const url = new URL(window.location.href);
        Object.entries(newState).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              url.searchParams.set(key, JSON.stringify(value));
            } else {
              url.searchParams.set(key, String(value));
            }
          } else {
            url.searchParams.delete(key);
          }
        });
        window.history.replaceState({}, '', url.toString());
      }
    } catch (error) {
      console.error('保存頁面狀態失敗:', error);
    }
  }, [stateKey, pathname, persistTo]);

  // 從存儲恢復狀態
  const restoreState = useCallback(() => {
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
      } else if (persistTo === 'url') {
        // URL 狀態恢復邏輯
        const url = new URL(window.location.href);
        const urlState: any = {};
        url.searchParams.forEach((value, key) => {
          try {
            // 嘗試解析為 JSON（數組）
            urlState[key] = JSON.parse(value);
          } catch {
            // 如果不是 JSON，直接使用字符串值
            urlState[key] = value;
          }
        });
        if (Object.keys(urlState).length > 0) {
          savedState = urlState;
        }
      }

      if (savedState) {
        // 移除內部字段
        const { _timestamp, _pathname, ...cleanState } = savedState;
        
        // 檢查狀態是否過期（24小時）
        const isExpired = _timestamp && (Date.now() - _timestamp) > 24 * 60 * 60 * 1000;
        
        if (!isExpired) {
          setState(prev => ({ ...prev, ...cleanState }));
          setIsRestored(true);
          return true;
        }
      }
    } catch (error) {
      console.error('恢復頁面狀態失敗:', error);
    }
    return false;
  }, [stateKey, persistTo]);

  // 清除狀態
  const clearState = useCallback(() => {
    try {
      if (persistTo === 'sessionStorage') {
        sessionStorage.removeItem(stateKey);
      } else if (persistTo === 'localStorage') {
        localStorage.removeItem(stateKey);
      } else if (persistTo === 'url') {
        const url = new URL(window.location.href);
        // 清除所有相關的 URL 參數
        Object.keys(initialState).forEach(key => {
          url.searchParams.delete(key);
        });
        window.history.replaceState({}, '', url.toString());
      }
      setState(initialState);
      setIsRestored(false);
    } catch (error) {
      console.error('清除頁面狀態失敗:', error);
    }
  }, [stateKey, persistTo, initialState]);

  // 更新狀態
  const updateState = useCallback((updates: Partial<T>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // 防抖保存
      setTimeout(() => {
        saveState(newState);
      }, debounceMs);

      return newState;
    });
  }, [saveState, debounceMs]);

  // 重置狀態
  const resetState = useCallback(() => {
    setState(initialState);
    clearState();
  }, [initialState, clearState]);

  // 組件掛載時恢復狀態
  useEffect(() => {
    restoreState();
  }, [restoreState]);

  // 狀態變化時保存
  useEffect(() => {
    if (isRestored) {
      saveState(state);
    }
  }, [state, saveState, isRestored]);

  // 頁面卸載時保存狀態
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState(state);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveState(state);
    };
  }, [state, saveState]);

  return {
    state,
    updateState,
    resetState,
    clearState,
    isRestored,
    restoreState
  };
} 