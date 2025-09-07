'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { HanamiButton } from './HanamiButton';
import { HanamiCard } from './HanamiCard';
import { smartCompress, previewCompression, DEFAULT_COMPRESSION_CONFIG } from '@/lib/mediaCompression';
import { quickUpload, UploadResult } from '@/lib/parallelUpload';
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
  };
}

interface EnhancedMediaUploaderProps {
  studentId: string;
  mediaType: 'video' | 'photo';
  maxFiles?: number;
  maxSizeMB?: number;
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadProgress?: (progress: number) => void;
  className?: string;
}

export function EnhancedMediaUploader({
  studentId,
  mediaType,
  maxFiles = 10,
  maxSizeMB = mediaType === 'video' ? 20 : 1,
  onUploadComplete,
  onUploadProgress,
  className = ''
}: EnhancedMediaUploaderProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [showCompressionPreview, setShowCompressionPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    // 自動開始壓縮預覽
    if (newFiles.length > 0) {
      await previewCompressionForFiles(newFiles);
    }
  }, [mediaType, maxFiles, maxSizeMB]);

  // 預覽壓縮效果
  const previewCompressionForFiles = async (files: UploadFile[]) => {
    setIsCompressing(true);
    
    for (const uploadFile of files) {
      try {
        const stats = await previewCompression(
          uploadFile.file, 
          DEFAULT_COMPRESSION_CONFIG[mediaType]
        );
        
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, compressionStats: stats }
            : f
        ));
      } catch (error) {
        console.error('壓縮預覽失敗:', error);
      }
    }
    
    setIsCompressing(false);
  };

  // 開始上傳
  const startUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setOverallProgress(0);

    try {
      // 壓縮檔案
      const compressedFiles: File[] = [];
      for (const uploadFile of uploadFiles) {
        if (uploadFile.status === 'pending') {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'compressing' }
              : f
          ));

          const compressedFile = await smartCompress(uploadFile.file, maxSizeMB);
          compressedFiles.push(compressedFile);
          
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, compressedFile, status: 'uploading' }
              : f
          ));
        }
      }

      // 並行上傳
      const results = await quickUpload(
        compressedFiles,
        studentId,
        mediaType,
        {
          maxConcurrentUploads: 3,
          chunkSize: 2 * 1024 * 1024,
          retryAttempts: 3,
          retryDelay: 1000
        },
        (stats) => {
          setOverallProgress(stats.overallProgress);
          onUploadProgress?.(stats.overallProgress);
        }
      );

      // 更新上傳狀態
      setUploadFiles(prev => prev.map((f, index) => {
        const result = results[index];
        return {
          ...f,
          status: result.success ? 'completed' : 'error',
          error: result.error,
          progress: result.success ? 100 : 0
        };
      }));

      const successCount = results.filter(r => r.success).length;
      toast.success(`成功上傳 ${successCount}/${results.length} 個檔案`);

      onUploadComplete?.(results);
    } catch (error) {
      console.error('上傳失敗:', error);
      toast.error('上傳過程中發生錯誤');
    } finally {
      setIsUploading(false);
    }
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
  };

  // 獲取狀態圖標
  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'compressing':
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
        return '壓縮中...';
      case 'uploading':
        return '上傳中...';
      default:
        return '等待上傳';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上傳區域 */}
      <HanamiCard className="p-6">
        <div className="text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            上傳{mediaType === 'video' ? '影片' : '相片'}
          </h3>
          <p className="text-gray-600 mb-4">
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
            {isCompressing ? '壓縮中...' : '選擇檔案'}
          </HanamiButton>
          
          {uploadFiles.length > 0 && (
            <div className="flex gap-2 justify-center">
              <HanamiButton
                onClick={startUpload}
                disabled={isUploading || isCompressing}
                variant="primary"
              >
                {isUploading ? '上傳中...' : '開始上傳'}
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

      {/* 檔案列表 */}
      {uploadFiles.length > 0 && (
        <HanamiCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">檔案列表 ({uploadFiles.length})</h4>
            {overallProgress > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
