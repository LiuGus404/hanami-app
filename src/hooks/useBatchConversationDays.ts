import { useState, useEffect, useRef } from 'react';

interface ConversationDaysData {
  daysSinceLastMessage: number | null;
  hasMessages: boolean;
  totalCount: number;
}

interface BatchConversationDaysResult {
  results: Record<string, ConversationDaysData>;
  loading: boolean;
  error: string | null;
}

// 快取存儲
const cache = new Map<string, { data: ConversationDaysData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取

export function useBatchConversationDays(phoneNumbers: string[]): BatchConversationDaysResult {
  const [results, setResults] = useState<Record<string, ConversationDaysData>>({});
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
    const cachedResults: Record<string, ConversationDaysData> = {};
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

    const fetchBatchConversationDays = async () => {
      try {
        console.log(`批量載入對話記錄，電話號碼: ${uncachedPhones.join(', ')}`);
        
        const response = await fetch('/api/messages/batch', {
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
        console.log('批量對話記錄 API 響應:', batchResults);

        // 更新快取
        for (const [phone, data] of Object.entries(batchResults)) {
          const conversationData = data as any;
          cache.set(phone, { 
            data: {
              daysSinceLastMessage: conversationData.daysSinceLastMessage,
              hasMessages: conversationData.hasMessages,
              totalCount: conversationData.totalCount
            }, 
            timestamp: Date.now() 
          });
        }

        // 合併快取結果和新結果
        const allResults = { ...cachedResults, ...batchResults };
        setResults(allResults);
        setError(null);

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('批量載入對話記錄請求被取消');
          return;
        }
        
        console.error('批量載入對話記錄失敗:', err);
        setError(err instanceof Error ? err.message : '載入失敗');
        
        // 即使出錯也要顯示快取的結果
        setResults(cachedResults);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchConversationDays();

    return () => {
      controller.abort();
    };
  }, [phoneNumbers.join(',')]); // 使用 join 來避免陣列引用變化

  return { results, loading, error };
}
