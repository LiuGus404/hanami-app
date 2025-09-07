/**
 * 媒體檔案壓縮和優化工具
 * 提供智能壓縮、格式轉換和品質優化功能
 */

// 壓縮配置
export interface CompressionConfig {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  videoBitrate?: number;
  videoFramerate?: number;
}

// 預設壓縮配置
export const DEFAULT_COMPRESSION_CONFIG: Record<string, CompressionConfig> = {
  photo: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'webp'
  },
  video: {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.7,
    videoBitrate: 1000000, // 1Mbps
    videoFramerate: 30
  }
};

/**
 * 壓縮圖片檔案
 */
export const compressImage = async (
  file: File, 
  config: CompressionConfig = DEFAULT_COMPRESSION_CONFIG.photo
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
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
        ctx?.drawImage(img, 0, 0, width, height);

        // 轉換為指定格式
        const mimeType = config.format === 'webp' ? 'image/webp' : 
                        config.format === 'png' ? 'image/png' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('壓縮失敗'));
            }
          },
          mimeType,
          config.quality || 0.8
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('圖片載入失敗'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 壓縮影片檔案（使用 WebCodecs API）
 */
export const compressVideo = async (
  file: File,
  config: CompressionConfig = DEFAULT_COMPRESSION_CONFIG.video
): Promise<File> => {
  // 檢查是否支援 WebCodecs
  if (!('VideoEncoder' in window)) {
    console.warn('WebCodecs 不支援，使用原始檔案');
    return file;
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('無法獲取 canvas 上下文'));
          return;
        }

        // 設置畫布尺寸
        const { maxWidth = 1280, maxHeight = 720 } = config;
        let { videoWidth, videoHeight } = video;
        
        if (videoWidth > maxWidth || videoHeight > maxHeight) {
          const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
          videoWidth *= ratio;
          videoHeight *= ratio;
        }

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        // 創建 MediaRecorder 進行壓縮
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: config.videoBitrate || 1000000
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: 'video/webm',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        };

        // 開始錄製
        mediaRecorder.start();
        
        // 播放影片並繪製到畫布
        video.currentTime = 0;
        video.play();
        
        const drawFrame = () => {
          if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
            requestAnimationFrame(drawFrame);
          } else {
            mediaRecorder.stop();
          }
        };
        
        drawFrame();
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => reject(new Error('影片載入失敗'));
    video.src = URL.createObjectURL(file);
  });
};

/**
 * 智能壓縮 - 根據檔案類型和大小自動選擇壓縮策略
 */
export const smartCompress = async (
  file: File,
  targetSizeMB: number
): Promise<File> => {
  const currentSizeMB = file.size / (1024 * 1024);
  
  // 如果檔案已經小於目標大小，直接返回
  if (currentSizeMB <= targetSizeMB) {
    return file;
  }

  const compressionRatio = targetSizeMB / currentSizeMB;
  
  if (file.type.startsWith('image/')) {
    // 圖片壓縮
    const quality = Math.max(0.3, compressionRatio * 0.8);
    const config: CompressionConfig = {
      quality,
      format: 'webp'
    };
    
    return await compressImage(file, config);
  } else if (file.type.startsWith('video/')) {
    // 影片壓縮
    const config: CompressionConfig = {
      quality: Math.max(0.3, compressionRatio),
      videoBitrate: Math.max(500000, 1000000 * compressionRatio)
    };
    
    return await compressVideo(file, config);
  }
  
  return file;
};

/**
 * 批量壓縮檔案
 */
export const batchCompress = async (
  files: File[],
  targetSizeMB: number,
  onProgress?: (progress: number) => void
): Promise<File[]> => {
  const compressedFiles: File[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const compressedFile = await smartCompress(file, targetSizeMB);
      compressedFiles.push(compressedFile);
      
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error(`壓縮檔案 ${file.name} 失敗:`, error);
      compressedFiles.push(file); // 使用原始檔案
    }
  }
  
  return compressedFiles;
};

/**
 * 預覽壓縮效果
 */
export const previewCompression = async (
  file: File,
  config: CompressionConfig
): Promise<{ originalSize: number; compressedSize: number; compressionRatio: number }> => {
  let compressedFile: File;
  
  if (file.type.startsWith('image/')) {
    compressedFile = await compressImage(file, config);
  } else if (file.type.startsWith('video/')) {
    compressedFile = await compressVideo(file, config);
  } else {
    compressedFile = file;
  }
  
  const originalSize = file.size;
  const compressedSize = compressedFile.size;
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
  
  return {
    originalSize,
    compressedSize,
    compressionRatio
  };
};
