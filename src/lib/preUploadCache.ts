/**
 * 預上傳和快取機制
 * 實現檔案預處理、快取和智能上傳策略
 */

// 快取項目類型
export interface CacheItem {
  id: string;
  file: File;
  compressedFile?: File;
  metadata: {
    size: number;
    type: string;
    lastModified: number;
    hash: string;
  };
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadProgress: number;
  createdAt: number;
  expiresAt: number;
}

// 預上傳配置
export interface PreUploadConfig {
  maxCacheSize: number; // 最大快取大小 (MB)
  maxCacheItems: number; // 最大快取項目數
  compressionEnabled: boolean;
  autoUpload: boolean;
  uploadDelay: number; // 自動上傳延遲 (ms)
}

// 預上傳管理器
export class PreUploadManager {
  private cache: Map<string, CacheItem> = new Map();
  private config: PreUploadConfig;
  private uploadQueue: string[] = [];
  private isProcessing = false;

  constructor(config: PreUploadConfig = {
    maxCacheSize: 100, // 100MB
    maxCacheItems: 50,
    compressionEnabled: true,
    autoUpload: true,
    uploadDelay: 2000 // 2秒後自動上傳
  }) {
    this.config = config;
    this.startAutoUpload();
  }

  // 添加檔案到快取
  async addFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const fileId = this.generateFileId(file);
    const hash = await this.calculateFileHash(file);
    
    // 檢查是否已存在
    const existingItem = this.findByHash(hash);
    if (existingItem) {
      console.log('檔案已存在於快取中:', existingItem.id);
      return existingItem.id;
    }

    // 檢查快取限制
    await this.cleanupCache();

    // 創建快取項目
    const cacheItem: CacheItem = {
      id: fileId,
      file,
      metadata: {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        hash
      },
      uploadStatus: 'pending',
      uploadProgress: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24小時過期
    };

    // 如果啟用壓縮，進行壓縮
    if (this.config.compressionEnabled) {
      try {
        const { getCompressionWorker } = await import('./compressionWorker');
        const worker = getCompressionWorker();
        
        const result = await worker.compressFile(file, {
          quality: 0.8,
          format: file.type.startsWith('image/') ? 'webp' : undefined
        });
        
        if (result.success && result.compressedFile) {
          cacheItem.compressedFile = result.compressedFile;
          console.log(`檔案壓縮完成: ${file.name} (${result.stats?.compressionRatio?.toFixed(1)}% 節省)`);
        }
      } catch (error) {
        console.warn('壓縮失敗，使用原始檔案:', error);
      }
    }

    this.cache.set(fileId, cacheItem);
    
    if (onProgress) onProgress(100);

    // 如果啟用自動上傳，添加到上傳隊列
    if (this.config.autoUpload) {
      this.addToUploadQueue(fileId);
    }

