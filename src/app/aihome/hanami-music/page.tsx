'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// 全域類型定義
declare global {
  interface Window {
    __hanamiBubbleManager?: {
      timer: NodeJS.Timeout | null;
      isRunning: boolean;
      bubbles: any[];
      updateCallback: ((bubbles: any[]) => void) | null;
      currentBubbles: any[];
      domContainer: HTMLElement | null;
      nextBubbleIndex: number;
      imageIndexCounter: number; // 新增圖片索引計數器
      imageOrder?: number[]; // 圖片顯示順序（完整覆蓋0..n-1）
      imageCursor?: number;  // 當前游標
    };
  }
}
import { 
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  AcademicCapIcon,
  StarIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  MapIcon,
  PlayIcon,
  HeartIcon,
  MusicalNoteIcon,
  GiftIcon,
  SparklesIcon,
  TrophyIcon,
  CheckCircleIcon,
  BookOpenIcon,
  UserCircleIcon,
  ShareIcon,
  VideoCameraIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  MusicalNoteIcon as TikTokIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import AppSidebar from '@/components/AppSidebar';
import { supabase } from '@/lib/supabase';

export default function HanamiMusicHomePage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [photoBubbles, setPhotoBubbles] = useState<Array<{
    id: string;
    x: number;
    y: number;
    size: number;
    opacity: number;
    scale: number;
    rotation: number;
    imageIndex: number;
    delay: number;
    isFading: boolean;
    isHovered: boolean; // 新增懸停狀態
    createdTime: number;
    expiresAt: number; // 預先計算的到期時間
    lifeDuration: number; // 生命週期長度
    movementDirection: 'left' | 'right' | 'up' | 'down' | 'diagonal';
    sizeChangeDirection: 'grow' | 'shrink';
  }>>([]);
  const [shuffledPhotoIndices, setShuffledPhotoIndices] = useState<number[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  
  // 地圖 URL - 使用簡單的香港地圖作為測試
  const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3691.123456789!2d114.1711689236447!3d22.31635215808169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3404016b2580ddbf%3A0x306292da37e80235!2z6Iqx6KaL55C06IiNIEhhbmFtaSBNdXNpYw!5e0!3m2!1szh-TW!2sjp!4v1760902449350!5m2!1szh-TW!2sjp";

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 地圖載入超時處理
  useEffect(() => {
    if (mapLoading) {
      const timeout = setTimeout(() => {
        console.log('地圖載入超時');
        setMapLoading(false);
        setMapError(true);
      }, 10000); // 10秒超時
      
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [mapLoading]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 登出處理
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 評論圖片列表
  const commentImages = [
    '/HanamiMusic/comment/IMG_7997.jpg',
    '/HanamiMusic/comment/IMG_7996.jpg',
    '/HanamiMusic/comment/IMG_7995.jpg',
    '/HanamiMusic/comment/IMG_7994.jpg',
    '/HanamiMusic/comment/IMG_7993.jpg',
    '/HanamiMusic/comment/IMG_7992.jpg',
    '/HanamiMusic/comment/IMG_7991.jpg',
    '/HanamiMusic/comment/IMG_7990.jpg',
    '/HanamiMusic/comment/IMG_7989.jpg',
    '/HanamiMusic/comment/IMG_7988.jpg',
    '/HanamiMusic/comment/IMG_7987.jpg',
    '/HanamiMusic/comment/IMG_7986.jpg',
    '/HanamiMusic/comment/IMG_7985.jpg',
    '/HanamiMusic/comment/IMG_7984.jpg',
    '/HanamiMusic/comment/IMG_7983.jpg',
    '/HanamiMusic/comment/IMG_7982.jpg',
    '/HanamiMusic/comment/IMG_7981.jpg',
    '/HanamiMusic/comment/IMG_7980.jpg',
    '/HanamiMusic/comment/IMG_7979.jpg',
    '/HanamiMusic/comment/IMG_7978.jpg',
    '/HanamiMusic/comment/IMG_7977.jpg',
    '/HanamiMusic/comment/IMG_7976.jpg',
    '/HanamiMusic/comment/IMG_7975.jpg',
    '/HanamiMusic/comment/IMG_7974.jpg',
    '/HanamiMusic/comment/IMG_7973.jpg',
    '/HanamiMusic/comment/IMG_7972.jpg',
    '/HanamiMusic/comment/IMG_7971.jpg',
    '/HanamiMusic/comment/IMG_7970.jpg',
    '/HanamiMusic/comment/IMG_7969.jpg',
    '/HanamiMusic/comment/IMG_7968.jpg',
    '/HanamiMusic/comment/IMG_7967.jpg',
    '/HanamiMusic/comment/IMG_7966.jpg',
    '/HanamiMusic/comment/IMG_7965.jpg',
    '/HanamiMusic/comment/IMG_7964.jpg',
    '/HanamiMusic/comment/IMG_7963.jpg',
    '/HanamiMusic/comment/IMG_7962.jpg',
    '/HanamiMusic/comment/IMG_7961.jpg',
    '/HanamiMusic/comment/IMG_7960.jpg',
    '/HanamiMusic/comment/IMG_7959.jpg',
    '/HanamiMusic/comment/IMG_7958.jpg',
    '/HanamiMusic/comment/IMG_7957.jpg',
    '/HanamiMusic/comment/IMG_7956.jpg',
    '/HanamiMusic/comment/IMG_7955.jpg',
    '/HanamiMusic/comment/IMG_7954.jpg',
    '/HanamiMusic/comment/IMG_7953.jpg',
    '/HanamiMusic/comment/IMG_7952.jpg',
    '/HanamiMusic/comment/IMG_7951.jpg',
    '/HanamiMusic/comment/IMG_7950.jpg',
    '/HanamiMusic/comment/IMG_7949.jpg',
    '/HanamiMusic/comment/IMG_7948.jpg',
    '/HanamiMusic/comment/IMG_7947.jpg',
    '/HanamiMusic/comment/IMG_7946.jpg',
    '/HanamiMusic/comment/IMG_7945.jpg',
    '/HanamiMusic/comment/IMG_7944.jpg',
    '/HanamiMusic/comment/IMG_7943.jpg',
    '/HanamiMusic/comment/IMG_7942.jpg',
    '/HanamiMusic/comment/IMG_7941.jpg',
    '/HanamiMusic/comment/IMG_7940.jpg',
    '/HanamiMusic/comment/IMG_7939.jpg',
    '/HanamiMusic/comment/IMG_7938.jpg',
    '/HanamiMusic/comment/comment1.jpeg'
  ];

  // Class photos for floating bubbles
  const classPhotos = [
    '/HanamiMusic/classphoto/62762CA8-6C45-43CE-A06C-FF516E88695F.jpeg',
    '/HanamiMusic/classphoto/7ED99169-407F-4FF8-A5DD-D27780FADCB2.jpeg',
    '/HanamiMusic/classphoto/316681CA-D9BD-4F43-B3B3-A2F7E1F866A5.jpeg',
    '/HanamiMusic/classphoto/719BE878-1C45-4680-B14B-E34B56D2C996.jpeg',
    '/HanamiMusic/classphoto/D7CC7F76-0C0C-4A1D-A2CF-8FC5CF8731F1.jpeg',
    '/HanamiMusic/classphoto/F9A14936-CAA6-40CE-BB55-3A116766244B.jpeg',
    '/HanamiMusic/classphoto/D3B2CE5D-C88D-466F-99AB-0E4140D0B17D.jpeg',
    '/HanamiMusic/classphoto/55136099-4C21-4013-918E-303E52705C6C.jpeg',
    '/HanamiMusic/classphoto/865CD52F-932E-452E-A471-0C44CF95800B.jpeg',
    '/HanamiMusic/classphoto/EE41C023-B00B-4985-9E06-5EFA7FD5C48C.jpeg',
    '/HanamiMusic/classphoto/1AC680F6-3E40-4EA7-A0B9-53FAC6665CB2.jpeg',
    '/HanamiMusic/classphoto/516C590A-5296-494E-AF03-8320CA2292B1.jpeg',
    '/HanamiMusic/classphoto/EAC35365-01E3-4F3A-8FCA-0D282A26F809.jpeg',
    '/HanamiMusic/classphoto/D6CE50E9-E453-4A3A-814B-7E20F4AD47EB.jpeg',
    '/HanamiMusic/classphoto/D970559A-AA7C-4A21-8293-7FBE06471EBE.jpeg',
    '/HanamiMusic/classphoto/EBBF1601-24C2-4F60-BAEF-E21FF8B7FB0B.jpeg',
    '/HanamiMusic/classphoto/37D70A30-5AE9-4B5D-B070-106015BA0C4F.jpeg',
    '/HanamiMusic/classphoto/2CA6A8AE-4E08-4837-A01E-408916BDA6D8.jpeg'
  ];

  // 家長見證數據
  const testimonials = [
    {
      id: 1,
      name: '李媽媽',
      avatar: '/@girl(front).png',
      content: '孩子從原本不愛練琴到現在每天主動練習，Hanami Music 的教學方法真的很神奇！',
      rating: 5,
      child: '小美 (6歲)',
      commentImage: commentImages[0]
    },
    {
      id: 2,
      name: '陳爸爸',
      avatar: '/@boy(front).png',
      content: '老師非常有耐心，用遊戲的方式讓孩子愛上音樂，現在孩子每天都期待上課！',
      rating: 5,
      child: '小明 (5歲)',
      commentImage: commentImages[1]
    },
    {
      id: 3,
      name: '王媽媽',
      avatar: '/@girl(front).png',
      content: '課程設計很用心，孩子不僅學會了音樂，還培養了專注力和自信心。',
      rating: 5,
      child: '小華 (4歲)',
      commentImage: commentImages[2]
    }
  ];

  // 學生證書照片
  const certificatePhotos = [
    '/HanamiMusic/marks/LCM證書.zip - 100.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 101.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 102.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 103.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 104.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 105.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 106.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 107.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 55.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 56.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 57.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 58.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 59.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 60.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 61.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 62.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 63.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 64.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 65.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 66.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 67.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 68.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 69.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 70.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 71.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 72.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 73.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 74.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 75.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 76.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 77.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 78.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 79.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 80.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 81.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 82.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 83.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 84.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 85.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 86.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 87.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 88.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 89.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 90.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 91.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 92.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 93.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 94.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 95.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 96.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 97.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 98.jpg',
    '/HanamiMusic/marks/LCM證書.zip - 99.jpg'
  ];

  // 每批顯示的照片數量
  const photosPerBatch = 24;
  const totalBatches = Math.ceil(certificatePhotos.length / photosPerBatch);

  // 處理批次切換
  const handlePreviousBatch = useCallback(() => {
    setCurrentBatch(prev => (prev - 1 + totalBatches) % totalBatches);
  }, [totalBatches]);

  const handleNextBatch = useCallback(() => {
    setCurrentBatch(prev => (prev + 1) % totalBatches);
  }, [totalBatches]);

  // 學生成果展示
  const achievements = [
    {
      id: 1,
      title: '鋼琴演奏比賽',
      student: '小美',
      achievement: '幼兒組優勝獎',
      image: '/@girl(front).png'
    },
    {
      id: 2,
      title: '音樂節表演',
      student: '小明',
      achievement: '最佳表演獎',
      image: '/@boy(front).png'
    },
    {
      id: 3,
      title: '校園音樂會',
      student: '小華',
      achievement: '創意演奏獎',
      image: '/@girl(front).png'
    },
    {
      id: 4,
      title: '社區音樂節',
      student: '小樂',
      achievement: '明日之星獎',
      image: '/@boy(front).png'
    }
  ];

  // 教師資料
  const teachers = [
    {
      id: 1,
      name: '陳老師',
      title: '音樂教育碩士',
      experience: '8年教學經驗',
      specialty: '幼兒音樂啟蒙',
      avatar: '/teacher.png'
    },
    {
      id: 2,
      name: '李老師',
      title: '鋼琴演奏碩士',
      experience: '10年教學經驗',
      specialty: '鋼琴專業指導',
      avatar: '/teacher.png'
    },
    {
      id: 3,
      name: '王老師',
      title: '奧福音樂導師',
      experience: '6年教學經驗',
      specialty: '音樂遊戲教學',
      avatar: '/teacher.png'
    },
    {
      id: 4,
      name: '張老師',
      title: '特殊教育專科',
      experience: '7年教學經驗',
      specialty: '特殊需求兒童',
      avatar: '/teacher.png'
    },
    {
      id: 5,
      name: '劉老師',
      title: '音樂治療師',
      experience: '5年教學經驗',
      specialty: '音樂治療',
      avatar: '/teacher.png'
    },
    {
      id: 6,
      name: '黃老師',
      title: '音樂教育學士',
      experience: '4年教學經驗',
      specialty: '團體音樂課',
      avatar: '/teacher.png'
    }
  ];

  // 自動輪播家長見證 - 循環顯示評論圖片
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % commentImages.length);
    }, 4000); // 每4秒切換一次
    return () => clearInterval(timer);
  }, [commentImages.length, isPaused]);

  // 滑動手勢處理
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    
    if (Math.abs(diffX) > 50) { // 滑動距離超過50px才切換
      if (diffX > 0) {
        // 向左滑動，顯示下一張
        setCurrentSlide((prev) => (prev + 1) % commentImages.length);
      } else {
        // 向右滑動，顯示上一張
        setCurrentSlide((prev) => (prev - 1 + commentImages.length) % commentImages.length);
      }
    }
  };

  // 滑鼠拖拽處理
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const endX = e.clientX;
    const diffX = startX - endX;
    
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setCurrentSlide((prev) => (prev + 1) % commentImages.length);
      } else {
        setCurrentSlide((prev) => (prev - 1 + commentImages.length) % commentImages.length);
      }
    }
  };

  // 滑鼠懸停處理
  const handleMouseEnter = () => {
    setIsPaused(true); // 滑鼠懸停時暫停
  };

  const handleMouseLeave = () => {
    setIsPaused(false); // 滑鼠離開時恢復
  };

  // 手動切換圖片
  const handleManualSlide = (newIndex: number) => {
    setCurrentSlide(newIndex);
  };

  // 處理氣泡點擊
  const handleBubbleClick = (bubbleId: string) => {
    // 創建一個可愛的點擊效果
    setPhotoBubbles(prev => 
      prev.map(bubble => 
        bubble.id === bubbleId 
          ? { ...bubble, scale: bubble.scale * 1.5, opacity: 1 }
          : bubble
      )
    );
    
    // 0.5秒後恢復原狀
    setTimeout(() => {
      setPhotoBubbles(prev => 
        prev.map(bubble => 
          bubble.id === bubbleId 
            ? { ...bubble, scale: bubble.scale / 1.5, opacity: bubble.opacity }
            : bubble
        )
      );
    }, 500);
  };

  // 處理氣泡懸停狀態
  const handleBubbleHover = (bubbleId: string, isHovered: boolean) => {
    setPhotoBubbles(currentBubbles => 
      currentBubbles.map(bubble => 
        bubble.id === bubbleId 
          ? { ...bubble, isHovered: isHovered }
          : bubble
      )
    );
    
    // 同步更新全域管理器的氣泡數據
    if (typeof window !== 'undefined' && window.__hanamiBubbleManager) {
      const globalManager = window.__hanamiBubbleManager;
      globalManager.currentBubbles = globalManager.currentBubbles.map(bubble => 
        bubble.id === bubbleId 
          ? { ...bubble, isHovered: isHovered }
          : bubble
      );
    }
  };

  // 初始化打亂的相片索引
  useEffect(() => {
    // Fisher-Yates 洗牌算法
    const indices = Array.from({ length: classPhotos.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledPhotoIndices(indices);
    console.log('相片索引已初始化，打亂順序：', indices);

    // 初始化全域影像順序與游標：一次性包含0..n-1所有圖片
    if (typeof window !== 'undefined' && window.__hanamiBubbleManager) {
      const gm = window.__hanamiBubbleManager;
      gm.imageOrder = [...indices]; // 使用打亂順序避免固定循環，但涵蓋全部
      gm.imageCursor = 0;
    }
  }, [classPhotos.length]);

  // 使用全域單例避免重複定時器
  const bubbleManager = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  
  // 全域變數確保只有一個管理器實例
  if (typeof window !== 'undefined') {
    if (!window.__hanamiBubbleManager) {
      window.__hanamiBubbleManager = {
        timer: null,
        isRunning: false,
        bubbles: [],
        updateCallback: null,
        currentBubbles: [],
        domContainer: null,
        nextBubbleIndex: 0,
        imageIndexCounter: 0,
        imageOrder: [],
        imageCursor: 0
      };
    }
  }

  // 初始化20個氣泡
  useEffect(() => {
    if (!isLoaded || shuffledPhotoIndices.length === 0 || isInitialized.current) return;
    
    console.log('🎯 氣泡管理器初始化 - 創建20個初始氣泡');
    isInitialized.current = true;
    
    // 使用統一的基準時間創建20個氣泡
    const baseTime = Date.now();
    console.log(`🕐 基準時間：${new Date(baseTime).toLocaleTimeString()}`);
    const initialBubbles = [];
    for (let i = 0; i < 20; i++) {
      const newBubble = createBubble(i, baseTime);
      initialBubbles.push(newBubble);
      console.log(`創建氣泡 ${i}，生命週期：${newBubble.lifeDuration}ms，到期時間：${new Date(newBubble.expiresAt).toLocaleTimeString()}`);
    }
    
          setPhotoBubbles(initialBubbles);
          console.log(`✅ 創建了 ${initialBubbles.length} 個初始氣泡，使用統一的基準時間`);
          
          // 將初始氣泡存儲到全域管理器
          if (typeof window !== 'undefined' && window.__hanamiBubbleManager) {
            window.__hanamiBubbleManager.currentBubbles = initialBubbles;
            window.__hanamiBubbleManager.nextBubbleIndex = 20; // 下一個氣泡從索引20開始
          }
          
          // 啟動氣泡管理器
          startBubbleManager();
    
          // 清理函數 - 使用全域管理器
          return () => {
            console.log('🧹 清理氣泡管理器');
            if (typeof window !== 'undefined' && window.__hanamiBubbleManager) {
              const globalManager = window.__hanamiBubbleManager;
              if (globalManager.timer) {
                clearTimeout(globalManager.timer);
                globalManager.timer = null;
              }
              globalManager.isRunning = false;
            }
            // 重置初始化狀態，防止重複初始化
            isInitialized.current = false;
          };
  }, [isLoaded, shuffledPhotoIndices.length]);

  // 創建氣泡的函數 - 預先計算到期時間
  const createBubble = (index: number, baseTime?: number) => {
    const currentTime = baseTime || Date.now();
    
    // 避免氣泡出現在中心區域
    let x, y;
    do {
      x = Math.random() * 100;
      y = Math.random() * 100;
    } while (
      (x > 20 && x < 80 && y > 30 && y < 70) || 
      (x > 35 && x < 65 && y > 20 && y < 80)
    );

    const movementDirections = ['left', 'right', 'up', 'down', 'diagonal'];
    const sizeChangeDirections = ['grow', 'shrink'];
    const movementDirection = movementDirections[Math.floor(Math.random() * movementDirections.length)] as 'left' | 'right' | 'up' | 'down' | 'diagonal';
    const sizeChangeDirection = sizeChangeDirections[Math.floor(Math.random() * sizeChangeDirections.length)] as 'grow' | 'shrink';
    
    // 使用全域影像序列，確保0..n-1全部顯示後才循環
    let photoIndexInArray;
    if (typeof window !== 'undefined' && window.__hanamiBubbleManager) {
      const gm = window.__hanamiBubbleManager;
      // 若尚未初始化，回退到本地初始化（保險）
      if (!gm.imageOrder || gm.imageOrder.length !== classPhotos.length) {
        gm.imageOrder = Array.from({ length: classPhotos.length }, (_, i) => i);
        // 輕度洗牌，增加隨機性
        for (let i = gm.imageOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [gm.imageOrder[i], gm.imageOrder[j]] = [gm.imageOrder[j], gm.imageOrder[i]];
        }
        gm.imageCursor = 0;
      }
      const cursor = gm.imageCursor ?? 0;
      const idx = gm.imageOrder[cursor];
      photoIndexInArray = idx;
      gm.imageCursor = (cursor + 1) % gm.imageOrder.length;
      // 當完成一輪後重新洗牌，避免下一輪順序固定
      if (gm.imageCursor === 0) {
        for (let i = gm.imageOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [gm.imageOrder[i], gm.imageOrder[j]] = [gm.imageOrder[j], gm.imageOrder[i]];
        }
      }
    } else {
      // 後備方案：使用原本的邏輯
      photoIndexInArray = index % classPhotos.length;
    }
    
    // 計算到期時間：每個氣泡存在 10 + (index * 10) 秒，相差10秒
    const lifeDuration = 10000 + (index * 10000); // 10秒基礎 + n*10秒
    const expiresAt = currentTime + lifeDuration;
    
    return {
      id: `bubble-${currentTime}-${index}-${Math.random()}`,
      x: x,
      y: y,
      size: 40 + Math.random() * 50,
      opacity: 0.9 + Math.random() * 0.3,
      scale: 0.8 + Math.random() * 0.4,
      rotation: Math.random() * 360,
      imageIndex: photoIndexInArray,
      delay: Math.random() * 1500,
      isFading: false,
      isHovered: false, // 初始化懸停狀態
      createdTime: currentTime,
      expiresAt: expiresAt, // 預先計算的到期時間
      lifeDuration: lifeDuration,
      movementDirection: movementDirection,
      sizeChangeDirection: sizeChangeDirection
    };
  };

  // 氣泡管理器 - 純 DOM 操作模式
  const startBubbleManager = () => {
    if (typeof window === 'undefined') return;
    
    const globalManager = window.__hanamiBubbleManager!;
    
    // 如果已經有定時器在運行，先清理再重新啟動
    if (globalManager.isRunning && globalManager.timer) {
      console.log('⚠️ 發現重複的氣泡管理器，先清理再重新啟動');
      clearTimeout(globalManager.timer);
      globalManager.timer = null;
      globalManager.isRunning = false;
    }
    
    console.log('⏰ 啟動氣泡管理器 - 純 DOM 操作模式');
    globalManager.isRunning = true;
    
    // 找到氣泡容器
    const container = document.querySelector('.photo-bubble-container');
    if (!container) {
      console.error('❌ 找不到氣泡容器');
      return;
    }
    globalManager.domContainer = container as HTMLElement;
    
    // 設置更新回調函數
    globalManager.updateCallback = (newBubbles: any[]) => {
      setPhotoBubbles(newBubbles);
    };
    
    // 使用遞歸 setTimeout，完全獨立於 React 狀態
    const processBubble = () => {
      if (!globalManager.isRunning) return;
      
      const currentTime = Date.now();
      console.log(`⏰ 檢查氣泡到期狀態 - 當前時間：${new Date(currentTime).toLocaleTimeString()}`);
      
      // 使用全域管理器中的氣泡數據，不依賴 React 狀態
      let currentBubbles = globalManager.currentBubbles;
      
      // 強制限制為20個氣泡
      if (currentBubbles.length > 20) {
        console.log(`⚠️ 氣泡數量過多：${currentBubbles.length}，強制限制為20個`);
        currentBubbles = currentBubbles.slice(0, 20);
        globalManager.currentBubbles = currentBubbles;
      }
      
      if (currentBubbles.length === 0) {
        console.log('⚠️ 沒有氣泡可處理');
        globalManager.timer = setTimeout(processBubble, 1000);
        return;
      }
      
      // 找到已到期且未懸停的最早氣泡
      const expiredBubbles = currentBubbles.filter(bubble => 
        bubble.expiresAt <= currentTime && !bubble.isHovered
      );
      
      // 詳細調試信息
      console.log(`📊 當前氣泡數量：${currentBubbles.length}，到期氣泡數量：${expiredBubbles.length}`);
      if (currentBubbles.length > 0) {
        const earliestBubble = currentBubbles.reduce((earliest, current) => 
          current.expiresAt < earliest.expiresAt ? current : earliest
        );
        console.log(`📅 最早氣泡到期時間：${new Date(earliestBubble.expiresAt).toLocaleTimeString()}，當前時間：${new Date(currentTime).toLocaleTimeString()}`);
        console.log(`⏱️ 時間差：${currentTime - earliestBubble.expiresAt}ms`);
      }
      
      if (expiredBubbles.length === 0) {
        console.log('✅ 沒有氣泡到期，維持現狀');
        globalManager.timer = setTimeout(processBubble, 1000);
        return;
      }
      
      // 移除最早到期的氣泡
      const earliestExpired = expiredBubbles.reduce((earliest, current) => 
        current.expiresAt < earliest.expiresAt ? current : earliest
      );
      
      console.log(`🎯 移除到期氣泡 ${earliestExpired.id}，生命週期：${earliestExpired.lifeDuration}ms，當前數量：${currentBubbles.length}`);
      
      // 先設置氣泡為淡出狀態
      const bubblesWithFade = currentBubbles.map(bubble => 
        bubble.id === earliestExpired.id 
          ? { ...bubble, isFading: true }
          : bubble
      );
      
      // 更新全域管理器的氣泡數據（淡出狀態）
      globalManager.currentBubbles = bubblesWithFade;
      
      // 通知 React 組件更新（顯示淡出效果）
      if (globalManager.updateCallback) {
        globalManager.updateCallback(bubblesWithFade);
      }
      
      // 1秒後真正移除氣泡並創建新氣泡
      setTimeout(() => {
        const bubblesAfterRemoval = globalManager.currentBubbles.filter(bubble => bubble.id !== earliestExpired.id);
        
        // 創建一個新氣泡，使用當前時間作為基準
        const newBubble = createBubble(globalManager.nextBubbleIndex, Date.now());
        globalManager.nextBubbleIndex++;
        const finalBubbles = [...bubblesAfterRemoval, newBubble];
        
        console.log(`🔄 移除1個到期氣泡，創建1個新氣泡，新氣泡生命週期：${newBubble.lifeDuration}ms，總數：${finalBubbles.length}`);
        
        // 更新全域管理器的氣泡數據
        globalManager.currentBubbles = finalBubbles;
        
        // 通知 React 組件更新
        if (globalManager.updateCallback) {
          globalManager.updateCallback(finalBubbles);
        }
      }, 1000); // 1秒淡出動畫
      
      // 安排下一次檢查
      globalManager.timer = setTimeout(processBubble, 1000);
    };
    
    // 開始處理
    processBubble();
  };


  // 顯示載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex flex-col">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* 返回主頁按鈕 */}
              <motion.button
                onClick={() => router.push('/aihome')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回主頁"
              >
                <HomeIcon className="w-5 h-5 text-[#4B4036]" />
                <span className="text-sm font-medium text-[#4B4036] hidden sm:inline">返回主頁</span>
              </motion.button>
              
              {/* 選單按鈕 - 只在登入時顯示 */}
              {user && (
                <motion.button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                  title="開啟選單"
                >
                  <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
                </motion.button>
              )}
              
              <div className="w-10 h-10 relative">
                <img 
                  src="/@hanami.png" 
                  alt="Hanami Music Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4B4036]">Hanami Music</h1>
                <p className="text-sm text-[#2B3A3B]">花見音樂</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#2B3A3B]">
                {currentTime.toLocaleTimeString('zh-TW', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              
              {user ? (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[#4B4036]">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                    title="登出"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>登出</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    onClick={() => router.push('/aihome/auth/login')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sm text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                  >
                    登入
                  </motion.button>
                  <motion.button
                    onClick={() => router.push('/aihome/auth/register')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium transition-all duration-200"
                  >
                    註冊
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容區域 */}
      <div className="flex-1 flex">
        {/* 側邊欄選單 - 只在登入時顯示 */}
        {user && (
          <AppSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            currentPath="/aihome/hanami-music"
          />
        )}

        {/* 主內容 */}
        <div className="flex-1 flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
            
            {/* 主要橫幅區塊 */}
            <motion.section
              initial={{ opacity: 0, y: -20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <div className="relative bg-gradient-to-br from-[#FFD59A] via-[#EBC9A4] to-[#FFB6C1] rounded-3xl p-8 md:p-16 overflow-hidden shadow-2xl">
                {/* 背景裝飾圖案 */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-[#4B4036]"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: Math.random() * 3,
                      }}
                    >
                      <MusicalNoteIcon className="w-6 h-6" />
                    </motion.div>
                  ))}
                </div>

                {/* 相片氣泡 */}
                <div className="absolute inset-0 photo-bubble-container">
                  {photoBubbles.map((bubble) => (
                    <motion.div
                      key={bubble.id}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${bubble.x}%`,
                        top: `${bubble.y}%`,
                        width: `${bubble.size}px`,
                        height: `${bubble.size}px`,
                      }}
                      initial={{
                        opacity: 0,
                        scale: 0,
                        rotate: bubble.rotation,
                      }}
                      animate={{
                        opacity: bubble.isFading ? 0 : (bubble.isHovered ? 1 : bubble.opacity),
                        scale: bubble.isFading 
                          ? bubble.scale * 0.5 
                          : bubble.isHovered 
                            ? bubble.scale * 1.5
                            : bubble.sizeChangeDirection === 'grow' 
                              ? [bubble.scale, bubble.scale * 1.1, bubble.scale * 1.05, bubble.scale]
                              : [bubble.scale, bubble.scale * 0.95, bubble.scale * 0.9, bubble.scale],
                        rotate: [0, 5, -5, 3, -3, 0], // 輕微旋轉搖擺
                        // 主要向上浮動，緩慢上升
                        y: bubble.movementDirection === 'up' 
                          ? [0, -20, -40, -60, -80, -100, -120]
                          : bubble.movementDirection === 'down'
                          ? [0, -10, -20, -30, -40, -50, -60]
                          : [0, -15, -30, -45, -60, -75, -90],
                        // 輕微左右搖擺
                        x: bubble.movementDirection === 'left'
                          ? [0, -5, -10, -8, -6, -4, -2, 0, 2, 4, 2, 0]
                          : bubble.movementDirection === 'right'
                          ? [0, 5, 10, 8, 6, 4, 2, 0, -2, -4, -2, 0]
                          : bubble.movementDirection === 'diagonal'
                          ? [0, 3, 6, 9, 6, 3, 0, -3, -6, -9, -6, -3, 0]
                          : [0, 2, 4, 6, 4, 2, 0, -2, -4, -6, -4, -2, 0],
                      }}
                      transition={{
                        duration: bubble.isFading ? 1 : 8, // 更慢的動畫，8秒一個循環
                        repeat: bubble.isFading ? 0 : Infinity, // 淡出時不重複
                        delay: bubble.delay / 1000,
                        ease: bubble.isFading ? "easeOut" : "linear", // 使用線性動畫模擬真實氣泡
                      }}
                      whileHover={{
                        scale: bubble.scale * 1.2,
                        rotate: bubble.rotation + 180,
                        transition: { duration: 0.3 }
                      }}
                      whileTap={{
                        scale: bubble.scale * 0.9,
                        transition: { duration: 0.1 }
                      }}
                      onMouseEnter={() => handleBubbleHover(bubble.id, true)}
                      onMouseLeave={() => handleBubbleHover(bubble.id, false)}
                      onTouchStart={() => handleBubbleHover(bubble.id, true)}
                      onTouchEnd={() => handleBubbleHover(bubble.id, false)}
                      onClick={() => handleBubbleClick(bubble.id)}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden shadow-xl border-4 border-white/60 backdrop-blur-sm hover:border-white/80 transition-all duration-300 hover:scale-110">
                        <img
                          src={classPhotos[bubble.imageIndex]}
                          alt="課堂相片"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-pink-200/20 rounded-full"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-white/40"></div>
                        {/* 可愛的光暈效果 */}
                        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-pink-200/30 via-white/20 to-yellow-200/30 blur-sm animate-pulse"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* 主要內容 - 左右分欄佈局 */}
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* 左側 - 插畫 */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="order-2 lg:order-1 flex justify-center lg:justify-end"
                  >
                    <div className="relative w-full max-w-md">
                      {/* 載入狀態 */}
                      {!imageLoaded && !imageError && (
                        <div className="w-full h-64 bg-gradient-to-br from-[#FFD59A]/20 to-[#EBC9A4]/20 rounded-2xl flex items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036]"></div>
                        </div>
                      )}
                      
                      {/* 圖片顯示 */}
                      {!imageError && (
                        <img 
                          src="/HanamiMusic/IndexLogo.png" 
                          alt="Hanami Music 音樂教室插畫" 
                          className={`w-full h-auto rounded-2xl shadow-2xl transition-opacity duration-300 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={() => {
                            console.log('圖片載入成功');
                            setImageLoaded(true);
                          }}
                          onError={() => {
                            console.log('圖片載入失敗');
                            setImageError(true);
                          }}
                          style={{ maxWidth: '400px', height: 'auto' }}
                        />
                      )}
                      
                      {/* 錯誤狀態 - 顯示備用圖片 */}
                      {imageError && (
                        <img 
                          src="/@hanami.png" 
                          alt="Hanami Music Logo" 
                          className="w-full h-auto rounded-2xl shadow-2xl"
                          style={{ maxWidth: '400px', height: 'auto' }}
                        />
                      )}
                      
                      {/* 裝飾性光暈效果 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                    </div>
                  </motion.div>
                  
                  {/* 右側 - 文字內容 */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="order-1 lg:order-2 text-center lg:text-left"
                  >
                    {/* 標題區域 */}
                    <div className="flex items-center justify-center lg:justify-start mb-8">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                        <MusicalNoteIcon className="w-8 h-8 text-white" />
                      </div>
                      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg">
                        讓孩子愛上音樂
                      </h1>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-start mb-8">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-3">
                        <HeartIcon className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white drop-shadow-md">
                        非傳統的幼兒音樂教學法
                      </h2>
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ml-3">
                        <SparklesIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto lg:mx-0 drop-shadow-sm">
                      15m起孩子絕對會學上癮的音樂鋼琴課<br/>
                      以最有趣活潑又科學的音樂教學助孩子成長發展
                    </p>
                    
                    {/* 行動按鈕 */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                      <motion.button
                        onClick={() => router.push('/aihome/course-activities/register')}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="group px-10 py-4 bg-white text-[#4B4036] rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-3"
                      >
                        <CalendarDaysIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span>立即預約試堂</span>
                        <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          const element = document.getElementById('music-focus-class-section');
                          if (element) {
                            element.scrollIntoView({ 
                              behavior: 'smooth',
                              block: 'start'
                            });
                          }
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="group px-10 py-4 bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 rounded-2xl font-bold text-lg hover:bg-white/30 transition-all duration-300 flex items-center justify-center space-x-3"
                      >
                        <BookOpenIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span>了解更多</span>
                        <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            {/* 優惠推廣區塊 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-16"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#EADBC8]/50 backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 新生優惠 */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group relative bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/30 rounded-2xl p-6 border border-[#FFD59A]/30 hover:border-[#FFD59A]/60 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <GiftIcon className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">新</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-[#4B4036] mb-2 group-hover:text-[#2B3A3B] transition-colors">
                          新生試堂優惠
                        </h3>
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-4xl font-bold text-[#E74C3C]">$168</span>
                          <div className="flex flex-col">
                            <span className="text-lg text-[#2B3A3B] line-through opacity-60">原價 $350</span>
                            <span className="text-sm text-[#27AE60] font-bold">限時 52% OFF</span>
                          </div>
                        </div>
                        <p className="text-lg text-[#2B3A3B] mb-4">立即預約試堂課程，體驗專業音樂教學</p>
                        <motion.button
                          onClick={() => router.push('/aihome/course-activities/register')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                        >
                          <CalendarDaysIcon className="w-5 h-5" />
                          <span>立即預約 $168 試堂</span>
                        </motion.button>
                        <div className="flex items-center space-x-2 mt-3">
                          <CheckCircleIcon className="w-5 h-5 text-[#27AE60]" />
                          <span className="text-sm text-[#27AE60] font-medium">限時優惠，名額有限</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* VIP 扭蛋機活動 */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group relative bg-gradient-to-br from-[#FFF9F2] to-[#FFB6C1]/30 rounded-2xl p-6 border border-[#FFB6C1]/30 hover:border-[#FFB6C1]/60 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-6 min-h-[200px] pt-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-32 h-32 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                          <img 
                            src="/HanamiMusic/nunu/nunubasic.png" 
                            alt="VIP 扭蛋機" 
                            className="w-full h-full object-cover rounded-2xl"
                            onError={(e) => {
                              console.log('扭蛋機圖片載入失敗，使用備用圖標');
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <GiftIcon className="w-10 h-10 text-white absolute" style={{ display: 'none' }} />
                        </div>
                        <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">VIP</span>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-3xl font-bold text-[#4B4036] mb-2 group-hover:text-[#2B3A3B] transition-colors">
                          <span className="text-[#E74C3C]">立即報名</span>
                          <span className="text-[#E67E22]">限時解鎖</span>！
                        </h3>
                        <p className="text-xl text-[#2B3A3B] mb-4">
                          VIP 扭蛋機「<span className="text-[#E74C3C] font-bold">稀有大獎</span>」即刻抽
                        </p>
                        <div className="flex items-center space-x-2 mb-4">
                          <SparklesIcon className="w-6 h-6 text-[#E74C3C]" />
                          <span className="text-base text-[#E74C3C] font-medium">稀有獎品等你來抽</span>
                        </div>
                        <motion.button
                          onClick={() => router.push('/aihome/gachapon')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-8 py-4 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 w-fit"
                        >
                          <GiftIcon className="w-6 h-6" />
                          <span>立即抽獎</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            {/* 家長見證和學生成果展示 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 家長見證 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-6 text-center">家長好評</h2>
                  <div 
                    className="relative h-96 overflow-hidden rounded-lg cursor-grab active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        {/* 模板背景 */}
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img 
                            src="/HanamiMusic/commentTemplate.png" 
                            alt="家長見證模板" 
                            className="object-contain rounded-lg shadow-xl"
                            style={{ maxWidth: '420px', maxHeight: '1000px' }}
                          />
                          
                          {/* 疊加評論圖片 */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-3/5 h-3/5 bg-white rounded-lg shadow-lg overflow-hidden">
                              <img 
                                src={commentImages[currentSlide % commentImages.length]} 
                                alt="家長評論"
                                className="w-full h-full object-contain bg-white"
                              />
                            </div>
                          </div>
                          
                      {/* 評分覆蓋層 */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center space-x-1">
                            {[...Array(testimonials[currentSlide % testimonials.length].rating)].map((_, i) => (
                              <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                            ))}
                            <span className="text-sm text-[#2B3A3B] ml-1">
                              {testimonials[currentSlide % testimonials.length].rating}.0
                            </span>
                          </div>
                        </div>
                      </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* 左右箭頭 */}
                    <button
                      onClick={() => handleManualSlide((currentSlide - 1 + commentImages.length) % commentImages.length)}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                    >
                      <svg className="w-5 h-5 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleManualSlide((currentSlide + 1) % commentImages.length)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                    >
                      <svg className="w-5 h-5 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* 輪播指示器 */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {Array.from({ length: Math.min(10, commentImages.length) }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleManualSlide(index)}
                          className={`w-2 h-2 rounded-full transition-colors hover:scale-125 ${
                            (currentSlide % commentImages.length) === index ? 'bg-[#FFD59A]' : 'bg-white/50'
                          }`}
                        />
                      ))}
                      {commentImages.length > 10 && (
                        <span className="text-xs text-white/70 ml-2">+{commentImages.length - 10}</span>
                      )}
                      <span className="text-xs text-white/80 ml-3">
                        {currentSlide + 1} / {commentImages.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 學生成就牆 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                      <TrophyIcon className="w-8 h-8 text-yellow-500 mr-3" />
                      <h2 className="text-3xl font-bold text-[#4B4036]">孩子成就牆</h2>
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center ml-3">
                        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                    </div>
                    <p className="text-[#2B3A3B] text-lg">讓孩子快樂學習，見證成長</p>
                  </div>
                  
                  {/* 電影風格照片牆 */}
                  <div className="relative">
                    {/* 背景裝飾 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFD59A]/10 via-transparent to-[#FFB6C1]/10 rounded-2xl"></div>
                    
                    {/* 照片牆網格 */}
                    <div className="relative grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-6">
                      {certificatePhotos.slice(currentBatch * photosPerBatch, (currentBatch + 1) * photosPerBatch).map((photo, index) => {
                        // 隨機旋轉角度 (-15度到15度)
                        const rotation = (Math.random() - 0.5) * 30;
                        // 隨機陰影偏移
                        const shadowX = (Math.random() - 0.5) * 8;
                        const shadowY = (Math.random() - 0.5) * 8;
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
                            animate={isLoaded ? { opacity: 1, scale: 1, rotate: rotation } : {}}
                            transition={{ 
                              duration: 0.6, 
                              delay: 1.0 + index * 0.02,
                              type: "spring",
                              stiffness: 100
                            }}
                            whileHover={{ 
                              scale: 1.1, 
                              rotate: 0,
                              zIndex: 10,
                              transition: { duration: 0.3 }
                            }}
                            className="relative group cursor-pointer"
                            style={{
                              transform: `rotate(${rotation}deg)`,
                              boxShadow: `${shadowX}px ${shadowY}px 15px rgba(0,0,0,0.2)`
                            }}
                          >
                            {/* 照片 */}
                            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-white shadow-lg">
                              <img 
                                src={photo} 
                                alt={`學生證書 ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                          </div>
                            
                            {/* 懸停效果 */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                            
                            {/* 圖釘效果 */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-sm"></div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-sm"></div>
                            
                            {/* 懸停時顯示的放大鏡圖標 */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                                <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                        </div>
                            </div>
                      </motion.div>
                        );
                      })}
                    </div>
                    
                    {/* 批次切換控制 */}
                    <div className="flex items-center justify-center space-x-6 mt-6">
                      {/* 左箭頭 */}
                      <motion.button
                        onClick={handlePreviousBatch}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-12 h-12 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative z-10"
                        style={{ pointerEvents: 'auto' }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handlePreviousBatch();
                          }
                        }}
                      >
                        <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </motion.button>
                      
                      {/* 批次指示器 - 只顯示圓點 */}
                      <div className="flex space-x-2">
                        {Array.from({ length: totalBatches }).map((_, index) => (
                          <div
                            key={index}
                            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                              index === currentBatch ? 'bg-[#FFD59A]' : 'bg-[#EADBC8]'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* 右箭頭 */}
                      <motion.button
                        onClick={handleNextBatch}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-12 h-12 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative z-10"
                        style={{ pointerEvents: 'auto' }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleNextBatch();
                          }
                        }}
                      >
                        <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    </div>
                    
                    {/* 底部統計信息 */}
                    <div className="mt-8 text-center">
                      <div className="inline-flex items-center space-x-6 bg-gradient-to-r from-[#FFD59A]/20 to-[#FFB6C1]/20 rounded-full px-6 py-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#4B4036]">100+</div>
                          <div className="text-sm text-[#2B3A3B]">證書</div>
                        </div>
                        <div className="w-px h-8 bg-[#EADBC8]"></div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#4B4036]">95%</div>
                          <div className="text-sm text-[#2B3A3B]">通過率</div>
                        </div>
                        <div className="w-px h-8 bg-[#EADBC8]"></div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#4B4036]">100%</div>
                          <div className="text-sm text-[#2B3A3B]">滿意度</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 課程介紹和收費 */}
            <motion.section
              id="music-focus-class-section"
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 幼兒音樂啟蒙 */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#EADBC8]/50 hover:shadow-2xl transition-all duration-300">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden shadow-lg">
                      <img 
                        src="/HanamiMusic/musicclass.png" 
                        alt="幼兒音樂專注力班" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-3xl font-bold text-[#4B4036] mb-3">幼兒音樂專注力班(1.5+)</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-[#4B4036] bg-gradient-to-r from-[#FFD59A]/20 to-[#EBC9A4]/20 px-3 py-1 rounded-full">60 mins</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-[#4B4036] bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFD59A]/20 px-3 py-1 rounded-full">親子/個人形式</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-[#4B4036] bg-gradient-to-r from-[#EBC9A4]/20 to-[#FFB6C1]/20 px-3 py-1 rounded-full">2位老師：最多5位小朋友</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 mb-6">
                      <div className="text-center space-y-3">
                        <p className="text-lg font-semibold text-[#4B4036]">
                          用<span className="text-[#E74C3C] font-bold">主題遊戲</span>、<span className="text-[#3B82F6] font-bold">繪本</span>、<span className="text-[#10B981] font-bold">多種樂器</span>和<span className="text-[#F59E0B] font-bold">訓練活動</span>
                        </p>
                        <p className="text-lg font-bold text-[#E74C3C]">
                          非常規的音樂Playgroup！
                        </p>
                      </div>
                    <ul className="space-y-3 text-[#2B3A3B]">
                      <li className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>把握1.5歲-7歲專注力及注意力發展黃金期</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>讓孩子愛上音樂，建立音樂基礎</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>培養幼兒專注力和多種發展能力</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <motion.button
                      onClick={() => router.push('/aihome/hanami-music/music-focus-class')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <BookOpenIcon className="w-5 h-5" />
                      <span>查看更多</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => router.push('/aihome/course-activities/register')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-3 bg-white border-2 border-[#FFB6C1] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <CalendarDaysIcon className="w-5 h-5" />
                      <span>立即預約試堂</span>
                    </motion.button>
                  </div>
                </div>

                {/* 鋼琴課程 */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#EADBC8]/50 hover:shadow-2xl transition-all duration-300">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden shadow-lg">
                      <img 
                        src="/HanamiMusic/piano.png" 
                        alt="兒童專屬鋼琴班" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-3xl font-bold text-[#4B4036] mb-3">兒童專屬鋼琴班(2.5+)</h3>
                    <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-[#4B4036] bg-gradient-to-r from-[#FFD59A]/20 to-[#EBC9A4]/20 px-3 py-1 rounded-full">45 mins</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-[#4B4036] bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFD59A]/20 px-3 py-1 rounded-full">個人形式</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-[#4B4036] bg-gradient-to-r from-[#EBC9A4]/20 to-[#FFB6C1]/20 px-3 py-1 rounded-full">2位老師：最多4位小朋友</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 mb-6">
                      <div className="text-center space-y-2">
                      <p className="text-lg font-semibold text-[#4B4036]">
                          用<span className="text-[#E74C3C] font-bold">主題繪本</span>、<span className="text-[#3B82F6] font-bold">小組遊戲</span>、<span className="text-[#10B981] font-bold">發展訓練</span>和<span className="text-[#F59E0B] font-bold">鋼琴</span>
                        </p>
                        <p className="text-lg font-bold text-[#E74C3C]">
                         為孩子度身訂造的非傳統鋼琴課!!!
                        </p>
                      </div>
                    <ul className="space-y-3 text-[#2B3A3B]">
                      <li className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>以嶄新科學化鋼琴教學法</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>多元化主題遊戲讓孩子愛上鋼琴</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>加強孩子多種發展能力和學習能力</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <motion.button
                      onClick={() => router.push('/aihome/hanami-music/piano-class')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <BookOpenIcon className="w-5 h-5" />
                      <span>查看更多</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => router.push('/aihome/course-activities/register')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-3 bg-white border-2 border-[#FFB6C1] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <CalendarDaysIcon className="w-5 h-5" />
                      <span>立即預約試堂</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 師資介紹 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mb-12"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#EADBC8]">
                <h2 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">我們的團隊</h2>
                
                {/* 重新設計的師資介紹佈局：圖片在上，內容在下 */}
                <div className="space-y-8">
                  {/* 上方 - 師資團隊圖片 */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 1.0 }}
                    className="text-center"
                  >
                    <div className="relative inline-block">
                      <img 
                        src="/HanamiMusic/teachersicon.png" 
                        alt="專業師資團隊" 
                        className="w-full max-w-lg h-auto rounded-2xl shadow-2xl mx-auto"
                        onError={(e) => {
                          console.log('師資圖片載入失敗，使用備用圖片');
                          e.currentTarget.src = '/@hanami.png';
                        }}
                      />
                      {/* 裝飾性光暈效果 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD59A]/20 to-transparent rounded-2xl"></div>
                    </div>
                  </motion.div>
                  
                  {/* 下方 - 專業認證與成就 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-[#4B4036] flex items-center justify-center mb-4">
                        <TrophyIcon className="w-8 h-8 text-yellow-500 mr-3" />
                        專業認證與成就
                      </h3>
                      <p className="text-[#2B3A3B] text-lg leading-relaxed max-w-3xl mx-auto flex items-center justify-center flex-wrap gap-2">
                        <span className="flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-green-500" />
                          讓音樂在孩子心中萌芽，以最有趣活潑又科學的音樂教學助
                        </span>
                        <span className="flex items-center gap-2">
                          <UserIcon className="w-5 h-5 text-blue-500" />
                          孩子成長發展
                        </span>
                        <span className="flex items-center gap-2">
                          <MusicalNoteIcon className="w-5 h-5 text-yellow-500" />
                          、學習樂器和音樂
                        </span>
                      </p>
                    </div>
                    
                    {/* 認證項目網格佈局 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <TrophyIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">2022-2025年連續獲得</p>
                          <p className="text-[#4B4036] font-bold text-sm">優秀教育機構及導師獎</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">育兒專業認證</p>
                          <p className="text-[#4B4036] font-bold text-sm">一級榮譽特殊幼師</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">教學經驗</p>
                          <p className="text-[#4B4036] font-bold text-sm">8年資深幼兒教師</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <HeartIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">成長發展</p>
                          <p className="text-[#4B4036] font-bold text-sm">ABA行為治療師</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <MusicalNoteIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">音樂學習</p>
                          <p className="text-[#4B4036] font-bold text-sm">奧福音樂、音樂治療證書</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl border border-[#FFD59A]/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                          <SparklesIcon className="w-6 h-6 text-pink-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#2B3A3B] font-medium text-sm">樂器學習</p>
                          <p className="text-[#4B4036] font-bold text-sm">8級或以上ABRSM鋼琴及樂理</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 底部強調文字 */}
                    <div className="text-center p-6 bg-gradient-to-r from-[#FFD59A]/10 to-[#EBC9A4]/10 rounded-xl border border-[#FFD59A]/20">
                      <p className="text-[#4B4036] font-bold text-lg flex items-center justify-center">
                        <MusicalNoteIcon className="w-6 h-6 mr-2 text-[#FFD59A]" />
                        專業團隊精心設計，以遊戲、活動與訓練讓孩子愛上音樂
                        <SparklesIcon className="w-6 h-6 ml-2 text-[#FFD59A]" />
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            {/* 聯絡方式 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="mb-12"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#EADBC8]">
                <h2 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">聯絡我們</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 聯絡方式 */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <PhoneIcon className="w-6 h-6 text-[#4B4036]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#4B4036]">電話聯絡</h3>
                        <p className="text-[#2B3A3B]">+852 98271410</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.open('tel:+85298271410', '_self')}
                          className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg text-sm font-medium hover:bg-[#EBC9A4] transition-colors mt-2"
                        >
                          立即撥打
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center overflow-hidden">
                        <img 
                          src="/socialmedia logo/whatsapp.png" 
                          alt="WhatsApp" 
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-[#4B4036]">WhatsApp 聯繫</h3>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.open('https://wa.me/85298271410', '_blank')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          立即聯絡
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* 社交媒體 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#4B4036] flex items-center">
                        <ShareIcon className="w-5 h-5 mr-2" />
                        社交媒體
                      </h4>
                      <div className="flex space-x-4">
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://youtube.com/@hanamimusichk?si=k480c4xfHs9-6Q_j', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img 
                            src="/socialmedia logo/youtube.png" 
                            alt="YouTube" 
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://www.facebook.com/share/1JRjDBKAD2/?mibextid=wwXIfr', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img 
                            src="/socialmedia logo/facebook.png" 
                            alt="Facebook" 
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://www.instagram.com/hanamimusichk?igsh=ZnRvYWtuOXFlc2Uw&utm_source=qr', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img 
                            src="/socialmedia logo/instagram.png" 
                            alt="Instagram" 
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://v.douyin.com/bKyjgdaCQ-k/', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img 
                            src="/socialmedia logo/tiktok.png" 
                            alt="TikTok" 
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.open('https://xhslink.com/m/Aqz3owoQhZo', '_blank')}
                          className="group w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                        >
                          <img 
                            src="/socialmedia logo/xionghaoshu.png" 
                            alt="小紅書" 
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.button>
                      </div>
                    </div>
                    
                  </div>

                  {/* 地圖 */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                          <MapIcon className="w-6 h-6 text-[#4B4036]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#4B4036]">地址</h3>
                          <p className="text-[#2B3A3B] text-sm">香港九龍旺角威達商業大廈504-505室</p>
                        </div>
                      </div>
                      
                      {/* 互動式地圖預覽卡片 */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMapExpanded(true)}
                        className="relative cursor-pointer group"
                      >
                        <div className="relative bg-white rounded-2xl border-2 border-[#FFD59A] shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                          {/* 地圖 iframe */}
                          <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72 bg-gray-100">
                            {/* 載入指示器 */}
                            {mapLoading && !mapError && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto mb-2"></div>
                                  <p className="text-sm text-[#4B4036]">載入地圖中...</p>
                                </div>
                              </div>
                            )}
                            
                            {/* 錯誤狀態 - 顯示備用地圖 */}
                            {mapError && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FFD59A]/20 to-[#EBC9A4]/20 rounded-2xl">
                                <div className="text-center p-4">
                                  <MapPinIcon className="w-12 h-12 text-[#FFD59A] mx-auto mb-3" />
                                  <p className="text-sm text-[#4B4036] mb-3">地圖載入失敗</p>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=花見琴舍', '_blank')}
                                    className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg text-sm font-medium hover:bg-[#EBC9A4] transition-colors"
                                  >
                                    在 Google 地圖中查看
                                  </motion.button>
                                </div>
                              </div>
                            )}
                            
                            <iframe
                              src={mapUrl}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="eager"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Hanami Music 位置地圖"
                              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                              onLoad={() => {
                                console.log('地圖預覽載入成功');
                                setMapLoading(false);
                                setMapError(false);
                              }}
                              onError={() => {
                                console.log('地圖預覽載入失敗');
                                setMapLoading(false);
                                setMapError(true);
                              }}
                            />
                            
                            {/* 半透明遮罩層 */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* 展開提示 */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                                <div className="flex items-center space-x-2 text-[#4B4036]">
                                  <MapPinIcon className="w-5 h-5" />
                                  <span className="font-medium">點擊展開地圖</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 裝飾性位置標記 */}
                          <div className="absolute top-2 left-2 w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg">
                            <MapPinIcon className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-lg">
                            <MapPinIcon className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute bottom-2 left-2 w-6 h-6 bg-gradient-to-br from-[#EBC9A4] to-[#FFB6C1] rounded-full flex items-center justify-center shadow-lg">
                            <MapPinIcon className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute bottom-2 right-2 w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg">
                            <MapPinIcon className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

          </div>
        </div>
      </div>

      {/* 展開地圖 Modal */}
      <AnimatePresence>
        {isMapExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsMapExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-6xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 關閉按鈕 */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMapExpanded(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                aria-label="關閉地圖"
              >
                <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>

              {/* 地圖標題 */}
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="w-5 h-5 text-[#FFD59A]" />
                  <span className="font-semibold text-[#4B4036]">Hanami Music 位置</span>
                </div>
                <p className="text-sm text-[#2B3A3B]">香港九龍旺角威達商業大廈504-505室</p>
              </div>

              {/* 大尺寸地圖 */}
              <div className="relative w-full h-[70vh] sm:h-[75vh] md:h-[80vh]">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Hanami Music 位置地圖 - 大圖"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  onLoad={() => console.log('地圖 Modal 載入成功')}
                  onError={() => console.log('地圖 Modal 載入失敗')}
                />
                
                {/* 裝飾性邊框 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FFD59A] rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FFB6C1] rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#EBC9A4] rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FFD59A] rounded-br-2xl"></div>
                </div>
              </div>

              {/* 底部操作按鈕 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=花見琴舍', '_blank')}
                  className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>在 Google 地圖中開啟</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMapExpanded(false)}
                  className="px-4 py-2 bg-white/90 backdrop-blur-sm text-[#4B4036] rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span>關閉</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
