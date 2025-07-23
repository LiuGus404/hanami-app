import { supabase } from './supabase';

// 檔案類型定義
export type MediaType = 'video' | 'photo' | 'document';
export type StorageCategory = 'students' | 'templates' | 'shared' | 'public';

// 檔案限制配置
export const FILE_LIMITS = {
  video: {
    maxSize: 20 * 1024 * 1024, // 20MB
    maxDuration: 30, // 30秒
    allowedTypes: ['video/mp4', 'video/avi', 'video/mov'],
  },
  photo: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  document: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
  },
};

// 檔案驗證函數
export const validateFile = (file: File, mediaType: MediaType): { valid: boolean; error?: string } => {
  const limits = FILE_LIMITS[mediaType];

  // 檢查檔案類型
  if (!limits.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支援的檔案類型: ${file.type}。允許的類型: ${limits.allowedTypes.join(', ')}`
    };
  }

  // 檢查檔案大小
  if (file.size > limits.maxSize) {
    return {
      valid: false,
      error: `檔案大小超過限制: ${(limits.maxSize / (1024 * 1024)).toFixed(1)}MB`
    };
  }

  return { valid: true };
};

// 生成檔案路徑
export const generateFilePath = (
  category: StorageCategory,
  subcategory: string,
  fileName: string,
  studentId?: string
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const ext = fileName.split('.').pop();

  switch (category) {
    case 'students':
      if (!studentId) throw new Error('學生 ID 是必需的');
      return `students/${studentId}/${subcategory}s/${timestamp}_${random}.${ext}`;
    case 'templates':
      return `templates/${subcategory}/${timestamp}_${random}.${ext}`;
    case 'shared':
      return `shared/${subcategory}/${timestamp}_${random}.${ext}`;
    case 'public':
      return `public/${subcategory}/${timestamp}_${random}.${ext}`;
    default:
      throw new Error(`不支援的檔案類別: ${category}`);
  }
};

// 上傳檔案到 Storage
export const uploadFile = async (
  file: File,
  category: StorageCategory,
  subcategory: string,
  studentId?: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string; url: string; error?: string }> => {
  try {
    // 生成檔案路徑
    const filePath = generateFilePath(category, subcategory, file.name, studentId);

    // 上傳檔案
    const { data, error } = await supabase.storage
      .from('hanami-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // 獲取公開 URL
    const { data: urlData } = supabase.storage
      .from('hanami-media')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('檔案上傳失敗:', error);
    return {
      path: '',
      url: '',
      error: error instanceof Error ? error.message : '檔案上傳失敗'
    };
  }
};

// 刪除檔案
export const deleteFile = async (filePath: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from('hanami-media')
      .remove([filePath]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('檔案刪除失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '檔案刪除失敗'
    };
  }
};

// 獲取檔案 URL
export const getFileUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('hanami-media')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

// 建立資料夾結構
export const createStorageFolders = async (): Promise<void> => {
  const folders = [
    'students',
    'templates/lesson-plans',
    'templates/activities',
    'templates/resources',
    'shared/avatars/teachers',
    'shared/avatars/students',
    'shared/documents/lesson-plans',
    'shared/documents/worksheets',
    'shared/music-files/backing-tracks',
    'shared/music-files/sheet-music',
    'public/icons',
    'public/backgrounds',
    'public/default-avatars'
  ];

  for (const folder of folders) {
    try {
      await supabase.storage
        .from('hanami-media')
        .upload(`${folder}/.keep`, new Blob([''], { type: 'text/plain' }));
    } catch (error) {
      // 資料夾可能已存在，忽略錯誤
      console.log(`Folder ${folder} already exists or cannot be created`);
    }
  }
};

// 檢查影片時長
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(Math.round(video.duration));
    };
    
    video.onerror = () => {
      reject(new Error('無法讀取影片時長'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

// 生成縮圖（如果需要）
export const generateThumbnail = async (videoFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadeddata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('無法生成縮圖'));
          }
        }, 'image/jpeg', 0.8);
      } else {
        reject(new Error('無法獲取 canvas 上下文'));
      }
    };
    
    video.onerror = () => {
      reject(new Error('無法載入影片'));
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};

// 格式化檔案大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化時長
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}; 