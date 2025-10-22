'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  XMarkIcon, 
  PlayIcon,
  PauseIcon,
  ScissorsIcon,
  ArrowPathIcon,
  CheckIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface AdvancedVideoEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

interface VideoTrim {
  start: number;
  end: number;
}

interface VideoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function AdvancedVideoEditor({ file, onSave, onCancel }: AdvancedVideoEditorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoTrim, setVideoTrim] = useState<VideoTrim>({ start: 0, end: 0 });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [videoCrop, setVideoCrop] = useState<VideoCrop>({ x: 0, y: 0, width: 100, height: 100 });
  const [showCropOverlay, setShowCropOverlay] = useState<boolean>(false);
  const [cropMode, setCropMode] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [showCroppedPreview, setShowCroppedPreview] = useState<boolean>(false);
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef<string>('');

  // 初始化
  useEffect(() => {
    if (file) {
      setOriginalSize(file.size);
      setCompressedSize(file.size);
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      blobUrlRef.current = url;
      
      // 重置所有狀態（但保留進度條設定）
      setVideoDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
      // 不重置 videoTrim，保持之前的進度條設定
      setVideoCrop({ x: 0, y: 0, width: 100, height: 100 });
      setShowCropOverlay(false);
      setCropMode(false);
      setVideoDimensions({ width: 0, height: 0 });
      setProcessingProgress(0);
      setProcessingStatus('');
      setShowCroppedPreview(false);
      setShowTimeline(false);
      setIsInitialized(false);
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [file]);

  // 當影片加載完成時設置初始值
  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current && !isInitialized) {
      const duration = videoRef.current.duration;
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      
      setVideoDuration(duration);
      setVideoDimensions({ width, height });
      
      // 設置初始剪輯範圍：開始在 10% 位置，結束在 90% 位置
      const startTime = duration * 0.1;
      const endTime = duration * 0.9;
      setVideoTrim({ start: startTime, end: endTime });
      
      // 設置初始裁剪區域為全畫面
      setVideoCrop({ x: 0, y: 0, width: 100, height: 100 });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // 播放/暫停控制
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // 跳轉到指定時間
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // 格式化時間顯示
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 壓縮影片
  const compressVideo = useCallback(async (videoBlob: Blob): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) {
        resolve(new File([videoBlob], file.name, { type: file.type }));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(new File([videoBlob], file.name, { type: file.type }));
        return;
      }

      // 設置畫布尺寸（根據裁剪區域）
      const cropWidth = (videoCrop.width / 100) * video.videoWidth;
      const cropHeight = (videoCrop.height / 100) * video.videoHeight;
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      try {
        // 檢查 MediaRecorder 支援
        let mimeType: string;
        if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          // 如果不支援 vp9，嘗試其他格式
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
          } else if (MediaRecorder.isTypeSupported('video/webm')) {
            mimeType = 'video/webm';
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
          } else {
            // 如果都不支援，直接返回原文件
            resolve(new File([videoBlob], file.name, { type: file.type }));
            return;
          }
        } else {
          mimeType = 'video/webm;codecs=vp9';
        }

        // 創建 MediaRecorder 進行壓縮
        const stream = canvas.captureStream(30); // 30fps
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: 1000000 // 1Mbps
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: mimeType });
          const compressedFile = new File([compressedBlob], file.name, {
            type: mimeType,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        };

        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          reject(new Error('影片處理失敗'));
        };

        // 開始錄製
        mediaRecorder.start();
        
        // 設置開始時間
        video.currentTime = videoTrim.start;
        video.play();

        const drawFrame = () => {
          if (video.currentTime < videoTrim.end && !video.paused && !video.ended) {
            // 繪製裁剪後的影片幀
            const sourceX = (videoCrop.x / 100) * video.videoWidth;
            const sourceY = (videoCrop.y / 100) * video.videoHeight;
            const sourceWidth = (videoCrop.width / 100) * video.videoWidth;
            const sourceHeight = (videoCrop.height / 100) * video.videoHeight;
            
            ctx.drawImage(
              video,
              sourceX, sourceY, sourceWidth, sourceHeight, // 源區域（裁剪區域）
              0, 0, canvas.width, canvas.height // 目標區域（整個畫布）
            );
            requestAnimationFrame(drawFrame);
          } else {
            video.pause();
            mediaRecorder.stop();
          }
        };

        video.onplay = drawFrame;
      } catch (error) {
        console.error('影片壓縮錯誤:', error);
        // 如果壓縮失敗，返回原文件
        resolve(new File([videoBlob], file.name, { type: file.type }));
      }
    });
  }, [videoTrim, videoCrop, file]);

  // 處理保存
  const handleSave = useCallback(async () => {
    if (!videoRef.current || videoTrim.start >= videoTrim.end) {
      toast.error('請選擇有效的剪輯範圍');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('開始處理影片...');

    try {
      setProcessingStatus('剪輯影片中...');
      setProcessingProgress(30);

      // 創建剪輯後的影片
      const trimmedVideo = await compressVideo(file as any);

      setProcessingStatus('壓縮影片中...');
      setProcessingProgress(70);

      setProcessingStatus('完成處理...');
      setProcessingProgress(100);
      setCompressedSize(trimmedVideo.size);

      // 延遲一下讓用戶看到完成狀態
      setTimeout(() => {
        onSave(trimmedVideo);
        toast.success('影片剪輯完成！');
      }, 500);

    } catch (error) {
      console.error('處理影片時發生錯誤:', error);
      toast.error('處理影片時發生錯誤');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStatus('');
    }
  }, [videoTrim, compressVideo, onSave, file]);

  // 重置剪輯
  const handleReset = useCallback(() => {
    // 重置到初始位置：開始在 10% 位置，結束在 90% 位置
    const startTime = videoDuration * 0.1;
    const endTime = videoDuration * 0.9;
    setVideoTrim({ start: startTime, end: endTime });
    seekTo(startTime);
  }, [videoDuration, seekTo]);

  // 下載預覽
  const handleDownload = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 繪製當前幀
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const dataURL = canvas.toDataURL('image/png');
    
    if (hiddenAnchorRef.current) {
      hiddenAnchorRef.current.href = dataURL;
      hiddenAnchorRef.current.download = `video-preview-${Date.now()}.png`;
      hiddenAnchorRef.current.click();
    }
  }, []);

  // 設置開始時間
  const setStartTime = useCallback((time: number) => {
    const newTrim = { ...videoTrim, start: Math.min(time, videoTrim.end - 0.1) };
    setVideoTrim(newTrim);
    if (currentTime < newTrim.start) {
      seekTo(newTrim.start);
    }
  }, [videoTrim, currentTime, seekTo]);

  // 設置結束時間
  const setEndTime = useCallback((time: number) => {
    const newTrim = { ...videoTrim, end: Math.max(time, videoTrim.start + 0.1) };
    setVideoTrim(newTrim);
    if (currentTime > newTrim.end) {
      seekTo(newTrim.end);
    }
  }, [videoTrim, currentTime, seekTo]);

  // 切換裁剪模式
  const toggleCropMode = useCallback(() => {
    if (cropMode) {
      // 退出裁剪模式時，只保存裁剪尺寸，不保存進度
      // 裁剪尺寸已經在 videoCrop 狀態中，會自動保留
      setCropMode(false);
      setShowCropOverlay(false);
      setShowCroppedPreview(true); // 顯示裁剪後的預覽
    } else {
      // 進入裁剪模式
      setCropMode(true);
      setShowCropOverlay(true);
      setShowCroppedPreview(false); // 隱藏裁剪預覽，顯示完整影片
    }
  }, [cropMode]);

  // 重置裁剪區域
  const resetCropArea = useCallback(() => {
    setVideoCrop({ x: 0, y: 0, width: 100, height: 100 });
    setShowCroppedPreview(false); // 重置時隱藏裁剪預覽
  }, []);

  // 切換時間軸顯示
  const toggleTimeline = useCallback(() => {
    setShowTimeline(!showTimeline);
  }, [showTimeline]);

  // 處理裁剪區域拖拽
  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    if (!cropMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startCropArea = { ...videoCrop };
    
    // 獲取影片容器的實際尺寸
    const videoContainer = e.currentTarget.closest('.relative');
    const containerRect = videoContainer?.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRect) return;
      
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // 將滑鼠移動轉換為百分比（基於影片容器尺寸）
      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;
      
      const newX = Math.max(0, Math.min(100 - startCropArea.width, startCropArea.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100 - startCropArea.height, startCropArea.y + deltaYPercent));
      
      setVideoCrop(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [cropMode, videoCrop]);

  // 處理角落控制點拖拽
  const handleCornerMouseDown = useCallback((e: React.MouseEvent, corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    if (!cropMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startCropArea = { ...videoCrop };
    
    // 獲取影片容器的實際尺寸
    const videoContainer = e.currentTarget.closest('.relative');
    const containerRect = videoContainer?.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRect) return;
      
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // 將滑鼠移動轉換為百分比（基於影片容器尺寸）
      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;
      
      let newCrop = { ...startCropArea };
      
      switch (corner) {
        case 'top-left':
          newCrop.x = Math.max(0, Math.min(startCropArea.x + startCropArea.width - 5, startCropArea.x + deltaXPercent));
          newCrop.y = Math.max(0, Math.min(startCropArea.y + startCropArea.height - 5, startCropArea.y + deltaYPercent));
          newCrop.width = startCropArea.width - (newCrop.x - startCropArea.x);
          newCrop.height = startCropArea.height - (newCrop.y - startCropArea.y);
          break;
        case 'top-right':
          newCrop.y = Math.max(0, Math.min(startCropArea.y + startCropArea.height - 5, startCropArea.y + deltaYPercent));
          newCrop.width = Math.max(5, Math.min(100 - startCropArea.x, startCropArea.width + deltaXPercent));
          newCrop.height = startCropArea.height - (newCrop.y - startCropArea.y);
          break;
        case 'bottom-left':
          newCrop.x = Math.max(0, Math.min(startCropArea.x + startCropArea.width - 5, startCropArea.x + deltaXPercent));
          newCrop.width = startCropArea.width - (newCrop.x - startCropArea.x);
          newCrop.height = Math.max(5, Math.min(100 - startCropArea.y, startCropArea.height + deltaYPercent));
          break;
        case 'bottom-right':
          newCrop.width = Math.max(5, Math.min(100 - startCropArea.x, startCropArea.width + deltaXPercent));
          newCrop.height = Math.max(5, Math.min(100 - startCropArea.y, startCropArea.height + deltaYPercent));
          break;
      }
      
      setVideoCrop(newCrop);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [cropMode, videoCrop]);

  // 監聽影片時間更新
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-[#EADBC8]">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-[#EADBC8] bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-lg">
              <ScissorsIcon className="w-5 h-5 text-[#4B4036]" />
            </div>
            <h2 className="text-xl font-bold text-[#4B4036] font-quicksand">HanamiEcho Video Editor</h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 bg-white bg-opacity-60 rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
          >
            <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側：影片預覽 */}
            <div className="space-y-4">
              {/* 影片預覽 */}
              <div className="bg-white bg-opacity-60 rounded-xl p-4 border border-[#EADBC8]">
                <div className="relative">
                  {previewUrl && (
                    <div className="relative overflow-hidden rounded-lg shadow-lg" style={{
                      width: showCroppedPreview ? `${videoCrop.width}%` : '100%',
                      height: showCroppedPreview ? `${videoCrop.height}%` : 'auto',
                      marginLeft: showCroppedPreview ? `${videoCrop.x}%` : '0',
                      marginTop: showCroppedPreview ? `${videoCrop.y}%` : '0'
                    }}>
                      <video
                        ref={videoRef}
                        src={previewUrl}
                        className="w-full h-auto"
                        style={{
                          transform: showCroppedPreview ? `translate(-${videoCrop.x}%, -${videoCrop.y}%)` : 'none',
                          width: showCroppedPreview ? `${100 / (videoCrop.width / 100)}%` : '100%',
                          height: showCroppedPreview ? `${100 / (videoCrop.height / 100)}%` : 'auto'
                        }}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                      />
                    </div>
                  )}
                  
                  {/* 裁剪覆蓋層 */}
                  {showCropOverlay && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* 裁剪區域指示器 */}
                      <div
                        className="absolute border-2 border-yellow-400 bg-transparent cursor-move pointer-events-auto"
                        style={{
                          left: `${videoCrop.x}%`,
                          top: `${videoCrop.y}%`,
                          width: `${videoCrop.width}%`,
                          height: `${videoCrop.height}%`,
                        }}
                        onMouseDown={handleCropMouseDown}
                      >
                        {/* 四個角落的控制點 */}
                        <div 
                          className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white cursor-nw-resize hover:bg-yellow-500 transition-colors shadow-lg z-10 active:bg-yellow-600"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleCornerMouseDown(e, 'top-left');
                          }}
                          title="拖拽調整左上角"
                        ></div>
                        <div 
                          className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white cursor-ne-resize hover:bg-yellow-500 transition-colors shadow-lg z-10 active:bg-yellow-600"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleCornerMouseDown(e, 'top-right');
                          }}
                          title="拖拽調整右上角"
                        ></div>
                        <div 
                          className="absolute -bottom-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white cursor-sw-resize hover:bg-yellow-500 transition-colors shadow-lg z-10 active:bg-yellow-600"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleCornerMouseDown(e, 'bottom-left');
                          }}
                          title="拖拽調整左下角"
                        ></div>
                        <div 
                          className="absolute -bottom-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white cursor-se-resize hover:bg-yellow-500 transition-colors shadow-lg z-10 active:bg-yellow-600"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleCornerMouseDown(e, 'bottom-right');
                          }}
                          title="拖拽調整右下角"
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* 播放控制覆蓋層 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={togglePlayPause}
                      className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                    >
                      {isPlaying ? (
                        <PauseIcon className="w-8 h-8 text-white" />
                      ) : (
                        <PlayIcon className="w-8 h-8 text-white ml-1" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 文件信息 */}
              <div className="bg-white bg-opacity-60 rounded-xl p-3 border border-[#EADBC8]">
                <div className="text-sm text-[#4B4036]">
                  <div className="mb-1">
                    文件名: {file.name}
                  </div>
                  <div className="mb-1">
                    原始大小: {(originalSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div className="mb-1">
                    處理後大小: {(compressedSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div className="text-sm text-[#2B3A3B]">
                    總時長: {formatTime(videoDuration)}
                  </div>
                </div>
              </div>
            </div>

            {/* 右側：控制面板 */}
            <div className="space-y-4">
              {/* 剪映風格時間軸 */}
              {videoDuration > 0 && showTimeline && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      剪輯範圍: {formatTime(videoTrim.start)} - {formatTime(videoTrim.end)}
                    </label>
                    <div className="relative">
                      {/* 時間軸容器 */}
                      <div 
                        className="relative h-8 bg-white bg-opacity-60 rounded-lg border border-[#EADBC8] overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percentage = Math.max(0, Math.min(1, x / rect.width));
                          const newTime = percentage * videoDuration;
                          seekTo(newTime);
                        }}
                      >
                        {/* 背景時間軸 */}
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-1 bg-gray-300 rounded-full mx-2"></div>
                        </div>
                        
                        {/* 時間標記 */}
                        <div className="absolute inset-0 flex justify-between items-center px-2">
                          {Array.from({ length: 5 }, (_, i) => {
                            const time = (videoDuration / 4) * i;
                            return (
                              <div key={i} className="text-xs text-[#4B4036] font-medium">
                                {formatTime(time)}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* 剪輯範圍指示器 */}
                        <div
                          className="absolute top-0 h-full bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-lg opacity-60"
                          style={{
                            left: `${(videoTrim.start / videoDuration) * 100}%`,
                            width: `${((videoTrim.end - videoTrim.start) / videoDuration) * 100}%`
                          }}
                        />
                        
                        {/* 開始時間拖拽點 */}
                        <div
                          className="absolute top-0 w-5 h-full bg-gradient-to-b from-[#FF6B6B] to-[#FF8E8E] rounded-l-lg cursor-ew-resize flex flex-col items-center justify-center hover:from-[#FF5252] hover:to-[#FF7979] transition-all duration-200 z-10 shadow-lg"
                          style={{ left: `${(videoTrim.start / videoDuration) * 100}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const container = e.currentTarget.parentElement;
                            if (!container) return;
                            
                            const startDrag = (moveEvent: MouseEvent) => {
                              const rect = container.getBoundingClientRect();
                              const x = moveEvent.clientX - rect.left;
                              const percentage = Math.max(0, Math.min(1, x / rect.width));
                              const newTime = percentage * videoDuration;
                              const clampedTime = Math.max(0, Math.min(videoTrim.end - 0.1, newTime));
                              setStartTime(clampedTime);
                            };
                            
                            const stopDrag = () => {
                              document.removeEventListener('mousemove', startDrag);
                              document.removeEventListener('mouseup', stopDrag);
                            };
                            
                            document.addEventListener('mousemove', startDrag);
                            document.addEventListener('mouseup', stopDrag);
                          }}
                        >
                          <div className="w-1 h-6 bg-white rounded-full shadow-sm mb-1"></div>
                          <div className="text-xs text-white font-medium leading-tight text-center px-1">
                            設定<br/>開始
                          </div>
                        </div>
                        
                        {/* 結束時間拖拽點 */}
                        <div
                          className="absolute top-0 w-5 h-full bg-gradient-to-b from-[#4ECDC4] to-[#6EDDD6] rounded-r-lg cursor-ew-resize flex flex-col items-center justify-center hover:from-[#26A69A] hover:to-[#4DB6AC] transition-all duration-200 z-10 shadow-lg"
                          style={{ left: `${(videoTrim.end / videoDuration) * 100}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const container = e.currentTarget.parentElement;
                            if (!container) return;
                            
                            const startDrag = (moveEvent: MouseEvent) => {
                              const rect = container.getBoundingClientRect();
                              const x = moveEvent.clientX - rect.left;
                              const percentage = Math.max(0, Math.min(1, x / rect.width));
                              const newTime = percentage * videoDuration;
                              const clampedTime = Math.max(videoTrim.start + 0.1, Math.min(videoDuration, newTime));
                              setEndTime(clampedTime);
                            };
                            
                            const stopDrag = () => {
                              document.removeEventListener('mousemove', startDrag);
                              document.removeEventListener('mouseup', stopDrag);
                            };
                            
                            document.addEventListener('mousemove', startDrag);
                            document.addEventListener('mouseup', stopDrag);
                          }}
                        >
                          <div className="w-1 h-6 bg-white rounded-full shadow-sm mb-1"></div>
                          <div className="text-xs text-white font-medium leading-tight text-center px-1">
                            設定<br/>結束
                          </div>
                        </div>
                        
                        {/* 當前播放位置指示器 */}
                        <div
                          className="absolute top-0 w-1 h-full bg-red-500 cursor-pointer hover:bg-red-600 transition-colors"
                          style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const container = e.currentTarget.parentElement;
                            if (container) {
                              const rect = container.getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const percentage = Math.max(0, Math.min(1, x / rect.width));
                              const newTime = percentage * videoDuration;
                              seekTo(newTime);
                            }
                          }}
                        />
                      </div>
                      
                      {/* 快捷按鈕 */}
                      <div className="flex justify-between mt-2">
                        <button
                          onClick={() => setStartTime(Math.max(0, currentTime - 1))}
                          className="px-2 py-1 text-xs bg-white bg-opacity-60 text-[#4B4036] rounded hover:bg-opacity-80 transition-colors"
                        >
                          -1s
                        </button>
                        <button
                          onClick={() => setStartTime(currentTime)}
                          className="px-2 py-1 text-xs bg-white bg-opacity-60 text-[#4B4036] rounded hover:bg-opacity-80 transition-colors"
                        >
                          設為開始
                        </button>
                        <button
                          onClick={() => setEndTime(currentTime)}
                          className="px-2 py-1 text-xs bg-white bg-opacity-60 text-[#4B4036] rounded hover:bg-opacity-80 transition-colors"
                        >
                          設為結束
                        </button>
                        <button
                          onClick={() => setEndTime(Math.min(videoDuration, currentTime + 1))}
                          className="px-2 py-1 text-xs bg-white bg-opacity-60 text-[#4B4036] rounded hover:bg-opacity-80 transition-colors"
                        >
                          +1s
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 剪輯信息 */}
              {videoDuration > 0 && (
                <div className="bg-white bg-opacity-60 rounded-xl p-3 border border-[#EADBC8]">
                  <div className="text-sm text-[#4B4036]">
                    <div className="mb-1">
                      剪輯時長: {formatTime(videoTrim.end - videoTrim.start)}
                    </div>
                    <div className="mb-1">
                      剪輯範圍: {formatTime(videoTrim.start)} - {formatTime(videoTrim.end)}
                    </div>
                    {cropMode && (
                      <div className="pt-2 border-t border-[#EADBC8]">
                        <div className="text-xs text-[#2B3A3B] mb-1">裁剪區域:</div>
                        <div className="text-xs">
                          位置: {Math.round(videoCrop.x)}%, {Math.round(videoCrop.y)}%
                        </div>
                        <div className="text-xs">
                          尺寸: {Math.round(videoCrop.width)}% × {Math.round(videoCrop.height)}%
                        </div>
                      </div>
                    )}
                    <div className="mt-1 text-xs text-[#2B3A3B] opacity-75">
                      總時長: {formatTime(videoDuration)}
                    </div>
                  </div>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="space-y-3">
                {/* 時間軸控制按鈕 */}
                <div className="flex gap-2">
                  <button
                    onClick={toggleTimeline}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-[#EADBC8] ${
                      showTimeline 
                        ? 'bg-gradient-to-r from-[#4ECDC4] to-[#6EDDD6] text-white' 
                        : 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-[#4B4036] hover:from-[#FFD59A] hover:to-[#EBC9A4]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">{showTimeline ? '隱藏時間軸' : '編輯時間軸'}</span>
                  </button>
                </div>
                
                {/* 裁剪控制按鈕 */}
                <div className="flex gap-2">
                  <button
                    onClick={toggleCropMode}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-[#EADBC8] ${
                      cropMode 
                        ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white' 
                        : 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-[#4B4036] hover:from-[#FFD59A] hover:to-[#EBC9A4]'
                    }`}
                  >
                    <ScissorsIcon className="w-5 h-5" />
                    <span className="font-semibold">{cropMode ? '退出裁剪' : '裁剪模式'}</span>
                  </button>
                  
                  {cropMode && (
                    <button
                      onClick={resetCropArea}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#4ECDC4] to-[#6EDDD6] text-white rounded-2xl hover:from-[#26A69A] hover:to-[#4DB6AC] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-[#EADBC8]"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={handleSave}
                  disabled={isProcessing || videoTrim.start >= videoTrim.end}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#4ECDC4] to-[#6EDDD6] text-white rounded-2xl hover:from-[#26A69A] hover:to-[#4DB6AC] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-[#EADBC8]"
                >
                  <CheckIcon className="w-6 h-6" />
                  <span className="font-semibold text-lg">保存剪輯</span>
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-[#4B4036] rounded-2xl hover:from-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-[#EADBC8]"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    <span className="font-semibold">重置</span>
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-2xl hover:from-[#EBC9A4] hover:to-[#FFB6C1] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-[#EADBC8]"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span className="font-semibold">下載預覽</span>
                  </button>
                </div>
              </div>
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
                  className="bg-gradient-to-r from-[#4ECDC4] to-[#6EDDD6] h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 隱藏的畫布用於處理 */}
      <canvas
        ref={canvasRef}
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