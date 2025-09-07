'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  CloudArrowUpIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BoltIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HanamiButton } from './HanamiButton';
import { HanamiCard } from './HanamiCard';
import { formatFileSize } from '@/lib/storageUtils';
import toast from 'react-hot-toast';

interface UploadFile {
  id: string;
  file: File;
  compressedFile?: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'completed' | 'error';
  error?: string;
  preview?: string;
  compressionStats?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    processingTime: number;
  };
  uploadStats?: {
    uploadTime: number;
    endpoint: string;
    speed: number;
  };
}

interface SuperFastMediaUploaderProps {
  studentId: string;
  mediaType: 'video' | 'photo';
  maxFiles?: number;
  maxSizeMB?: number;
  onUploadComplete?: (results: any[]) => void;
  onUploadProgress?: (progress: number) => void;
  className?: string;
}

export function SuperFastMediaUploader({
  studentId,
  mediaType,
  maxFiles = 10,
  maxSizeMB = mediaType === 'video' ? 20 : 1,
  onUploadComplete,
  onUploadProgress,
  className = ''
}: SuperFastMediaUploaderProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({
    totalFiles: 0,
    completedFiles: 0,
    totalSize: 0,
    compressedSize: 0,
    totalUploadTime: 0,
    averageSpeed: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preUploadManagerRef = useRef<any>(null);

  // 初始化預上傳管理器
  useEffect(() => {
    const initPreUploadManager = async () => {
      try {
        const { getPreUploadManager } = await import('@/lib/preUploadCache');
        preUploadManagerRef.current = getPreUploadManager();
      } catch (error) {
        console.error('初始化預上傳管理器失敗:', error);
      }
    };
    
    initPreUploadManager();
  }, []);

  // 處理檔案選擇
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      
      // 檢查檔案類型
      const isValidType = mediaType === 'video' ? 
        file.type.startsWith('video/') : 
        file.type.startsWith('image/');
      
      if (!isValidType) {
        toast.error(`檔案 ${file.name} 不是有效的${mediaType === 'video' ? '影片' : '圖片'}格式`);
        continue;
      }

      // 檢查檔案大小
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`檔案 ${file.name} 超過大小限制 (${maxSizeMB}MB)`);
        continue;
      }

      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 生成預覽
      let preview: string | undefined;
      if (mediaType === 'photo') {
        preview = URL.createObjectURL(file);
      }

      newFiles.push({
        id: fileId,
        file,
        progress: 0,
        status: 'pending',
        preview
      });
    }

    setUploadFiles(prev => [...prev, ...newFiles]);
    
    // 自動開始預處理
    if (newFiles.length > 0) {
      await preprocessFiles(newFiles);
    }
  }, [mediaType, maxFiles, maxSizeMB]);

  // 預處理檔案（壓縮和快取）
  const preprocessFiles = async (files: UploadFile[]) => {
    setIsCompressing(true);
    
    try {
      const { getCompressionWorker } = await import('@/lib/compressionWorker');
      const worker = getCompressionWorker();
      
      for (const uploadFile of files) {
        try {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'compressing' }
              : f
          ));

          const result = await worker.compressFile(uploadFile.file, {
            quality: 0.8,
            format: mediaType === 'photo' ? 'webp' : undefined
          });
          
          if (result.success && result.compressedFile) {
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { 
                    ...f, 
                    compressedFile: result.compressedFile,
                    compressionStats: result.stats,
                    status: 'pending'
                  }
                : f
            ));
          }
        } catch (error) {
          console.error('壓縮失敗:', error);
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'pending' }
              : f
          ));
        }
      }
    } catch (error) {
      console.error('壓縮工作器載入失敗:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  // 開始超級上傳
  const startSuperUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setOverallProgress(0);
    const startTime = Date.now();

    try {
      // 使用預上傳管理器
      if (preUploadManagerRef.current) {
        const filesToUpload = uploadFiles
          .filter(f => f.status === 'pending')
          .map(f => f.compressedFile || f.file);
        
        const fileIds = await preUploadManagerRef.current.addFiles(filesToUpload, (progress: number) => {
          setOverallProgress(progress);
          onUploadProgress?.(progress);
        });

        // 開始上傳
        const results = await preUploadManagerRef.current.uploadFiles(fileIds, (progress: number) => {
          setOverallProgress(progress);
          onUploadProgress?.(progress);
        });

        const endTime = Date.now();
        const totalUploadTime = endTime - startTime;

        // 更新統計
        const totalSize = uploadFiles.reduce((sum, f) => sum + f.file.size, 0);
        const compressedSize = uploadFiles.reduce((sum, f) => 
          sum + (f.compressedFile?.size || f.file.size), 0);
        
        setUploadStats({
          totalFiles: uploadFiles.length,
          completedFiles: results.success,
          totalSize,
          compressedSize,
          totalUploadTime,
          averageSpeed: totalSize / (totalUploadTime / 1000) // bytes per second
        });

        // 更新上傳狀態
        setUploadFiles(prev => prev.map((f, index) => {
          const result = results.success > index ? { success: true } : { success: false };
          return {
            ...f,
            status: result.success ? 'completed' : 'error',
            progress: result.success ? 100 : 0
          };
        }));

        toast.success(`超級上傳完成！成功上傳 ${results.success}/${uploadFiles.length} 個檔案`);
        onUploadComplete?.(results);
      } else {
        // 回退到標準上傳
        await fallbackUpload();
      }
    } catch (error) {
      console.error('超級上傳失敗:', error);
      toast.error('上傳過程中發生錯誤');
    } finally {
      setIsUploading(false);
    }
  };

  // 回退上傳方法
  const fallbackUpload = async () => {
    const { getCDNManager } = await import('@/lib/cdnUpload');
    const cdnManager = getCDNManager();
    
    const filesToUpload = uploadFiles
      .filter(f => f.status === 'pending')
      .map(f => ({
        file: f.compressedFile || f.file,
        path: `${studentId}/${mediaType}s/${f.id}`
      }));
    
    const results = await cdnManager.uploadFiles(filesToUpload, (progress: number) => {
      setOverallProgress(progress);
      onUploadProgress?.(progress);
    });
    
    return results;
  };

  // 移除檔案
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // 清空所有檔案
  const clearAll = () => {
    uploadFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadFiles([]);
    setOverallProgress(0);
    setUploadStats({
      totalFiles: 0,
      completedFiles: 0,
      totalSize: 0,
      compressedSize: 0,
      totalUploadTime: 0,
      averageSpeed: 0
    });
  };

  // 獲取狀態圖標
  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'compressing':
        return <CpuChipIcon className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'uploading':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  // 獲取狀態文字
  const getStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return '上傳完成';
      case 'error':
        return '上傳失敗';
      case 'compressing':
        return '智能壓縮中...';
      case 'uploading':
        return '高速上傳中...';
      default:
        return '等待上傳';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上傳區域 */}
      <HanamiCard className="p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CloudArrowUpIcon className="h-12 w-12 text-blue-500" />
              <BoltIcon className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            🚀 超級高速上傳
          </h3>
          <p className="text-gray-600 mb-4">
            使用 Web Workers + CDN + 預上傳技術
            <br />
            支援 {mediaType === 'video' ? 'MP4, MOV, AVI' : 'JPEG, PNG, WebP'} 格式
            <br />
            最大檔案大小: {maxSizeMB}MB
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={mediaType === 'video' ? 'video/*' : 'image/*'}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <HanamiButton
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isCompressing}
            className="mb-4"
          >
            {isCompressing ? '智能壓縮中...' : '選擇檔案'}
          </HanamiButton>
          
          {uploadFiles.length > 0 && (
            <div className="flex gap-2 justify-center">
              <HanamiButton
                onClick={startSuperUpload}
                disabled={isUploading || isCompressing}
                variant="primary"
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {isUploading ? '超級上傳中...' : '🚀 開始超級上傳'}
              </HanamiButton>
              <HanamiButton
                onClick={clearAll}
                variant="secondary"
                disabled={isUploading || isCompressing}
              >
                清空
              </HanamiButton>
            </div>
          )}
        </div>
      </HanamiCard>

      {/* 上傳統計 */}
      {uploadStats.totalFiles > 0 && (
        <HanamiCard className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <GlobeAltIcon className="h-5 w-5 text-blue-500" />
            上傳統計
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{uploadStats.totalFiles}</div>
              <div className="text-gray-600">總檔案數</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{uploadStats.completedFiles}</div>
              <div className="text-gray-600">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {((uploadStats.totalSize - uploadStats.compressedSize) / uploadStats.totalSize * 100).toFixed(1)}%
              </div>
              <div className="text-gray-600">壓縮率</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {(uploadStats.averageSpeed / (1024 * 1024)).toFixed(1)} MB/s
              </div>
              <div className="text-gray-600">平均速度</div>
            </div>
          </div>
        </HanamiCard>
      )}

      {/* 檔案列表 */}
      {uploadFiles.length > 0 && (
        <HanamiCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">檔案列表 ({uploadFiles.length})</h4>
            {overallProgress > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {Math.round(overallProgress)}%
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {uploadFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                {/* 預覽 */}
                {uploadFile.preview && (
                  <img
                    src={uploadFile.preview}
                    alt={uploadFile.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                
                {/* 檔案資訊 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadFile.file.name}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatFileSize(uploadFile.file.size)}</span>
                    {uploadFile.compressionStats && (
                      <span className="text-green-600">
                        壓縮後: {formatFileSize(uploadFile.compressionStats.compressedSize)} 
                        ({Math.round(uploadFile.compressionStats.compressionRatio)}% 節省)
                      </span>
                    )}
                    {uploadFile.uploadStats && (
                      <span className="text-blue-600">
                        速度: {(uploadFile.uploadStats.speed / (1024 * 1024)).toFixed(1)} MB/s
                      </span>
                    )}
                  </div>
                  {uploadFile.error && (
                    <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                  )}
                </div>
                
                {/* 狀態 */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(uploadFile.status)}
                  <span className="text-sm text-gray-600">
                    {getStatusText(uploadFile.status)}
                  </span>
                </div>
                
                {/* 移除按鈕 */}
                {uploadFile.status === 'pending' && (
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </HanamiCard>
      )}
    </div>
  );
}
