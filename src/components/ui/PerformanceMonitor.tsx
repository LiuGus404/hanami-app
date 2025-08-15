'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  dataLoadTime: number;
  cacheHitRate: number;
  queryCount: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showDebugInfo?: boolean;
}

export function PerformanceMonitor({ onMetricsUpdate, showDebugInfo = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    dataLoadTime: 0,
    cacheHitRate: 0,
    queryCount: 0
  });

  const [startTime] = useState(performance.now());
  const [dataStartTime, setDataStartTime] = useState<number | null>(null);

  useEffect(() => {
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        pageLoadTime: loadTime
      }));
    };

    window.addEventListener('load', handleLoad);
    return () => window.removeEventListener('load', handleLoad);
  }, [startTime]);

  const startDataLoad = () => {
    setDataStartTime(performance.now());
  };

  const endDataLoad = () => {
    if (dataStartTime) {
      const dataLoadTime = performance.now() - dataStartTime;
      setMetrics(prev => ({
        ...prev,
        dataLoadTime
      }));
    }
  };

  const updateCacheHitRate = (hitRate: number) => {
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: hitRate
    }));
  };

  const incrementQueryCount = () => {
    setMetrics(prev => ({
      ...prev,
      queryCount: prev.queryCount + 1
    }));
  };

  useEffect(() => {
    onMetricsUpdate?.(metrics);
  }, [metrics, onMetricsUpdate]);

  // 暴露方法給父組件使用
  useEffect(() => {
    (window as any).performanceMonitor = {
      startDataLoad,
      endDataLoad,
      updateCacheHitRate,
      incrementQueryCount
    };
  }, []);

  if (!showDebugInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">性能監控</div>
      <div>頁面載入: {metrics.pageLoadTime.toFixed(0)}ms</div>
      <div>資料載入: {metrics.dataLoadTime.toFixed(0)}ms</div>
      <div>快取命中率: {(metrics.cacheHitRate * 100).toFixed(1)}%</div>
      <div>查詢次數: {metrics.queryCount}</div>
    </div>
  );
} 