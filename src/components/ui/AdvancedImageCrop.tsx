'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  XMarkIcon, 
  ArrowPathIcon,
  CheckIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface AdvancedImageCropProps {
  file: File;
  onSave: (croppedFile: File) => void;
  onCancel: () => void;
}

export default function AdvancedImageCrop({ file, onSave, onCancel }: AdvancedImageCropProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef<string>('');

  // 生成預覽 URL
  const [previewUrl, setPreviewUrl] = useState<string>('');

  React.useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      blobUrlRef.current = url;
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [file]);

  // 當圖片加載完成時，設置初始裁剪區域
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // 設置初始裁剪區域為圖片中心，大小為圖片的 80%
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        aspect || 1,
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(crop);
  }, [aspect]);

  // 壓縮圖片
  const compressImage = useCallback(async (canvas: HTMLCanvasElement, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      try {
        // 檢查支援的格式
        let mimeType = file.type;
        if (!mimeType || mimeType === '') {
          mimeType = 'image/jpeg';
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          mimeType,
          quality
        );
      } catch (error) {
        console.error('圖片壓縮錯誤:', error);
        resolve(file);
      }
    });
  }, [file]);

  // 處理裁剪
  const handleSave = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      toast.error('請先選擇裁剪區域');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('開始處理...');

    try {
      const image = imgRef.current;
      const canvas = previewCanvasRef.current;
      const crop = completedCrop;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('無法獲取畫布上下文');
      }

      setProcessingStatus('裁剪圖片中...');
      setProcessingProgress(30);

      // 設置畫布尺寸
      canvas.width = crop.width;
      canvas.height = crop.height;

      // 繪製裁剪後的圖片
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      setProcessingStatus('壓縮圖片中...');
      setProcessingProgress(70);

      // 壓縮圖片
      const compressedFile = await compressImage(canvas, 0.8);

      setProcessingStatus('完成處理...');
      setProcessingProgress(100);

      // 延遲一下讓用戶看到完成狀態
      setTimeout(() => {
        onSave(compressedFile);
        toast.success('圖片裁剪完成！');
      }, 500);

    } catch (error) {
      console.error('處理圖片時發生錯誤:', error);
      toast.error('處理圖片時發生錯誤');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStatus('');
    }
  }, [completedCrop, compressImage, onSave]);

  // 重置裁剪
  const handleReset = useCallback(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          aspect || 1,
          width,
          height
        ),
        width,
        height
      );
      setCrop(crop);
    }
  }, [aspect]);

  // 下載預覽
  const handleDownload = useCallback(() => {
    if (!previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    
    if (hiddenAnchorRef.current) {
      hiddenAnchorRef.current.href = dataURL;
      hiddenAnchorRef.current.download = `cropped-${file.name}`;
      hiddenAnchorRef.current.click();
    }
  }, [file.name]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-[#EADBC8]">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-[#EADBC8] bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-lg">
              <Square3Stack3DIcon className="w-5 h-5 text-[#4B4036]" />
            </div>
            <h2 className="text-xl font-bold text-[#4B4036] font-quicksand">HanamiEcho Photo Editor</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white hover:bg-opacity-30 rounded-full transition-all duration-200 hover:scale-110 transform"
          >
            <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
          {/* 裁剪區域 */}
          <div className="flex-1 p-6">
            <div className="bg-gradient-to-br from-[#FFFDF8] to-[#FFF9F2] rounded-2xl p-4 h-full border border-[#EADBC8] shadow-inner">
              {previewUrl && (
                <div className="w-full h-full flex items-center justify-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    className="max-w-full max-h-full"
                  >
                    <img
                      ref={imgRef}
                      alt="裁剪預覽"
                      src={previewUrl}
                      className="max-w-full max-h-full object-contain"
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>
              )}
            </div>
          </div>

          {/* 控制面板 */}
          <div className="w-full lg:w-80 p-6 border-l border-[#EADBC8] overflow-y-auto bg-gradient-to-b from-[#FFFDF8] to-[#FFF9F2]">
            <div className="space-y-6">
              {/* 文件信息 */}
              <div className="bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-2xl p-4 shadow-lg border border-[#EADBC8]">
                <h3 className="font-semibold text-[#4B4036] mb-3">
                  文件信息
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#2B3A3B]">文件名:</span>
                    <span className="font-medium text-[#4B4036] truncate max-w-32">{file.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#2B3A3B]">原始大小:</span>
                    <span className="font-medium text-[#4B4036]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#2B3A3B]">文件類型:</span>
                    <span className="font-medium text-[#4B4036]">{file.type}</span>
                  </div>
                </div>
              </div>

              {/* 裁剪設定 */}
              <div className="bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-2xl p-4 shadow-lg border border-[#EADBC8]">
                <h3 className="font-semibold text-[#4B4036] mb-3">
                  裁剪設定
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      比例設定
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setAspect(undefined)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          aspect === undefined 
                            ? 'bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] text-white shadow-lg' 
                            : 'bg-white bg-opacity-60 text-[#4B4036] hover:bg-opacity-80 shadow-sm'
                        }`}
                      >
                        自由
                      </button>
                      <button
                        onClick={() => setAspect(1)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          aspect === 1 
                            ? 'bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] text-white shadow-lg' 
                            : 'bg-white bg-opacity-60 text-[#4B4036] hover:bg-opacity-80 shadow-sm'
                        }`}
                      >
                        1:1
                      </button>
                      <button
                        onClick={() => setAspect(16/9)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          aspect === 16/9 
                            ? 'bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] text-white shadow-lg' 
                            : 'bg-white bg-opacity-60 text-[#4B4036] hover:bg-opacity-80 shadow-sm'
                        }`}
                      >
                        16:9
                      </button>
                      <button
                        onClick={() => setAspect(4/3)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          aspect === 4/3 
                            ? 'bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] text-white shadow-lg' 
                            : 'bg-white bg-opacity-60 text-[#4B4036] hover:bg-opacity-80 shadow-sm'
                        }`}
                      >
                        4:3
                      </button>
                    </div>
                  </div>

                  {completedCrop && (
                    <div className="bg-white bg-opacity-60 rounded-xl p-3 border border-[#EADBC8]">
                      <div className="text-sm text-[#4B4036]">
                        <div className="mb-1">
                          <span>裁剪尺寸: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)}px</span>
                        </div>
                        <div>
                          <span>位置: ({Math.round(completedCrop.x)}, {Math.round(completedCrop.y)})</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 處理進度 */}
              {isProcessing && (
                <div className="bg-gradient-to-r from-[#E0F2E0] to-[#FFD59A] rounded-2xl p-4 border border-[#EADBC8] shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#4B4036]">
                      {processingStatus}
                    </span>
                    <span className="text-sm text-[#2B3A3B] font-bold">
                      {processingProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-white bg-opacity-60 rounded-full h-3 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] h-3 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={!completedCrop || isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-[#4B4036] rounded-2xl hover:from-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-[#EADBC8]"
                >
                  <CheckIcon className="w-5 h-5" />
                  <span className="font-semibold">保存裁剪</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#EADBC8] to-[#FFD59A] text-[#4B4036] rounded-2xl hover:from-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-[#EADBC8]"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span className="font-medium">重置</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    disabled={!completedCrop || isProcessing}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E0F2E0] to-[#FFD59A] text-[#4B4036] rounded-2xl hover:from-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-[#EADBC8]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">預覽</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 隱藏的畫布用於處理 */}
      <canvas
        ref={previewCanvasRef}
        style={{
          display: 'none',
        }}
      />

      {/* 隱藏的下載鏈接 */}
      <a
        ref={hiddenAnchorRef}
        style={{
          display: 'none',
        }}
      />
    </div>
  );
}
