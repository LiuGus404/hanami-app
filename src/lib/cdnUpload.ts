/**
 * CDN 加速上傳工具
 * 使用多個上傳端點和智能路由提升上傳速度
 */

import { supabase } from './supabase';

// CDN 端點配置
export interface CDNEndpoint {
  id: string;
  name: string;
  url: string;
  region: string;
  priority: number;
  isActive: boolean;
  latency?: number;
  successRate?: number;
}

// 上傳配置
export interface CDNUploadConfig {
  maxConcurrentUploads: number;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  enableLatencyTest: boolean;
}

// 上傳結果
export interface CDNUploadResult {
  success: boolean;
  endpoint: string;
  filePath: string;
  uploadTime: number;
  error?: string;
}

// 預設 CDN 端點
const DEFAULT_CDN_ENDPOINTS: CDNEndpoint[] = [
  {
    id: 'supabase-primary',
    name: 'Supabase 主要',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    region: 'asia-east1',
    priority: 1,
    isActive: true
  },
  {
    id: 'supabase-backup',
    name: 'Supabase 備用',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    region: 'asia-southeast1',
    priority: 2,
    isActive: true
  }
];

// CDN 上傳管理器
export class CDNUploadManager {
  private endpoints: CDNEndpoint[] = [];
  private config: CDNUploadConfig;
  private latencyCache: Map<string, number> = new Map();

  constructor(
    endpoints: CDNEndpoint[] = DEFAULT_CDN_ENDPOINTS,
    config: CDNUploadConfig = {
      maxConcurrentUploads: 5,
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 30000,
      enableLatencyTest: true
    }
  ) {
    this.endpoints = endpoints.filter(ep => ep.isActive);
    this.config = config;
    
    if (config.enableLatencyTest) {
      this.testEndpointsLatency();
    }
  }

  // 測試端點延遲
  private async testEndpointsLatency(): Promise<void> {
    const latencyTests = this.endpoints.map(async (endpoint) => {
      try {
        const startTime = performance.now();
        
        // 發送小檔案測試延遲
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const response = await fetch(`${endpoint.url}/storage/v1/object/test`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        this.latencyCache.set(endpoint.id, latency);
        endpoint.latency = latency;
        
        console.log(`端點 ${endpoint.name} 延遲: ${latency.toFixed(2)}ms`);
      } catch (error) {
        console.warn(`端點 ${endpoint.name} 延遲測試失敗:`, error);
        endpoint.latency = Infinity;
      }
    });

    await Promise.allSettled(latencyTests);
  }

  // 獲取最佳端點
  private getBestEndpoint(): CDNEndpoint {
    return this.endpoints
      .filter(ep => ep.isActive)
      .sort((a, b) => {
        // 優先考慮延遲和成功率
        const aScore = (a.latency || 0) * (1 - (a.successRate || 0.5));
        const bScore = (b.latency || 0) * (1 - (b.successRate || 0.5));
        return aScore - bScore;
      })[0] || this.endpoints[0];
  }

  // 上傳到指定端點
  private async uploadToEndpoint(
    endpoint: CDNEndpoint,
    file: File,
    filePath: string
  ): Promise<CDNUploadResult> {
    const startTime = performance.now();
    
    try {
      // 創建該端點的 Supabase 客戶端
      const endpointSupabase = supabase; // 使用主要客戶端，實際應用中可以配置不同端點
      
      const { data, error } = await endpointSupabase.storage
        .from('hanami-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      const endTime = performance.now();
      const uploadTime = endTime - startTime;

      if (error) {
        throw new Error(`上傳失敗: ${error.message}`);
      }

      // 更新端點成功率
      endpoint.successRate = (endpoint.successRate || 0.5) * 0.9 + 0.1;

      return {
        success: true,
        endpoint: endpoint.id,
        filePath: data.path,
        uploadTime
      };
    } catch (error) {
      const endTime = performance.now();
      const uploadTime = endTime - startTime;

      // 降低端點成功率
      endpoint.successRate = (endpoint.successRate || 0.5) * 0.95;

      return {
        success: false,
        endpoint: endpoint.id,
        filePath: '',
        uploadTime,
        error: error instanceof Error ? error.message : '上傳失敗'
      };
    }
  }

  // 智能上傳
  async uploadFile(
    file: File,
    filePath: string,
    onProgress?: (progress: number) => void
  ): Promise<CDNUploadResult> {
    const bestEndpoint = this.getBestEndpoint();
    let lastError: string | undefined;

    // 嘗試上傳到最佳端點
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const result = await this.uploadToEndpoint(bestEndpoint, file, filePath);
        
        if (result.success) {
          if (onProgress) onProgress(100);
          return result;
        }
        
        lastError = result.error;
        
        // 如果失敗，等待後重試
        if (attempt < this.config.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : '上傳失敗';
        
        if (attempt < this.config.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    // 如果主要端點失敗，嘗試其他端點
    const otherEndpoints = this.endpoints.filter(ep => ep.id !== bestEndpoint.id);
    for (const endpoint of otherEndpoints) {
      try {
        const result = await this.uploadToEndpoint(endpoint, file, filePath);
        if (result.success) {
          if (onProgress) onProgress(100);
          return result;
        }
      } catch (error) {
        console.warn(`端點 ${endpoint.name} 上傳失敗:`, error);
      }
    }

    return {
      success: false,
      endpoint: bestEndpoint.id,
      filePath: '',
      uploadTime: 0,
      error: lastError || '所有端點上傳失敗'
    };
  }

  // 並行上傳多個檔案
  async uploadFiles(
    files: { file: File; path: string }[],
    onProgress?: (progress: number) => void
  ): Promise<CDNUploadResult[]> {
    const results: CDNUploadResult[] = [];
    const uploadPromises: Promise<CDNUploadResult>[] = [];
    
    // 限制並行上傳數量
    const chunks = this.chunkArray(files, this.config.maxConcurrentUploads);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(({ file, path }) => 
        this.uploadFile(file, path)
      );
      
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            endpoint: 'unknown',
            filePath: chunk[index].path,
            uploadTime: 0,
            error: result.reason?.message || '上傳失敗'
          });
        }
      });
      
      if (onProgress) {
        onProgress((results.length / files.length) * 100);
      }
    }
    
    return results;
  }

  // 分割陣列
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // 獲取端點統計
  getEndpointStats(): CDNEndpoint[] {
    return [...this.endpoints];
  }

  // 更新端點配置
  updateEndpoint(endpointId: string, updates: Partial<CDNEndpoint>): void {
    const endpoint = this.endpoints.find(ep => ep.id === endpointId);
    if (endpoint) {
      Object.assign(endpoint, updates);
    }
  }
}

// 全局 CDN 上傳管理器
let globalCDNManager: CDNUploadManager | null = null;

// 獲取全局 CDN 管理器
export const getCDNManager = (): CDNUploadManager => {
  if (!globalCDNManager) {
    globalCDNManager = new CDNUploadManager();
  }
  return globalCDNManager;
};

// 清理全局 CDN 管理器
export const destroyCDNManager = () => {
  globalCDNManager = null;
};
