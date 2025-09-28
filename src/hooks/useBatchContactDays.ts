import { useState, useEffect, useRef } from 'react';

interface ContactDaysData {
  daysSinceContact: number | null;
  lastContactTime: string | null;
  hasContact: boolean;
}

interface BatchContactDaysResult {
  results: Record<string, ContactDaysData>;
  loading: boolean;
  error: string | null;
}

// 快取存儲
const cache = new Map<string, { data: ContactDaysData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取

export function useBatchContactDays(phoneNumbers: string[]): BatchContactDaysResult {
  const [results, setResults] = useState<Record<string, ContactDaysData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 過濾掉空值和重複值
    const validPhones = Array.from(new Set(phoneNumbers.filter(phone => phone && phone.trim() !== '')));
    
    if (validPhones.length === 0) {
      setResults({});
      setLoading(false);
      return;
    }

    // 檢查快取
    const cachedResults: Record<string, ContactDaysData> = {};
    const uncachedPhones: string[] = [];
    
    for (const phone of validPhones) {
      const cached = cache.get(phone);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        cachedResults[phone] = cached.data;
      } else {
        uncachedPhones.push(phone);
      }
    }

    // 如果所有數據都在快取中，直接返回
    if (uncachedPhones.length === 0) {
      setResults(cachedResults);
      setLoading(false);
      return;
    }

    // 取消之前的請求
    if (requestRef.current) {
      requestRef.current.abort();
    }

    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);
    setError(null);

    const fetchBatchContactDays = async () => {
      try {
        console.log(`批量載入聯繫天數，電話號碼: ${uncachedPhones.join(', ')}`);
        
        const response = await fetch('/api/contact-days/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumbers: uncachedPhones }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const batchResults = await response.json();
        console.log('批量 API 響應:', batchResults);

        // 更新快取
        for (const [phone, data] of Object.entries(batchResults)) {
          cache.set(phone, { data: data as ContactDaysData, timestamp: Date.now() });
        }

        // 合併快取結果和新結果
        const allResults = { ...cachedResults, ...batchResults };
        setResults(allResults);
        setError(null);

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('批量載入請求被取消');
          return;
        }
        
        console.error('批量載入聯繫天數失敗:', err);
        setError(err instanceof Error ? err.message : '載入失敗');
        
        // 即使出錯也要顯示快取的結果
        setResults(cachedResults);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchContactDays();

    return () => {
      controller.abort();
    };
  }, [phoneNumbers.join(',')]); // 使用 join 來避免陣列引用變化

  return { results, loading, error };
}