    return fileId;
  }

  // 批量添加檔案
  async addFiles(
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    const fileIds: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileId = await this.addFile(files[i]);
      fileIds.push(fileId);
      
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
    }
    
    return fileIds;
  }

  // 獲取快取項目
  getCacheItem(fileId: string): CacheItem | undefined {
    return this.cache.get(fileId);
  }

  // 獲取所有快取項目
  getAllCacheItems(): CacheItem[] {
    return Array.from(this.cache.values());
  }

  // 移除快取項目
  removeCacheItem(fileId: string): boolean {
    return this.cache.delete(fileId);
  }

  // 清空快取
  clearCache(): void {
    this.cache.clear();
    this.uploadQueue = [];
  }

  // 添加到上傳隊列
  private addToUploadQueue(fileId: string): void {
    if (!this.uploadQueue.includes(fileId)) {
      this.uploadQueue.push(fileId);
    }
  }

  // 開始自動上傳
  private startAutoUpload(): void {
    if (!this.config.autoUpload) return;

    setInterval(() => {
      this.processUploadQueue();
    }, this.config.uploadDelay);
  }

  // 處理上傳隊列
  private async processUploadQueue(): Promise<void> {
    if (this.isProcessing || this.uploadQueue.length === 0) return;

    this.isProcessing = true;
    const fileId = this.uploadQueue.shift();
    
    if (fileId) {
      const cacheItem = this.cache.get(fileId);
      if (cacheItem && cacheItem.uploadStatus === 'pending') {
        await this.uploadFile(fileId);
      }
    }
    
    this.isProcessing = false;
  }

  // 上傳檔案
  async uploadFile(
    fileId: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    const cacheItem = this.cache.get(fileId);
    if (!cacheItem) {
      console.error('快取項目不存在:', fileId);
      return false;
    }

    cacheItem.uploadStatus = 'uploading';
    
    try {
      // 使用 CDN 上傳管理器
      const { getCDNManager } = await import('./cdnUpload');
      const cdnManager = getCDNManager();
      
      const fileToUpload = cacheItem.compressedFile || cacheItem.file;
      const filePath = `cache/${fileId}/${fileToUpload.name}`;
      
      const result = await cdnManager.uploadFile(fileToUpload, filePath, (progress) => {
        cacheItem.uploadProgress = progress;
        if (onProgress) onProgress(progress);
      });
      
      if (result.success) {
        cacheItem.uploadStatus = 'completed';
        console.log(`檔案上傳成功: ${fileToUpload.name}`);
        return true;
      } else {
        cacheItem.uploadStatus = 'failed';
        console.error(`檔案上傳失敗: ${result.error}`);
        return false;
      }
    } catch (error) {
      cacheItem.uploadStatus = 'failed';
      console.error('上傳過程中發生錯誤:', error);
      return false;
    }
  }

  // 批量上傳
  async uploadFiles(
    fileIds: string[],
    onProgress?: (progress: number) => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      const result = await this.uploadFile(fileId);
      
      if (result) {
        success++;
      } else {
        failed++;
      }
      
      if (onProgress) {
        onProgress(((i + 1) / fileIds.length) * 100);
      }
    }
    
    return { success, failed };
  }

  // 生成檔案 ID
  private generateFileId(file: File): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 計算檔案雜湊
  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 根據雜湊查找檔案
  private findByHash(hash: string): CacheItem | undefined {
    for (const item of this.cache.values()) {
      if (item.metadata.hash === hash) {
        return item;
      }
    }
    return undefined;
  }

  // 清理快取
  private async cleanupCache(): Promise<void> {
    const now = Date.now();
    const maxSizeBytes = this.config.maxCacheSize * 1024 * 1024;
    
    // 移除過期項目
    for (const [id, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(id);
      }
    }
    
    // 檢查項目數量限制
    if (this.cache.size > this.config.maxCacheItems) {
      const items = Array.from(this.cache.values())
        .sort((a, b) => a.createdAt - b.createdAt);
      
      const toRemove = items.slice(0, this.cache.size - this.config.maxCacheItems);
      toRemove.forEach(item => this.cache.delete(item.id));
    }
    
    // 檢查大小限制
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.metadata.size;
    }
    
    if (totalSize > maxSizeBytes) {
      const items = Array.from(this.cache.values())
        .sort((a, b) => a.createdAt - b.createdAt);
      
      let currentSize = totalSize;
      for (const item of items) {
        if (currentSize <= maxSizeBytes) break;
        
        this.cache.delete(item.id);
        currentSize -= item.metadata.size;
      }
    }
  }

  // 獲取快取統計
  getCacheStats(): {
    totalItems: number;
    totalSize: number;
    pendingUploads: number;
    completedUploads: number;
    failedUploads: number;
  } {
    let totalSize = 0;
    let pendingUploads = 0;
    let completedUploads = 0;
    let failedUploads = 0;
    
    for (const item of this.cache.values()) {
      totalSize += item.metadata.size;
      
      switch (item.uploadStatus) {
        case 'pending':
          pendingUploads++;
          break;
        case 'completed':
          completedUploads++;
          break;
        case 'failed':
          failedUploads++;
          break;
      }
    }
    
    return {
      totalItems: this.cache.size,
      totalSize,
      pendingUploads,
      completedUploads,
      failedUploads
    };
  }
}

// 全局預上傳管理器
let globalPreUploadManager: PreUploadManager | null = null;

// 獲取全局預上傳管理器
export const getPreUploadManager = (): PreUploadManager => {
  if (!globalPreUploadManager) {
    globalPreUploadManager = new PreUploadManager();
  }
  return globalPreUploadManager;
};

// 清理全局預上傳管理器
export const destroyPreUploadManager = () => {
  globalPreUploadManager = null;
};
