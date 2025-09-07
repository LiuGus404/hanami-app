/**
 * Web Worker 後台壓縮工具
 * 使用 Web Workers 在後台進行檔案壓縮，不阻塞主線程
 */

// 壓縮任務類型
export interface CompressionTask {
  id: string;
  file: File;
  config: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

// 壓縮結果類型
export interface CompressionResult {
  id: string;
  success: boolean;
  compressedFile?: File;
  error?: string;
  stats?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    processingTime: number;
  };
}

// 壓縮 Worker 類
export class CompressionWorker {
  private worker: Worker | null = null;
  private taskQueue: CompressionTask[] = [];
  private activeTasks: Map<string, (result: CompressionResult) => void> = new Map();
  private isProcessing = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    // 創建內聯 Worker
    const workerCode = `
      // 壓縮配置
      const DEFAULT_CONFIG = {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'webp'
      };

      // 壓縮圖片
      function compressImage(file, config) {
        return new Promise((resolve, reject) => {
          const canvas = new OffscreenCanvas(1, 1);
          const ctx = canvas.getContext('2d');
          const img = new Image();

          img.onload = () => {
            try {
              // 計算新尺寸
              let { width, height } = img;
              const { maxWidth = 1920, maxHeight = 1080 } = config;

              if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
              }

              canvas.width = width;
              canvas.height = height;

              // 繪製壓縮後的圖片
              ctx.drawImage(img, 0, 0, width, height);

              // 轉換為指定格式
              const mimeType = config.format === 'webp' ? 'image/webp' : 
                              config.format === 'png' ? 'image/png' : 'image/jpeg';
              
              canvas.convertToBlob({
                type: mimeType,
                quality: config.quality || 0.8
              }).then(blob => {
                const compressedFile = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              }).catch(reject);
            } catch (error) {
              reject(error);
            }
          };

          img.onerror = () => reject(new Error('圖片載入失敗'));
          
          // 使用 FileReader 讀取檔案
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target.result;
          };
          reader.onerror = () => reject(new Error('檔案讀取失敗'));
          reader.readAsDataURL(file);
        });
      }

      // 處理壓縮任務
      self.onmessage = async function(e) {
        const { id, file, config } = e.data;
        const startTime = performance.now();

        try {
          const compressedFile = await compressImage(file, { ...DEFAULT_CONFIG, ...config });
          const endTime = performance.now();
          
          const result = {
            id,
            success: true,
            compressedFile,
            stats: {
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio: ((file.size - compressedFile.size) / file.size) * 100,
              processingTime: endTime - startTime
            }
          };

          self.postMessage(result);
        } catch (error) {
          const result = {
            id,
            success: false,
            error: error.message
          };
          self.postMessage(result);
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e) => {
      const result: CompressionResult = e.data;
      const callback = this.activeTasks.get(result.id);
      
      if (callback) {
        callback(result);
        this.activeTasks.delete(result.id);
      }
      
      this.processNext();
    };

    this.worker.onerror = (error) => {
      console.error('Compression Worker 錯誤:', error);
      this.processNext();
    };
  }

  // 添加壓縮任務
  async compressFile(
    file: File, 
    config: CompressionTask['config'] = {}
  ): Promise<CompressionResult> {
    return new Promise((resolve) => {
      const task: CompressionTask = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        config
      };

      this.taskQueue.push(task);
      this.activeTasks.set(task.id, resolve);
      this.processNext();
    });
  }

  // 批量壓縮
  async compressFiles(
    files: File[], 
    config: CompressionTask['config'] = {},
    onProgress?: (progress: number) => void
  ): Promise<CompressionResult[]> {
    const tasks = files.map(file => this.compressFile(file, config));
    const results: CompressionResult[] = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const result = await tasks[i];
      results.push(result);
      
      if (onProgress) {
        onProgress(((i + 1) / tasks.length) * 100);
      }
    }
    
    return results;
  }

  // 處理下一個任務
  private processNext() {
    if (this.isProcessing || this.taskQueue.length === 0) return;
    
    this.isProcessing = true;
    const task = this.taskQueue.shift();
    
    if (task && this.worker) {
      this.worker.postMessage(task);
    }
    
    this.isProcessing = false;
  }

  // 清理資源
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.taskQueue = [];
    this.activeTasks.clear();
  }
}

// 全局壓縮 Worker 實例
let globalCompressionWorker: CompressionWorker | null = null;

// 獲取全局壓縮 Worker
export const getCompressionWorker = (): CompressionWorker => {
  if (!globalCompressionWorker) {
    globalCompressionWorker = new CompressionWorker();
  }
  return globalCompressionWorker;
};

// 清理全局壓縮 Worker
export const destroyCompressionWorker = () => {
  if (globalCompressionWorker) {
    globalCompressionWorker.destroy();
    globalCompressionWorker = null;
  }
};
