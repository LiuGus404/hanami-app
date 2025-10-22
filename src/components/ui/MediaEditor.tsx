'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  XMarkIcon, 
  ScissorsIcon, 
  ArrowUpTrayIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CheckIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import AdvancedImageCrop from './AdvancedImageCrop';
import AdvancedVideoEditor from './AdvancedVideoEditor';
import { HanamiButton } from './HanamiButton';
import { toast } from 'react-hot-toast';

interface MediaEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
  type: 'video' | 'photo';
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VideoTrim {
  start: number;
  end: number;
}

export default function MediaEditor({ file, onSave, onCancel, type }: MediaEditorProps) {
  // 如果沒有文件，不渲染組件
  if (!file) {
    return null;
  }

  // 如果是相片類型，使用專業裁剪工具
  if (type === 'photo') {
    return (
      <AdvancedImageCrop
        file={file}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  // 如果是影片類型，使用專業影片編輯工具
  if (type === 'video') {
    return (
      <AdvancedVideoEditor
        file={file}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  // 相片裁剪相關狀態
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ 
    width: 0, 
    height: 0, 
    offsetX: 0, 
    offsetY: 0,
    naturalWidth: 0,
    naturalHeight: 0
  });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  
  // 影片剪輯相關狀態
  const [videoTrim, setVideoTrim] = useState<VideoTrim>({ start: 0, end: 0 });
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  // 壓縮設定
  const [compressionSettings, setCompressionSettings] = useState({
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxVideoDuration: 60 // 60秒
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化
  useEffect(() => {
    if (file) {
      setOriginalSize(file.size);
      setCompressedSize(file.size);
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      if (type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
          setVideoDuration(video.duration);
          setVideoTrim({ start: 0, end: video.duration });
        };
      } else if (type === 'photo') {
        // 相片的尺寸和裁剪區域將由 handleImageLoad 函數設置
        // 這裡只設置預覽 URL
      }
    }
    
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, type]);

  // 相片裁剪功能
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) {
      console.log('容器矩形未找到');
      return;
    }
    
    console.log('圖片加載完成:', {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height
    });
    
    // 計算圖片在容器中的實際顯示尺寸
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const imageAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let displayWidth, displayHeight, offsetX, offsetY;
    
    if (imageAspectRatio > containerAspectRatio) {
      // 圖片更寬，以容器寬度為準
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    } else {
      // 圖片更高，以容器高度為準
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    }
    
    const imageDims = { 
      width: displayWidth, 
      height: displayHeight,
      offsetX,
      offsetY,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    };
    
    const initialCropArea = { 
      x: offsetX, 
      y: offsetY, 
      width: displayWidth, 
      height: displayHeight 
    };
    
    console.log('設置圖片尺寸:', imageDims);
    console.log('設置初始裁剪區域:', initialCropArea);
    
    setImageDimensions(imageDims);
    setCropArea(initialCropArea);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (type !== 'photo') return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
  }, [type]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || type !== 'photo') return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 確保裁剪區域在圖片範圍內
    const minX = imageDimensions.offsetX;
    const minY = imageDimensions.offsetY;
    const maxX = imageDimensions.offsetX + imageDimensions.width;
    const maxY = imageDimensions.offsetY + imageDimensions.height;
    
    const clampedX = Math.max(minX, Math.min(maxX, x));
    const clampedY = Math.max(minY, Math.min(maxY, y));
    const clampedStartX = Math.max(minX, Math.min(maxX, dragStart.x));
    const clampedStartY = Math.max(minY, Math.min(maxY, dragStart.y));
    
    let newCropArea = {
      x: Math.min(clampedStartX, clampedX),
      y: Math.min(clampedStartY, clampedY),
      width: Math.abs(clampedX - clampedStartX),
      height: Math.abs(clampedY - clampedStartY)
    };
    
    // 如果設定了比例，調整裁剪區域
    if (aspectRatio) {
      const currentAspectRatio = newCropArea.width / newCropArea.height;
      if (currentAspectRatio > aspectRatio) {
        // 太寬了，調整寬度
        newCropArea.width = newCropArea.height * aspectRatio;
      } else {
        // 太高了，調整高度
        newCropArea.height = newCropArea.width / aspectRatio;
      }
      
      // 確保調整後仍在圖片範圍內
      if (newCropArea.x + newCropArea.width > maxX) {
        newCropArea.x = maxX - newCropArea.width;
      }
      if (newCropArea.y + newCropArea.height > maxY) {
        newCropArea.y = maxY - newCropArea.height;
      }
    }
    
    setCropArea(newCropArea);
  }, [isDragging, dragStart, type, imageDimensions, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 影片播放控制
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // 壓縮相片
  const compressImage = useCallback(async (file: File, quality: number, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 計算新尺寸
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 設置高品質渲染
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
        
        // 繪製壓縮後的圖片
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 根據文件類型選擇適當的 MIME 類型
        let mimeType = file.type;
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
          mimeType = 'image/jpeg';
        } else if (mimeType === 'image/png') {
          mimeType = 'image/png';
        } else if (mimeType === 'image/webp') {
          mimeType = 'image/webp';
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, mimeType, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // 壓縮影片
  const compressVideo = useCallback(async (file: File, maxDuration: number, maxFileSize: number): Promise<File> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        
        // 如果影片長度超過限制，需要剪輯
        if (duration > maxDuration) {
          // 使用 MediaRecorder API 進行影片剪輯和壓縮
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 設置畫布尺寸
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // 創建 MediaStream
          const stream = canvas.captureStream(30); // 30fps
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 1000000 // 1Mbps
          });
          
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const compressedFile = new File([blob], file.name, {
              type: 'video/webm',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          };
          
          // 開始錄製
          mediaRecorder.start();
          
          // 播放並錄製指定時長的影片
          video.currentTime = 0;
          video.play();
          
          const drawFrame = () => {
            if (video.currentTime < maxDuration && !video.paused) {
              ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
              requestAnimationFrame(drawFrame);
            } else {
              video.pause();
              mediaRecorder.stop();
            }
          };
          
          video.onplay = drawFrame;
        } else {
          // 檢查文件大小
          if (file.size <= maxFileSize) {
            resolve(file);
          } else {
            // 使用 MediaRecorder 進行壓縮
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const stream = canvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, {
              mimeType: 'video/webm;codecs=vp9',
              videoBitsPerSecond: Math.max(500000, (maxFileSize * 8) / duration) // 根據目標大小計算比特率
            });
            
            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                chunks.push(event.data);
              }
            };
            
            mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'video/webm' });
              const compressedFile = new File([blob], file.name, {
                type: 'video/webm',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            };
            
            mediaRecorder.start();
            
            video.currentTime = 0;
            video.play();
            
            const drawFrame = () => {
              if (!video.paused && !video.ended) {
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                requestAnimationFrame(drawFrame);
              } else {
                mediaRecorder.stop();
              }
            };
            
            video.onplay = drawFrame;
          }
        }
      };
    });
  }, []);

  // 裁剪相片
  const cropImage = useCallback(async (file: File, cropArea: CropArea): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 計算裁剪區域在原始圖片中的位置
        const scaleX = img.naturalWidth / imageDimensions.width;
        const scaleY = img.naturalHeight / imageDimensions.height;
        
        const sourceX = (cropArea.x - imageDimensions.offsetX) * scaleX;
        const sourceY = (cropArea.y - imageDimensions.offsetY) * scaleY;
        const sourceWidth = cropArea.width * scaleX;
        const sourceHeight = cropArea.height * scaleY;
        
        // 設置畫布尺寸
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        
        // 繪製裁剪後的圖片
        ctx?.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, sourceWidth, sourceHeight
        );
        
        // 根據文件類型選擇適當的 MIME 類型
        let mimeType = file.type;
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
          mimeType = 'image/jpeg';
        } else if (mimeType === 'image/png') {
          mimeType = 'image/png';
        } else if (mimeType === 'image/webp') {
          mimeType = 'image/webp';
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now()
            });
            resolve(croppedFile);
          } else {
            resolve(file);
          }
        }, mimeType);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [imageDimensions]);

  // 剪輯影片
  const trimVideo = useCallback(async (file: File, trim: VideoTrim): Promise<File> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 設置畫布尺寸
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // 創建 MediaStream
        const stream = canvas.captureStream(30); // 30fps
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 1000000 // 1Mbps
        });
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const trimmedFile = new File([blob], file.name, {
            type: 'video/webm',
            lastModified: Date.now()
          });
          resolve(trimmedFile);
        };
        
        // 開始錄製
        mediaRecorder.start();
        
        // 設置開始時間
        video.currentTime = trim.start;
        video.play();
        
        const drawFrame = () => {
          if (video.currentTime < trim.end && !video.paused && !video.ended) {
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
          } else {
            video.pause();
            mediaRecorder.stop();
          }
        };
        
        video.onplay = drawFrame;
      };
    });
  }, []);

  // 保存編輯結果
  const handleSave = useCallback(async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('開始處理...');
    
    try {
      let processedFile = file;
      
      if (type === 'photo') {
        // 裁剪相片
        if (cropArea.width > 0 && cropArea.height > 0) {
          setProcessingStatus('裁剪相片中...');
          setProcessingProgress(25);
          processedFile = await cropImage(processedFile, cropArea);
        }
        
        // 壓縮相片
        setProcessingStatus('壓縮相片中...');
        setProcessingProgress(75);
        processedFile = await compressImage(
          processedFile,
          compressionSettings.quality,
          compressionSettings.maxWidth,
          compressionSettings.maxHeight
        );
      } else if (type === 'video') {
        // 剪輯影片
        if (videoTrim.start > 0 || videoTrim.end < videoDuration) {
          setProcessingStatus('剪輯影片中...');
          setProcessingProgress(25);
          processedFile = await trimVideo(processedFile, videoTrim);
        }
        
        // 壓縮影片
        setProcessingStatus('壓縮影片中...');
        setProcessingProgress(75);
        processedFile = await compressVideo(
          processedFile,
          compressionSettings.maxVideoDuration,
          compressionSettings.maxFileSize
        );
      }
      
      setProcessingStatus('完成處理...');
      setProcessingProgress(100);
      setCompressedSize(processedFile.size);
      
      // 延遲一下讓用戶看到完成狀態
      setTimeout(() => {
        onSave(processedFile);
        toast.success('媒體處理完成！');
      }, 500);
    } catch (error) {
      console.error('處理媒體時發生錯誤:', error);
      toast.error('處理媒體時發生錯誤');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStatus('');
    }
  }, [file, type, cropArea, videoTrim, videoDuration, compressionSettings, cropImage, compressImage, trimVideo, compressVideo, onSave]);

  // 重置設定
  const handleReset = useCallback(() => {
    if (type === 'photo') {
      setCropArea({ 
        x: imageDimensions.offsetX, 
        y: imageDimensions.offsetY, 
        width: imageDimensions.width, 
        height: imageDimensions.height 
      });
    } else if (type === 'video') {
      setVideoTrim({ start: 0, end: videoDuration });
    }
    setCompressionSettings({
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      maxFileSize: 5 * 1024 * 1024,
      maxVideoDuration: 60
    });
    setAspectRatio(null);
  }, [type, imageDimensions, videoDuration]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {type === 'photo' ? (
              <Square3Stack3DIcon className="w-6 h-6 text-blue-600" />
            ) : (
              <ScissorsIcon className="w-6 h-6 text-blue-600" />
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {type === 'photo' ? '相片裁剪' : '影片剪輯'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
          {/* 預覽區域 */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-xl p-4 h-full border border-gray-200">
              {type === 'photo' ? (
                <div
                  ref={containerRef}
                  className="relative w-full h-full flex items-center justify-center"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {previewUrl && (
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="預覽"
                      className="max-w-full max-h-full object-contain"
                      onLoad={handleImageLoad}
                    />
                  )}
                  
                  {/* 裁剪框 */}
                  {cropArea.width > 0 && cropArea.height > 0 && (
                    <>
                      {/* 裁剪區域邊框 */}
                      <div
                        className="absolute border-2 border-blue-500 pointer-events-none"
                        style={{
                          left: cropArea.x,
                          top: cropArea.y,
                          width: cropArea.width,
                          height: cropArea.height
                        }}
                      />
                      
                      {/* 裁剪區域外的遮罩 - 確保裁剪區域內完全透明 */}
                      {/* 左側遮罩 */}
                      {cropArea.x > imageDimensions.offsetX && (
                        <div
                          className="absolute bg-white bg-opacity-30 pointer-events-none"
                          style={{
                            left: imageDimensions.offsetX,
                            top: imageDimensions.offsetY,
                            width: cropArea.x - imageDimensions.offsetX,
                            height: imageDimensions.height
                          }}
                        />
                      )}
                      {/* 右側遮罩 */}
                      {cropArea.x + cropArea.width < imageDimensions.offsetX + imageDimensions.width && (
                        <div
                          className="absolute bg-white bg-opacity-30 pointer-events-none"
                          style={{
                            left: cropArea.x + cropArea.width,
                            top: imageDimensions.offsetY,
                            width: (imageDimensions.offsetX + imageDimensions.width) - (cropArea.x + cropArea.width),
                            height: imageDimensions.height
                          }}
                        />
                      )}
                      {/* 上方遮罩 */}
                      {cropArea.y > imageDimensions.offsetY && (
                        <div
                          className="absolute bg-white bg-opacity-30 pointer-events-none"
                          style={{
                            left: imageDimensions.offsetX,
                            top: imageDimensions.offsetY,
                            width: imageDimensions.width,
                            height: cropArea.y - imageDimensions.offsetY
                          }}
                        />
                      )}
                      {/* 下方遮罩 */}
                      {cropArea.y + cropArea.height < imageDimensions.offsetY + imageDimensions.height && (
                        <div
                          className="absolute bg-white bg-opacity-30 pointer-events-none"
                          style={{
                            left: imageDimensions.offsetX,
                            top: cropArea.y + cropArea.height,
                            width: imageDimensions.width,
                            height: (imageDimensions.offsetY + imageDimensions.height) - (cropArea.y + cropArea.height)
                          }}
                        />
                      )}
                      {/* 裁剪區域邊角控制點 */}
                      <div
                        className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize"
                        style={{
                          left: cropArea.x - 6,
                          top: cropArea.y - 6
                        }}
                      />
                      <div
                        className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize"
                        style={{
                          left: cropArea.x + cropArea.width - 6,
                          top: cropArea.y - 6
                        }}
                      />
                      <div
                        className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize"
                        style={{
                          left: cropArea.x - 6,
                          top: cropArea.y + cropArea.height - 6
                        }}
                      />
                      <div
                        className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize"
                        style={{
                          left: cropArea.x + cropArea.width - 6,
                          top: cropArea.y + cropArea.height - 6
                        }}
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  {previewUrl && (
                    <video
                      ref={videoRef}
                      src={previewUrl}
                      className="max-w-full max-h-[60%] rounded-lg"
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                    />
                  )}
                  
                  {/* 播放控制 */}
                  <div className="mt-4 flex items-center gap-4">
                    <HanamiButton
                      variant="primary"
                      size="sm"
                      onClick={handlePlayPause}
                      className="flex items-center gap-2"
                    >
                      {isPlaying ? (
                        <PauseIcon className="w-4 h-4" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                      {isPlaying ? '暫停' : '播放'}
                    </HanamiButton>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600">
                        {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toFixed(0).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 控制面板 */}
          <div className="w-full lg:w-80 p-6 border-l border-gray-200 overflow-y-auto">
            <div className="space-y-6">
              {/* 文件信息 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">文件信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">原始大小:</span>
                    <span className="font-medium">{(originalSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">壓縮後:</span>
                    <span className="font-medium text-blue-600">
                      {(compressedSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">壓縮率:</span>
                    <span className="font-medium text-green-600">
                      {((1 - compressedSize / originalSize) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 裁剪/剪輯設定 */}
              {type === 'photo' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">裁剪設定</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        裁剪區域: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px
                      </label>
                      <div className="text-xs text-gray-600 mb-2">
                        拖拽選擇要保留的區域
                      </div>
                      <div className="text-xs text-gray-500">
                        位置: ({Math.round(cropArea.x)}, {Math.round(cropArea.y)})
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAspectRatio(16/9)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          aspectRatio === 16/9 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        16:9
                      </button>
                      <button
                        onClick={() => setAspectRatio(4/3)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          aspectRatio === 4/3 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        4:3
                      </button>
                      <button
                        onClick={() => setAspectRatio(1)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          aspectRatio === 1 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        1:1
                      </button>
                      <button
                        onClick={() => setAspectRatio(null)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          aspectRatio === null 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        自由
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {type === 'video' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">剪輯設定</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        開始時間: {videoTrim.start.toFixed(1)}秒
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        value={videoTrim.start}
                        onChange={(e) => setVideoTrim(prev => ({
                          ...prev,
                          start: parseFloat(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        結束時間: {videoTrim.end.toFixed(1)}秒
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        value={videoTrim.end}
                        onChange={(e) => setVideoTrim(prev => ({
                          ...prev,
                          end: parseFloat(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      剪輯長度: {(videoTrim.end - videoTrim.start).toFixed(1)}秒
                    </div>
                  </div>
                </div>
              )}

              {/* 壓縮設定 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">壓縮設定</h3>
                <div className="space-y-4">
                  {type === 'photo' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          品質: {Math.round(compressionSettings.quality * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={compressionSettings.quality}
                          onChange={(e) => setCompressionSettings(prev => ({
                            ...prev,
                            quality: parseFloat(e.target.value)
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大寬度: {compressionSettings.maxWidth}px
                        </label>
                        <input
                          type="range"
                          min="320"
                          max="3840"
                          step="160"
                          value={compressionSettings.maxWidth}
                          onChange={(e) => setCompressionSettings(prev => ({
                            ...prev,
                            maxWidth: parseInt(e.target.value)
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大高度: {compressionSettings.maxHeight}px
                        </label>
                        <input
                          type="range"
                          min="240"
                          max="2160"
                          step="120"
                          value={compressionSettings.maxHeight}
                          onChange={(e) => setCompressionSettings(prev => ({
                            ...prev,
                            maxHeight: parseInt(e.target.value)
                          }))}
                          className="w-full"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大時長: {compressionSettings.maxVideoDuration}秒
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="300"
                          step="10"
                          value={compressionSettings.maxVideoDuration}
                          onChange={(e) => setCompressionSettings(prev => ({
                            ...prev,
                            maxVideoDuration: parseInt(e.target.value)
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大文件大小: {(compressionSettings.maxFileSize / 1024 / 1024).toFixed(1)}MB
                        </label>
                        <input
                          type="range"
                          min="1024 * 1024"
                          max="50 * 1024 * 1024"
                          step="1024 * 1024"
                          value={compressionSettings.maxFileSize}
                          onChange={(e) => setCompressionSettings(prev => ({
                            ...prev,
                            maxFileSize: parseInt(e.target.value)
                          }))}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 處理進度 */}
              {isProcessing && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      {processingStatus}
                    </span>
                    <span className="text-sm text-blue-700">
                      {processingProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="flex flex-col gap-3">
                <HanamiButton
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                  {isProcessing ? '處理中...' : '保存'}
                </HanamiButton>
                
                <HanamiButton
                  variant="secondary"
                  size="md"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  重置
                </HanamiButton>
                
                <HanamiButton
                  variant="danger"
                  size="md"
                  onClick={onCancel}
                  className="flex items-center justify-center gap-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  取消
                </HanamiButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
