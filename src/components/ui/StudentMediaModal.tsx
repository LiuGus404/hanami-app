'use client';

import { 
  XMarkIcon, 
  PlusIcon, 
  PhotoIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  TrashIcon,
  HeartIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Video } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { HanamiCard, HanamiButton, HanamiInput } from '@/components/ui';
import { PlanUpgradeModal } from '@/components/ui/PlanUpgradeModal';
import MediaEditor from './MediaEditor';
import { supabase } from '@/lib/supabase';
import { StudentMedia, StudentMediaQuota, DEFAULT_MEDIA_LIMITS } from '@/types/progress';
import { 
  validateFile, 
  uploadFile, 
  deleteFile, 
  getFileUrl, 
  formatFileSize, 
  formatDuration,
  getVideoDuration 
} from '@/lib/storageUtils';

interface StudentWithMedia {
  id: string;
  full_name: string;
  nick_name?: string | null;
  course_type?: string | null;
  quota: StudentMediaQuota;
  media_count: {
    video: number;
    photo: number;
  };
}

// 新增：課程類型定義
interface StudentLesson {
  id: string;
  lesson_date: string;
  lesson_status: string;
  lesson_teacher?: string;
  lesson_activities?: string;
  notes?: string;
  video_url?: string;
}

interface StudentMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentWithMedia | null;
  onQuotaChanged?: () => void; // 新增：配額更改回調
}

export default function StudentMediaModal({ isOpen, onClose, student, onQuotaChanged }: StudentMediaModalProps) {
  // 自定義關閉函數，重置所有狀態
  const handleClose = () => {
    // 重置所有上傳相關狀態
    setUploading(false);
    setUploadProgress({});
    setSelectedFiles([]);
    setShowUploadArea(false);
    setEditingMedia(null);
    setEditTitle('');
    setIsEditing(false);
    setShowLessonSelector(false);
    setSelectedMediaForLesson(null);
    setSelectedLessonId('');
    
    // 調用原始的 onClose
    onClose();
  };
  const [media, setMedia] = useState<StudentMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedMedia, setSelectedMedia] = useState<StudentMedia | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // 新增：媒體改名相關狀態
  const [editingMedia, setEditingMedia] = useState<StudentMedia | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // 新增：課程關聯相關狀態
  const [studentLessons, setStudentLessons] = useState<StudentLesson[]>([]);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const [selectedMediaForLesson, setSelectedMediaForLesson] = useState<StudentMedia | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  
  // 新增：方案升級相關狀態
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // 新增：展開/收起狀態
  const [showQuotaDetails, setShowQuotaDetails] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);

  // 新增：配額等級狀態
  const [quotaLevel, setQuotaLevel] = useState<any>(null);
  
  // 新增：媒體編輯器相關狀態
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);
  const [editingFileType, setEditingFileType] = useState<'video' | 'photo' | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      // 使用 Promise.all 來並行載入所有資料
      Promise.all([
        loadStudentMedia(),
        loadStudentLessons(),
        loadQuotaLevel()
      ]).catch(error => {
        console.error('載入資料時發生錯誤:', error);
      });
    } else if (!isOpen) {
      // 當模態框關閉時，清空資料
      setMedia([]);
      setStudentLessons([]);
      setQuotaLevel(null);
      setLoading(false);
    }
  }, [isOpen, student]);

  // 新增：載入學生課程
  const loadStudentLessons = async () => {
    if (!student) return;
    
    try {
      const { data, error } = await supabase
        .from('hanami_student_lesson')
        .select('id, lesson_date, lesson_status, lesson_teacher, lesson_activities, notes, video_url')
        .eq('student_id', student.id)
        .order('lesson_date', { ascending: false });

      if (error) {
        console.error('載入課程資料庫錯誤:', error);
        throw error;
      }
      
      setStudentLessons((data || []).map(lesson => ({
        id: lesson.id,
        lesson_date: lesson.lesson_date,
        lesson_status: lesson.lesson_status || 'unknown',
        lesson_teacher: lesson.lesson_teacher || undefined,
        lesson_activities: lesson.lesson_activities || undefined,
        notes: lesson.notes || undefined,
        video_url: lesson.video_url || undefined
      })));
    } catch (error) {
      console.error('載入學生課程失敗:', error);
      toast.error('載入課程資料失敗');
      setStudentLessons([]); // 設定為空陣列
    }
  };

  // 新增：響應式設計 - 在窄版面時自動收起
  useEffect(() => {
    const handleResize = () => {
      const isNarrow = window.innerWidth < 768; // md breakpoint
      // 移除自動展開邏輯，保持用戶設定的狀態
      // 只在初始化時設定預設值
    };

    // 初始檢查
    handleResize();

    // 監聽視窗大小變化
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadStudentMedia = async () => {
    if (!student) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hanami_student_media')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('載入媒體資料庫錯誤:', error);
        throw error;
      }
      
      setMedia((data || []).map(media => ({
        ...media,
        media_type: media.media_type as 'video' | 'photo',
        file_duration: media.file_duration ?? undefined,
        thumbnail_path: media.thumbnail_path ?? undefined,
        title: media.title ?? undefined,
        description: media.description ?? undefined,
        uploaded_by: media.uploaded_by ?? undefined,
        is_favorite: media.is_favorite ?? undefined
      })));
    } catch (error) {
      console.error('載入媒體失敗:', error);
      toast.error('載入媒體失敗');
      setMedia([]); // 設定為空陣列而不是保持舊資料
    } finally {
      setLoading(false);
    }
  };

  const validateFileForStudent = (file: File, mediaType: 'video' | 'photo') => {
    const limits = DEFAULT_MEDIA_LIMITS[mediaType];
    const errors: string[] = [];

    // 使用新的驗證函數
    const validation = validateFile(file, mediaType);
    if (!validation.valid) {
      errors.push(validation.error || '檔案驗證失敗');
    }

    // 檢查數量限制
    const currentCount = media.filter(m => m.media_type === mediaType).length;
    if (currentCount >= limits.maxCount) {
      errors.push(`已達到${mediaType === 'video' ? '影片' : '相片'}數量上限 (${limits.maxCount}個)`);
    }

    return errors;
  };



  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // 重置上傳狀態
    setUploading(false);
    setUploadProgress({});
    // 保持上傳區域展開，讓用戶可以看到選中的檔案
    setShowUploadArea(true);

    const fileArray = Array.from(files);
    
    // 立即檢查容量是否足夠
    const capacityCheck = await checkStudentCapacity(fileArray);
    if (!capacityCheck.hasSpace) {
      toast.error(`無法上傳：${capacityCheck.message}`);
      return;
    }
    const errors: string[] = [];

    // 獲取學生的配額設定
    let studentQuota = null;
    try {
      if (!student?.id) {
        errors.push('學生ID無效');
        return;
      }
      
      const { data: quota, error: quotaError } = await supabase
        .from('hanami_student_media_quota')
        .select('*')
        .eq('student_id', student.id)
        .single();

      if (quotaError) {
        console.error('獲取學生配額失敗:', quotaError);
        errors.push('無法獲取學生配額設定');
      } else {
        studentQuota = quota;
      }
    } catch (error) {
      console.error('獲取配額錯誤:', error);
      errors.push('獲取配額設定失敗');
    }

    // 獲取配額等級設定
    let quotaLevel = null;
    if (studentQuota) {
      try {
        const planTypeToLevelName = (planType: string) => {
          const mapping: { [key: string]: string } = {
            'free': '基礎版',
            'basic': '標準版',
            'premium': '進階版',
            'professional': '專業版'
          };
          return mapping[planType] || '基礎版';
        };

        const { data: level, error: levelError } = await supabase
          .from('hanami_media_quota_levels')
          .select('*')
          .eq('level_name', planTypeToLevelName(studentQuota.plan_type))
          .eq('is_active', true)
          .single();

        if (levelError) {
          console.error('獲取配額等級失敗:', levelError);
          errors.push('無法獲取配額等級設定');
        } else {
          quotaLevel = level;
        }
      } catch (error) {
        console.error('獲取配額等級錯誤:', error);
        errors.push('獲取配額等級失敗');
      }
    }

    for (const file of fileArray) {
      
      const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
      
      // 基本驗證
      const limits = DEFAULT_MEDIA_LIMITS[mediaType];
      
      // 檢查檔案格式
      if (!limits.allowedTypes.includes(file.type)) {
        errors.push(`不支援的檔案格式: ${file.type}`);
      }
      
      // 檢查檔案大小限制（使用配額等級的實際限制）
      const fileSizeMB = file.size / (1024 * 1024);
      let sizeLimit = 0;
      
      if (quotaLevel) {
        sizeLimit = mediaType === 'video' ? quotaLevel.video_size_limit_mb : quotaLevel.photo_size_limit_mb;
      } else {
        // 如果無法獲取配額等級，使用預設限制
        sizeLimit = mediaType === 'video' ? 20 : 1;
      }
      
      if (fileSizeMB > sizeLimit) {
        errors.push(`${mediaType === 'video' ? '影片' : '相片'}檔案大小超過限制 (${fileSizeMB.toFixed(1)}MB > ${sizeLimit}MB)`);
      }
      
      // 檢查數量限制（使用配額等級的實際限制）
      const currentCount = media.filter(m => m.media_type === mediaType).length;
      let countLimit = 0;
      
      if (quotaLevel) {
        countLimit = mediaType === 'video' ? quotaLevel.video_limit : quotaLevel.photo_limit;
      } else {
        // 如果無法獲取配額等級，使用預設限制
        countLimit = mediaType === 'video' ? 5 : 10;
      }
      
      // 計算同類型檔案的數量
      const sameTypeFiles = fileArray.filter(f => {
        const fMediaType = f.type.startsWith('video/') ? 'video' : 'photo';
        return fMediaType === mediaType;
      }).length;
      
      if (currentCount + sameTypeFiles > countLimit) {
        errors.push(`上傳後將超過${mediaType === 'video' ? '影片' : '相片'}數量上限 (當前: ${currentCount}, 新增: ${sameTypeFiles}, 限制: ${countLimit})`);
        // 立即返回，不繼續檢查其他檔案
        return;
      }
    }

    if (errors.length > 0) {
      console.error('檔案驗證錯誤:', errors);
      toast.error(errors.join('\n'));
      return;
    }

    console.log('檔案驗證通過，設置選中的檔案');
    setSelectedFiles(fileArray);
  };

  // 新增：處理媒體編輯器保存
  const handleMediaEditorSave = useCallback((editedFile: File) => {
    // 找到被編輯的文件在 selectedFiles 中的索引
    const editedFileIndex = selectedFiles.findIndex(file => file === fileToEdit);
    
    if (editedFileIndex !== -1) {
      // 用編輯後的文件替換原文件
      const newFiles = [...selectedFiles];
      newFiles[editedFileIndex] = editedFile;
      setSelectedFiles(newFiles);
    } else {
      // 如果找不到原文件，直接設置為編輯後的文件
      setSelectedFiles([editedFile]);
    }
    
    setShowMediaEditor(false);
    setFileToEdit(null);
    setEditingFileType(null);
    toast.success('媒體編輯完成！');
  }, [selectedFiles, fileToEdit]);

  // 新增：處理媒體編輯器取消
  const handleMediaEditorCancel = useCallback(() => {
    setShowMediaEditor(false);
    setFileToEdit(null);
    setEditingFileType(null);
  }, []);

  // 新增：檢查學生容量使用情況
  const checkStudentCapacity = async (selectedFiles?: File[]): Promise<{ hasSpace: boolean; message: string }> => {
    if (!student) {
      return { hasSpace: false, message: '學生資訊無效' };
    }

    try {
      // 使用 quotaLevel 狀態變數，確保與 UI 顯示一致
      const videoLimit = quotaLevel?.video_limit || 5;
      const photoLimit = quotaLevel?.photo_limit || 10;
      const storageLimitMB = quotaLevel?.storage_limit_mb || 250; // 儲存空間限制

      // 檢查當前影片和相片數量
      const currentVideoCount = media.filter(m => m.media_type === 'video').length;
      const currentPhotoCount = media.filter(m => m.media_type === 'photo').length;

      // 計算當前使用的儲存空間
      const currentStorageUsedMB = media.reduce((total, item) => {
        return total + ((item.file_size || 0) / (1024 * 1024));
      }, 0);

      // 容量檢查日誌已移除以提高性能

      // 如果沒有選擇檔案，只檢查當前容量
      if (!selectedFiles || selectedFiles.length === 0) {
        if (currentVideoCount >= videoLimit) {
          return { hasSpace: false, message: `影片數量已達上限 (${currentVideoCount}/${videoLimit})` };
        }

        if (currentPhotoCount >= photoLimit) {
          return { hasSpace: false, message: `相片數量已達上限 (${currentPhotoCount}/${photoLimit})` };
        }

        if (currentStorageUsedMB >= storageLimitMB) {
          return { hasSpace: false, message: `儲存空間已達上限 (${currentStorageUsedMB.toFixed(2)}MB/${storageLimitMB}MB)` };
        }

        return { hasSpace: true, message: '容量充足' };
      }

      // 計算即將上傳的檔案類型
      const newVideoCount = selectedFiles.filter(file => file.type.startsWith('video/')).length;
      const newPhotoCount = selectedFiles.filter(file => file.type.startsWith('image/')).length;

      // 計算即將上傳的檔案總大小
      const newStorageSizeMB = selectedFiles.reduce((total, file) => {
        return total + (file.size / (1024 * 1024));
      }, 0);

      // 檢查上傳後的總數量是否會超過限制
      const totalVideoCount = currentVideoCount + newVideoCount;
      const totalPhotoCount = currentPhotoCount + newPhotoCount;
      const totalStorageUsedMB = currentStorageUsedMB + newStorageSizeMB;

      // 容量檢查日誌已移除以提高性能

      if (totalVideoCount > videoLimit) {
        return { 
          hasSpace: false, 
          message: `影片數量將超過上限 (當前: ${currentVideoCount}, 新增: ${newVideoCount}, 限制: ${videoLimit})` 
        };
      }

      if (totalPhotoCount > photoLimit) {
        return { 
          hasSpace: false, 
          message: `相片數量將超過上限 (當前: ${currentPhotoCount}, 新增: ${newPhotoCount}, 限制: ${photoLimit})` 
        };
      }

      if (totalStorageUsedMB > storageLimitMB) {
        return { 
          hasSpace: false, 
          message: `儲存空間將超過上限 (當前: ${currentStorageUsedMB.toFixed(2)}MB, 新增: ${newStorageSizeMB.toFixed(2)}MB, 限制: ${storageLimitMB}MB)` 
        };
      }

      return { hasSpace: true, message: '容量充足' };
    } catch (error) {
      console.error('檢查容量失敗:', error);
      return { hasSpace: true, message: '無法檢查容量，允許上傳' };
    }
  };

  // 新增：檢查當前容量狀態
  const getCurrentCapacityStatus = () => {
    const videoCount = media.filter(m => m.media_type === 'video').length;
    const photoCount = media.filter(m => m.media_type === 'photo').length;
    
    // 使用實際的配額限制（從 quotaLevel 或預設值）
    const videoLimit = quotaLevel?.video_limit || 5;
    const photoLimit = quotaLevel?.photo_limit || 10;
    const storageLimitMB = quotaLevel?.storage_limit_mb || 250;
    
    // 計算當前使用的儲存空間
    const currentStorageUsedMB = media.reduce((total, item) => {
      return total + ((item.file_size || 0) / (1024 * 1024));
    }, 0);
    
    // 檢查是否達到任何限制
    const isVideoFull = videoCount >= videoLimit;
    const isPhotoFull = photoCount >= photoLimit;
    const isStorageFull = currentStorageUsedMB >= storageLimitMB;
    
    if (isVideoFull || isPhotoFull || isStorageFull) {
      return { status: 'full', message: '容量已滿' };
    } else if (videoCount >= videoLimit - 1 || photoCount >= photoLimit - 2 || currentStorageUsedMB >= storageLimitMB * 0.9) {
      return { status: 'near', message: '容量緊張' };
    } else {
      return { status: 'ok', message: '容量充足' };
    }
  };

  // 新增：取消上傳函數
  const cancelUpload = useCallback(() => {
    setUploading(false);
    setUploadProgress({});
    setSelectedFiles([]);
    setShowUploadArea(false);
    toast.success('上傳已取消');
  }, []);

  // 新增：處理方案升級成功
  const handleUpgradeSuccess = useCallback(() => {
    // 重新載入配額資訊
    loadQuotaLevel();
    // 重新載入學生資料以獲取最新的配額設定
    if (student) {
      // 重新獲取學生的配額設定
      supabase
        .from('hanami_student_media_quota')
        .select('*')
        .eq('student_id', student.id)
        .single()
        .then(({ data: updatedQuota, error }) => {
          if (!error && updatedQuota) {
            // 更新 student 物件的 quota 屬性
            if (student) {
              student.quota = updatedQuota as any;
            }
          }
        });
    }
    // 通知父組件配額已更改
    if (onQuotaChanged) {
      onQuotaChanged();
    }
  }, [student, onQuotaChanged]);

  // 獲取今天的課堂信息
  const getTodayLesson = async (studentId: string) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 格式
      
      const { data: lessons, error } = await supabase
        .from('hanami_student_lesson')
        .select('*')
        .eq('student_id', studentId)
        .eq('lesson_date', todayStr)
        .order('actual_timeslot', { ascending: true })
        .limit(1);
      
      if (error) {
        console.error('獲取今天課堂信息失敗:', error);
        return null;
      }
      
      return lessons && lessons.length > 0 ? lessons[0] : null;
    } catch (error) {
      console.error('獲取今天課堂信息錯誤:', error);
      return null;
    }
  };

  // 生成新的文件名格式：student_id_日期_時間.副檔名（避免中文造成的 Storage key 問題）
  const generateFileName = (originalName: string, studentId: string, lesson?: any) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
    
    // 獲取文件擴展名
    const fileExt = originalName.split('.').pop();
    
    // 如果有課堂信息，使用課堂時間
    let timeIdentifier = timeStr;
    if (lesson && lesson.actual_timeslot) {
      timeIdentifier = lesson.actual_timeslot.replace(/:/g, '').replace(/-/g, '');
    }
    
    // 直接使用 student_id 作為檔名前綴，確保安全
    const safeStudentId = (studentId || 'student').toString().replace(/[^\w-]/g, '_');
    
    // 生成新文件名：student_id_日期_時間.擴展名
    const newFileName = `${safeStudentId}_${dateStr}_${timeIdentifier}.${fileExt}`;
    
    return newFileName;
  };

  const uploadFiles = async () => {
    if (!student || selectedFiles.length === 0) return;

    // 獲取今天的課堂信息
    const todayLesson = await getTodayLesson(student.id);
    console.log('今天的課堂信息:', todayLesson);

    // 立即檢查容量
    const capacityCheck = await checkStudentCapacity(selectedFiles);
    if (!capacityCheck.hasSpace) {
      toast.error(`容量不足，無法上傳：${capacityCheck.message}`);
      return;
    }
    
    // 重置並開始上傳
    setUploading(true);
    setUploadProgress({});
    const newProgress: { [key: string]: number } = {};
    selectedFiles.forEach(file => newProgress[file.name] = 0);
    setUploadProgress(newProgress);

    try {
      for (const file of selectedFiles) {
        try {
        
        const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';

        // 獲取檔案大小限制
        let maxSizeMB = 20; // 預設值
        if (quotaLevel) {
          maxSizeMB = mediaType === 'video' ? quotaLevel.video_size_limit_mb : quotaLevel.photo_size_limit_mb;
        }
        
        // 檢查檔案大小是否超過媒體配額限制
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
          throw new Error(`檔案 ${file.name} (${fileSizeMB.toFixed(1)}MB) 超過媒體配額限制 (${maxSizeMB}MB)。請壓縮檔案後再試。`);
        }
        
        // 壓縮檔案（如果需要）
        const compressedFile = await compressFile(file, maxSizeMB);
        
        console.log('檔案壓縮後大小:', (compressedFile.size / (1024 * 1024)).toFixed(2) + 'MB');

        // 首先嘗試使用 API 路由上傳
        try {
          const formData = new FormData();
          formData.append('file', compressedFile);
          formData.append('studentId', student.id);
          formData.append('mediaType', mediaType);

          const response = await fetch('/api/student-media/upload', {
            method: 'POST',
            body: formData
          });

          console.log('API 響應狀態:', response.status);

          if (response.ok) {
            const result = await response.json();
            console.log('API 上傳成功:', result);
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            continue; // 成功，繼續下一個檔案
          } else {
            console.log('API 上傳失敗，嘗試客戶端上傳...');
          }
        } catch (apiError) {
          console.log('API 路由錯誤，嘗試客戶端上傳:', apiError);
        }

        // 如果 API 路由失敗，使用客戶端上傳
        console.log('使用客戶端上傳...');
        
        // 生成新的文件名格式：學生名＋今日上課日期時間
        const newFileName = generateFileName(file.name, student.id, todayLesson);
        
        // 生成檔案路徑
        const fileExt = newFileName.split('.').pop();
        const fileName = `${student.id}/${mediaType}s/${newFileName}`;

        // 注意：Supabase Pro 版本支援更大的檔案，讓 Supabase 自己處理檔案大小限制

        // 直接上傳到 Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('hanami-media')
          .upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage 上傳錯誤:', uploadError);
          throw new Error(`Storage 上傳失敗: ${uploadError.message}`);
        }

        console.log('Storage 上傳成功:', uploadData);

        // 獲取公開 URL
        const { data: urlData } = supabase.storage
          .from('hanami-media')
          .getPublicUrl(fileName);

        // 準備資料庫資料
        const mediaData = {
          student_id: student.id,
          media_type: mediaType,
          file_name: newFileName, // 使用新的文件名
          file_path: fileName,
          file_size: compressedFile.size,
          title: newFileName.replace(/\.[^/.]+$/, ''), // 使用新文件名作為標題
          uploaded_by: null, // 設為 null 而不是字串
          lesson_id: todayLesson?.id || null // 關聯到今天的課堂
        };

        console.log('準備插入的資料:', mediaData);
        console.log('學生 ID 類型:', typeof student.id);
        console.log('學生 ID 值:', student.id);

        // 驗證學生 ID 格式
        if (!student.id || typeof student.id !== 'string') {
          throw new Error('無效的學生 ID');
        }

        // 驗證 UUID 格式
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(student.id)) {
          console.error('學生 ID 不是有效的 UUID 格式:', student.id);
          throw new Error('學生 ID 格式錯誤');
        }

        // 儲存到資料庫
        const { data: dbData, error: dbError } = await supabase
          .from('hanami_student_media')
          .insert(mediaData)
          .select()
          .single();

        if (dbError) {
          console.error('資料庫插入錯誤:', dbError);
          // 如果資料庫插入失敗，刪除已上傳的檔案
          await supabase.storage
            .from('hanami-media')
            .remove([fileName]);
          throw new Error(`資料庫插入失敗: ${dbError.message}`);
        }

        console.log('資料庫插入成功:', dbData);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        // 立即更新本地媒體列表，確保容量檢查準確
        setMedia(prev => [...prev, {
          ...dbData,
          media_type: dbData.media_type as 'video' | 'photo',
          file_duration: dbData.file_duration ?? undefined,
          thumbnail_path: dbData.thumbnail_path ?? undefined,
          title: dbData.title ?? undefined,
          description: dbData.description ?? undefined,
          uploaded_by: dbData.uploaded_by ?? undefined,
          is_favorite: dbData.is_favorite ?? undefined
        }]);
        } catch (fileError) {
          console.error(`檔案 ${file.name} 上傳失敗:`, fileError);
          toast.error(`檔案 ${file.name} 上傳失敗: ${fileError instanceof Error ? fileError.message : '未知錯誤'}`);
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 表示錯誤
          continue; // 繼續處理下一個檔案
        }
      }

      // 檢查是否有檔案上傳成功
      const successCount = Object.values(uploadProgress).filter(progress => progress === 100).length;
      const errorCount = Object.values(uploadProgress).filter(progress => progress === -1).length;
      
      if (successCount > 0) {
        if (errorCount === 0) {
          toast.success('所有檔案上傳成功！');
        } else {
          toast.success(`部分檔案上傳成功！成功 ${successCount} 個，失敗 ${errorCount} 個`);
        }
      } else {
        toast.error('所有檔案上傳失敗！');
      }
      setSelectedFiles([]);
      setUploadProgress({});
      setShowUploadArea(false);
      loadStudentMedia(); // 重新載入媒體列表
      
      // 通知父組件配額已更改，觸發按鈕顏色更新
      if (onQuotaChanged) {
        onQuotaChanged();
      }
    } catch (error) {
      console.error('上傳失敗:', error);
      toast.error(`檔案上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      // 重置上傳狀態
      setUploadProgress({});
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!confirm('確定要刪除此媒體檔案嗎？')) return;

    try {
      const mediaToDelete = media.find(m => m.id === mediaId);
      if (!mediaToDelete) return;

      // 從 Storage 刪除檔案
      const { error: storageError } = await supabase.storage
        .from('hanami-media')
        .remove([mediaToDelete.file_path]);

      if (storageError) throw storageError;

      // 從資料庫刪除記錄
      const { error: dbError } = await supabase
        .from('hanami_student_media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      toast.success('媒體檔案已刪除');
      loadStudentMedia(); // 重新載入媒體列表
      
      // 通知父組件配額已更改，觸發按鈕顏色更新
      if (onQuotaChanged) {
        onQuotaChanged();
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      toast.error('刪除媒體檔案失敗');
    }
  };

  const toggleFavorite = async (mediaId: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('hanami_student_media')
        .update({ is_favorite: !currentFavorite })
        .eq('id', mediaId);

      if (error) throw error;
      
      // 更新本地狀態
      setMedia(prev => prev.map(item => 
        item.id === mediaId 
          ? { ...item, is_favorite: !currentFavorite }
          : item
      ));
      
      toast.success(currentFavorite ? '已取消收藏' : '已加入收藏');
    } catch (error) {
      console.error('切換收藏狀態失敗:', error);
      toast.error('操作失敗，請稍後再試');
    }
  };

  // 新增：開始編輯媒體標題
  const startEditTitle = (media: StudentMedia) => {
    setEditingMedia(media);
    setEditTitle(media.title || media.file_name);
    setIsEditing(true);
  };

  // 新增：取消編輯
  const cancelEdit = () => {
    setEditingMedia(null);
    setEditTitle('');
    setIsEditing(false);
  };

  // 新增：保存媒體標題
  const saveMediaTitle = async () => {
    if (!editingMedia || !editTitle.trim()) {
      toast.error('請輸入有效的標題');
      return;
    }

    try {
      const { error } = await supabase
        .from('hanami_student_media')
        .update({ 
          title: editTitle.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingMedia.id);

      if (error) throw error;
      
      // 更新本地狀態
      setMedia(prev => prev.map(item => 
        item.id === editingMedia.id 
          ? { ...item, title: editTitle.trim(), updated_at: new Date().toISOString() }
          : item
      ));
      
      toast.success('標題更新成功！');
      cancelEdit();
    } catch (error) {
      console.error('更新標題失敗:', error);
      toast.error('更新失敗，請稍後再試');
    }
  };

  // 新增：處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveMediaTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  // 新增：開始設定課程關聯
  const startLessonAssignment = (media: StudentMedia) => {
    setSelectedMediaForLesson(media);
    setSelectedLessonId(media.lesson_id || '');
    setShowLessonSelector(true);
  };

  // 新增：保存課程關聯
  const saveLessonAssignment = async () => {
    if (!selectedMediaForLesson) return;

    try {
      const { error } = await supabase
        .from('hanami_student_media')
        .update({ 
          lesson_id: selectedLessonId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMediaForLesson.id);

      if (error) throw error;
      
      // 更新本地狀態
      setMedia(prev => prev.map(item => 
        item.id === selectedMediaForLesson.id 
          ? { ...item, lesson_id: selectedLessonId || undefined, updated_at: new Date().toISOString() }
          : item
      ));
      
      toast.success('課程關聯設定成功！');
      setShowLessonSelector(false);
      setSelectedMediaForLesson(null);
      setSelectedLessonId('');
    } catch (error) {
      console.error('設定課程關聯失敗:', error);
      toast.error('設定失敗，請稍後再試');
    }
  };

  // 新增：取消課程關聯
  const cancelLessonAssignment = () => {
    setShowLessonSelector(false);
    setSelectedMediaForLesson(null);
    setSelectedLessonId('');
  };

  // 新增：獲取課程顯示名稱
  const getLessonDisplayName = (lesson: StudentLesson) => {
    const date = new Date(lesson.lesson_date).toLocaleDateString('zh-TW');
    const teacher = lesson.lesson_teacher ? ` - ${lesson.lesson_teacher}` : '';
    const status = lesson.lesson_status ? ` (${lesson.lesson_status})` : '';
    return `${date}${teacher}${status}`;
  };

  // 新增：獲取媒體關聯的課程
  const getMediaLesson = (media: StudentMedia) => {
    return studentLessons.find(lesson => lesson.id === media.lesson_id);
  };

  const getFileSize = (bytes: number) => {
    return formatFileSize(bytes);
  };

  const getDuration = (seconds: number) => {
    return formatDuration(seconds);
  };

  // 新增：獲取總使用容量
  const getTotalUsedSize = useMemo(() => {
    return media.reduce((sum, item) => sum + item.file_size, 0);
  }, [media]);

  // 新增：獲取計劃容量
  const getPlanSize = useMemo(() => {
    // 優先使用 quotaLevel 中的儲存空間限制
    if (quotaLevel?.storage_limit_mb) {
      return quotaLevel.storage_limit_mb * 1024 * 1024; // 轉換為 bytes
    }
    
    // 如果沒有 quotaLevel，使用 plan_type 映射
    const planType = student?.quota?.plan_type;
    switch (planType) {
      case 'free':
        return 250 * 1024 * 1024; // 250MB
      case 'basic':
        return 1.5 * 1024 * 1024 * 1024; // 1.5GB
      case 'standard':
        return 5 * 1024 * 1024 * 1024; // 5GB
      case 'premium':
        return 10 * 1024 * 1024 * 1024; // 10GB
      default:
        return 250 * 1024 * 1024; // 預設 250MB
    }
  }, [quotaLevel, student?.quota?.plan_type]);

  // 新增：獲取計劃類型文字
  const getPlanTypeText = useMemo(() => {
    // 優先使用 quotaLevel 中的等級名稱和儲存空間限制
    if (quotaLevel?.level_name && quotaLevel?.storage_limit_mb) {
      const sizeText = quotaLevel.storage_limit_mb >= 1024 
        ? `${(quotaLevel.storage_limit_mb / 1024).toFixed(0)}GB`
        : `${quotaLevel.storage_limit_mb}MB`;
      return `${quotaLevel.level_name} (${sizeText})`;
    }
    
    // 如果沒有 quotaLevel，使用 plan_type 映射
    const planType = student?.quota?.plan_type;
    switch (planType) {
      case 'free':
        return '免費計劃 (250MB)';
      case 'basic':
        return '基礎計劃 (1.5GB)';
      case 'standard':
        return '標準計劃 (5GB)';
      case 'premium':
        return '進階計劃 (10GB)';
      default:
        return '免費計劃 (250MB)';
    }
  }, [quotaLevel, student?.quota?.plan_type]);

  // 新增：獲取媒體縮圖 URL
  const getMediaThumbnailUrl = (mediaItem: StudentMedia) => {
    if (mediaItem.thumbnail_path) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hanami-media/${mediaItem.thumbnail_path}`;
    }
    
    // 如果沒有縮圖，返回原檔案 URL
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hanami-media/${mediaItem.file_path}`;
  };

  // 新增：獲取媒體預覽 URL
  const getMediaPreviewUrl = (mediaItem: StudentMedia) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hanami-media/${mediaItem.file_path}`;
  };

  // 新增：載入配額等級
  const loadQuotaLevel = async () => {
    if (!student) return;
    
    try {
      // 獲取學生的配額設定
      const { data: studentQuota, error: quotaError } = await supabase
        .from('hanami_student_media_quota')
        .select('*')
        .eq('student_id', student.id)
        .single();

      if (quotaError) {
        console.error('獲取學生配額失敗:', quotaError);
        // 如果沒有配額設定，使用預設的基礎版配額
        const { data: defaultLevel, error: defaultLevelError } = await supabase
          .from('hanami_media_quota_levels')
          .select('*')
          .eq('level_name', '基礎版')
          .eq('is_active', true)
          .single();

        if (defaultLevelError) {
          console.error('獲取預設配額等級失敗:', defaultLevelError);
          // 設定一個預設的配額等級
          setQuotaLevel({
            level_name: '基礎版',
            video_limit: 5,
            photo_limit: 10,
            video_size_limit_mb: 20,
            photo_size_limit_mb: 1,
            is_active: true
          });
        } else {
          setQuotaLevel(defaultLevel);
        }
        return;
      }

      // 獲取配額等級設定
      const planTypeToLevelName = (planType: string) => {
        const mapping: { [key: string]: string } = {
          'free': '基礎版',
          'basic': '標準版',
          'premium': '進階版',
          'professional': '專業版'
        };
        return mapping[planType] || '基礎版';
      };

      const { data: level, error: levelError } = await supabase
        .from('hanami_media_quota_levels')
        .select('*')
        .eq('level_name', planTypeToLevelName(studentQuota.plan_type))
        .eq('is_active', true)
        .single();

      if (levelError) {
        console.error('獲取配額等級失敗:', levelError);
        // 如果無法獲取指定等級，使用基礎版
        const { data: defaultLevel, error: defaultLevelError } = await supabase
          .from('hanami_media_quota_levels')
          .select('*')
          .eq('level_name', '基礎版')
          .eq('is_active', true)
          .single();

        if (defaultLevelError) {
          console.error('獲取預設配額等級失敗:', defaultLevelError);
          // 設定一個預設的配額等級
          setQuotaLevel({
            level_name: '基礎版',
            video_limit: 5,
            photo_limit: 10,
            video_size_limit_mb: 20,
            photo_size_limit_mb: 1,
            is_active: true
          });
        } else {
          setQuotaLevel(defaultLevel);
        }
        return;
      }

      setQuotaLevel(level);
    } catch (error) {
      console.error('載入配額等級錯誤:', error);
      // 設定預設配額等級
      setQuotaLevel({
        level_name: '基礎版',
        video_limit: 5,
        photo_limit: 10,
        video_size_limit_mb: 20,
        photo_size_limit_mb: 1,
        is_active: true
      });
    }
  };

  // 新增：智能檔案壓縮功能
  const compressFile = async (file: File, maxSizeMB: number): Promise<File> => {
    return new Promise((resolve) => {
      // 如果檔案已經小於配額限制，直接返回
      if (file.size <= maxSizeMB * 1024 * 1024) {
        resolve(file);
        return;
      }

      // 使用智能壓縮
      import('@/lib/mediaCompression').then(({ smartCompress }) => {
        smartCompress(file, maxSizeMB).then(compressedFile => {
          const originalSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(1);
          const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
          
          toast(`檔案 ${file.name} 已壓縮: ${originalSizeMB}MB → ${compressedSizeMB}MB (節省 ${compressionRatio}%)`, {
            icon: '🎯',
            duration: 3000
          });
          
          resolve(compressedFile);
        }).catch(error => {
          console.error('壓縮失敗:', error);
          resolve(file); // 壓縮失敗時使用原始檔案
        });
      }).catch(() => {
        // 如果模組載入失敗，使用原始壓縮邏輯
        if (file.type.startsWith('video/')) {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          const maxSizeMBFormatted = maxSizeMB.toString();
          
          toast(`檔案 ${file.name} (${fileSizeMB}MB) 超過配額限制 (${maxSizeMBFormatted}MB)，但將嘗試上傳。`, {
            icon: '⚠️',
            duration: 5000
          });
          
          const compressedFile = new File([file], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          });
          resolve(compressedFile);
          return;
        }

        // 對於圖片檔案，使用更強的壓縮
        if (file.type.startsWith('image/')) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            // 計算壓縮比例 - 更激進的壓縮
            const maxDimension = 1280; // 降低最大尺寸
            let { width, height } = img;
            
            if (width > height && width > maxDimension) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else if (height > maxDimension) {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 繪製壓縮後的圖片
            ctx?.drawImage(img, 0, 0, width, height);
            
            // 轉換為 Blob，使用更低的品質
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: file.lastModified,
                });
                
                const originalSizeMB = (file.size / (1024 * 1024)).toFixed(1);
                const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(1);
                
                toast.success(`圖片 ${file.name} 已壓縮: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            }, file.type, 0.6); // 降低到 60% 品質
          };
          
          img.onerror = () => {
            toast.error(`圖片 ${file.name} 壓縮失敗`);
            resolve(file);
          };
          
          img.src = URL.createObjectURL(file);
        } else {
          // 對於其他檔案類型，顯示配額警告但允許上傳
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          toast(`檔案 ${file.name} (${fileSizeMB}MB) 超過配額限制，但將嘗試上傳。`, {
            icon: '⚠️',
            duration: 4000
          });
          resolve(file);
        }
      });
    });
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full h-full sm:h-[90vh] sm:max-w-6xl flex flex-col shadow-2xl border border-[#EADBC8] animate-in slide-in-from-bottom-4 duration-500">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#EADBC8] flex-shrink-0 bg-gradient-to-r from-[#FFF9F2] to-[#FFFCEB] rounded-t-2xl">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-[#A64B2A] truncate">
              {student.full_name} 的媒體庫
            </h2>
            <p className="text-sm sm:text-base text-[#2B3A3B] mt-1 truncate">
              管理 {student.full_name} 的影片和相片檔案 ✨
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#FFF9F2] rounded-full transition-all duration-200 flex-shrink-0 ml-2 group"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#A64B2A] group-hover:text-[#8B3A1F] transition-colors" />
          </button>
        </div>

        {/* 配額狀態 */}
        <div className="p-4 sm:p-6 border-b border-[#EADBC8] flex-shrink-0 bg-gradient-to-r from-[#FFF9F2] to-[#FFFCEB]">
          {/* 配額標題和展開按鈕 */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg">
                <svg className="h-4 w-4 text-[#A64B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#A64B2A]">媒體統計</h3>
              {/* 容量狀態指示器 */}
              <div className="flex items-center gap-1 ml-2">
                {(() => {
                  const videoCount = media.filter(m => m.media_type === 'video').length;
                  const photoCount = media.filter(m => m.media_type === 'photo').length;
                  const videoLimit = quotaLevel?.video_limit || 5;
                  const photoLimit = quotaLevel?.photo_limit || 10;
                  const isNearLimit = videoCount >= videoLimit - 1 || photoCount >= photoLimit - 2;
                  const isAtLimit = videoCount >= videoLimit || photoCount >= photoLimit;
                  
                  if (isAtLimit) {
                    return (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        容量已滿
                      </div>
                    );
                  } else if (isNearLimit) {
                    return (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        容量緊張
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        容量充足
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
            <button
              onClick={() => setShowQuotaDetails(!showQuotaDetails)}
              className="flex items-center gap-1 text-xs sm:text-sm text-[#2B3A3B] hover:text-[#A64B2A] transition-all duration-200 p-2 rounded-lg hover:bg-[#FFF9F2] group"
            >
              {showQuotaDetails ? '收起' : '展開'}
              {showQuotaDetails ? (
                <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>

          {/* 配額詳細資訊 - 可展開/收起 */}
          <div className={`transition-all duration-500 ease-out overflow-hidden ${
            showQuotaDetails ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* 影片數量統計 */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-[#FFD59A] rounded-lg">
                    <Video className="h-4 w-4 sm:h-5 sm:w-5 text-[#A64B2A]" />
                  </div>
                  <span className="font-medium text-sm sm:text-base text-[#A64B2A]">影片數量</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span className="text-[#2B3A3B]">當前數量</span>
                  <span className="text-[#2B3A3B] font-semibold">{student.media_count.video} 個</span>
                </div>
                <div className="w-full bg-[#FFF9F2] rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4]"
                    style={{ width: `${Math.min((student.media_count.video / 50) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-[#2B3A3B] mt-1">
                  {student.media_count.video === 0 ? '尚無影片' : 
                   student.media_count.video === 1 ? '1 個影片' : 
                   `${student.media_count.video} 個影片`}
                </div>
              </div>

              {/* 相片數量統計 */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-[#EBC9A4] rounded-lg">
                    <PhotoIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#A64B2A]" />
                  </div>
                  <span className="font-medium text-sm sm:text-base text-[#A64B2A]">相片數量</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span className="text-[#2B3A3B]">當前數量</span>
                  <span className="text-[#2B3A3B] font-semibold">{student.media_count.photo} 張</span>
                </div>
                <div className="w-full bg-[#FFF9F2] rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4]"
                    style={{ width: `${Math.min((student.media_count.photo / 100) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-[#2B3A3B] mt-1">
                  {student.media_count.photo === 0 ? '尚無相片' : 
                   student.media_count.photo === 1 ? '1 張相片' : 
                   `${student.media_count.photo} 張相片`}
                </div>
              </div>

              {/* 總計統計 */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-[#FFD59A] rounded-lg">
                    <svg className="h-4 w-4 text-[#A64B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm sm:text-base text-[#A64B2A]">總計統計</span>
                </div>
                
                {/* 圓形圖表 */}
                <div className="flex items-center justify-center mb-3">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                    {/* 背景圓圈 */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#FFF9F2]"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* 進度圓圈 */}
                      <path
                        className={`transition-all duration-1000 ease-out ${
                          getPlanSize > 0 && (getTotalUsedSize / getPlanSize) >= 0.8 
                            ? 'text-red-400' 
                            : 'text-[#FFD59A]'
                        }`}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${Math.min((getPlanSize > 0 ? (getTotalUsedSize / getPlanSize) * 100 : 0), 100)}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    {/* 中心文字 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-bold text-[#A64B2A]">
                          {Math.round(getPlanSize > 0 ? (getTotalUsedSize / getPlanSize) * 100 : 0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 容量資訊 */}
                <div className="text-center space-y-1">
                  <div className="text-lg sm:text-xl font-bold text-[#A64B2A]">
                    {formatFileSize(getTotalUsedSize)}
                  </div>
                  <div className="text-xs text-[#2B3A3B]">
                    / {formatFileSize(getPlanSize)}
                  </div>
                  <div className="text-xs text-[#2B3A3B]">
                    {getPlanTypeText}
                  </div>
                </div>
                
                {/* 詳細資訊 */}
                <div className="mt-3 text-xs text-[#2B3A3B] space-y-1">
                  <div className="flex justify-between">
                    <span>已使用:</span>
                    <span className="font-medium">{formatFileSize(getTotalUsedSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>剩餘:</span>
                    <span className="font-medium">{formatFileSize(Math.max(0, getPlanSize - getTotalUsedSize))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 簡化的配額摘要 - 當收起時顯示 */}
          {!showQuotaDetails && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-[#2B3A3B] animate-in fade-in duration-300">
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <div className="p-1 bg-[#FFD59A] rounded-full">
                    <Video className="h-3 w-3 text-[#A64B2A]" />
                  </div>
                  <span>影片: {student.media_count.video} 個</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="p-1 bg-[#EBC9A4] rounded-full">
                    <PhotoIcon className="h-3 w-3 text-[#A64B2A]" />
                  </div>
                  <span>相片: {student.media_count.photo} 張</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="p-1 bg-[#FFD59A] rounded-full">
                    <svg className="h-3 w-3 text-[#A64B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="font-medium text-[#A64B2A]">
                    {formatFileSize(getTotalUsedSize)} / {formatFileSize(getPlanSize)}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs shadow-sm bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#A64B2A]`}>
                  {Math.round(getPlanSize > 0 ? (getTotalUsedSize / getPlanSize) * 100 : 0)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="p-4 sm:p-6 border-b border-[#EADBC8] flex-shrink-0 bg-gradient-to-r from-[#FFFCEB] to-[#FFF9F2]">
          {/* 操作標題和展開按鈕 */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-[#EBC9A4] to-[#FFD59A] rounded-lg">
                <svg className="h-4 w-4 text-[#A64B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#A64B2A]">操作</h3>
            </div>
            <button
              onClick={() => setShowActionButtons(!showActionButtons)}
              className="flex items-center gap-1 text-xs sm:text-sm text-[#2B3A3B] hover:text-[#A64B2A] transition-all duration-200 p-2 rounded-lg hover:bg-[#FFF9F2] group"
            >
              {showActionButtons ? '收起' : '展開'}
              {showActionButtons ? (
                <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>

          {/* 操作按鈕 - 可展開/收起 */}
          <div className={`transition-all duration-500 ease-out overflow-hidden ${
            showActionButtons ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const capacityStatus = getCurrentCapacityStatus();
                    const isCapacityFull = capacityStatus.status === 'full';
                    
                    return (
                      <button
                        onClick={() => {
                          if (isCapacityFull) {
                            toast.error('容量已滿，無法上傳新檔案');
                            return;
                          }
                          setShowUploadArea(true);
                        }}
                        disabled={showUploadArea || isCapacityFull}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 w-full sm:w-auto justify-center shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none ${
                          isCapacityFull 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] text-white hover:from-[#8B3A1F] hover:to-[#6B2A0F]'
                        }`}
                      >
                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="font-medium">
                          {isCapacityFull ? '容量已滿' : '上傳媒體'}
                        </span>
                      </button>
                    );
                  })()}
                  
                  {/* 容量狀態提示 */}
                  {(() => {
                    const videoCount = media.filter(m => m.media_type === 'video').length;
                    const photoCount = media.filter(m => m.media_type === 'photo').length;
                    const videoLimit = quotaLevel?.video_limit || 5;
                    const photoLimit = quotaLevel?.photo_limit || 10;
                    const isNearLimit = videoCount >= videoLimit - 1 || photoCount >= photoLimit - 2;
                    const isAtLimit = videoCount >= videoLimit || photoCount >= photoLimit;
                    
                    if (isAtLimit) {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs border border-red-200">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          容量已滿
                        </div>
                      );
                    } else if (isNearLimit) {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs border border-yellow-200">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          容量緊張
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs border border-green-200">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          可上傳
                        </div>
                      );
                    }
                  })()}
                  
                  {/* 方案升級按鈕 */}
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs border border-blue-200 hover:bg-blue-200 transition-colors"
                  >
                    <Cog6ToothIcon className="h-3 w-3" />
                    升級方案
                  </button>
                </div>
                
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFF9F2] to-[#FFFCEB] text-[#A64B2A] rounded-xl hover:from-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-200 w-full sm:w-auto justify-center shadow-sm hover:shadow-md transform hover:scale-105 border border-[#EADBC8]"
                >
                  {viewMode === 'grid' ? (
                    <>
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="font-medium">列表檢視</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="font-medium">網格檢視</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2B3A3B] justify-center sm:justify-start">
                <div className="p-1.5 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg">
                  <svg className="h-4 w-4 text-[#A64B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span>共 {media.length} 個檔案</span>
              </div>
            </div>
          </div>

          {/* 簡化的操作摘要 - 當收起時顯示 */}
          {!showActionButtons && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-[#2B3A3B] animate-in fade-in duration-300">
              <div className="flex gap-2 justify-center sm:justify-start">
                <button
                  onClick={() => setShowUploadArea(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#A64B2A] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <PlusIcon className="h-3 w-3" />
                  <span>上傳</span>
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#FFF9F2] to-[#FFFCEB] text-[#A64B2A] rounded-lg hover:from-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 border border-[#EADBC8]"
                >
                  {viewMode === 'grid' ? (
                    <>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span>列表</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>網格</span>
                    </>
                  )}
                </button>
              </div>
              <span className="text-center sm:text-left">共 {media.length} 個檔案</span>
            </div>
          )}
        </div>

        {/* 可滾動內容區域 */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* 上傳區域 */}
          {showUploadArea && (
            <div className="p-4 sm:p-6 border-b border-[#EADBC8] bg-gradient-to-r from-[#FFF9F2] to-[#FFFCEB] animate-in slide-in-from-top-4 duration-500">
              <div className="border-2 border-dashed border-[#EADBC8] rounded-2xl p-4 sm:p-6 text-center bg-white shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-3 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full w-16 h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <ArrowUpTrayIcon className="h-8 w-8 sm:h-10 sm:w-10 text-[#A64B2A]" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-[#A64B2A] mb-2">上傳媒體檔案</h3>
                <p className="text-sm sm:text-base text-[#2B3A3B] mb-4">
                  拖拽檔案到此處或點擊選擇檔案 ✨
                </p>
                
                {/* 簡化版本 - 直接使用原生按鈕 */}
                <input
                  type="file"
                  multiple
                  accept="video/*,image/*"
                  onChange={(e) => {
                    console.log('檔案選擇事件觸發');
                    console.log('選擇的檔案:', e.target.files);
                    handleFileSelect(e.target.files);
                  }}
                  className="block w-full text-xs sm:text-sm text-[#2B3A3B] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#FFD59A] file:to-[#EBC9A4] file:text-[#A64B2A] hover:file:from-[#EBC9A4] hover:file:to-[#FFD59A] transition-all duration-200"
                />

                {/* 上傳限制提示 */}
                <div className="mt-4 text-xs sm:text-sm text-[#2B3A3B] space-y-1">
                  <p className="flex items-center gap-1 justify-center">
                    <span className="p-1 bg-[#FFD59A] rounded-full">📹</span>
                    影片: 最多 {quotaLevel?.video_limit || DEFAULT_MEDIA_LIMITS.video.maxCount} 個，每個 ≤ {quotaLevel?.video_size_limit_mb || DEFAULT_MEDIA_LIMITS.video.maxSize / (1024 * 1024)}MB
                  </p>
                  <p className="flex items-center gap-1 justify-center">
                    <span className="p-1 bg-[#EBC9A4] rounded-full">📸</span>
                    相片: 最多 {quotaLevel?.photo_limit || DEFAULT_MEDIA_LIMITS.photo.maxCount} 張，每張 ≤ {quotaLevel?.photo_size_limit_mb || DEFAULT_MEDIA_LIMITS.photo.maxSize / (1024 * 1024)}MB
                  </p>
                  
                  {/* 檔案上傳指南連結 */}
                  <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                    <a 
                      href="/admin/file-upload-guide" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#A64B2A] hover:text-[#8B3A1F] transition-colors text-xs"
                    >
                      <InformationCircleIcon className="h-3 w-3" />
                      查看檔案上傳指南
                    </a>
                  </div>
                </div>

                {/* 選中的檔案 */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 animate-in fade-in duration-300">
                    <h4 className="font-medium mb-2 text-sm sm:text-base text-[#A64B2A]">選中的檔案:</h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => {
                        const isVideo = file.type.startsWith('video/');
                        const isPhoto = file.type.startsWith('image/');
                        const canEdit = isVideo || isPhoto;
                        
                        return (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#EADBC8] shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {isVideo ? (
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                    </svg>
                                  </div>
                                ) : isPhoto ? (
                                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm truncate text-[#2B3A3B] font-medium">{file.name}</div>
                                <div className="text-xs text-[#2B3A3B] opacity-75">{getFileSize(file.size)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    setFileToEdit(file);
                                    setEditingFileType(isVideo ? 'video' : 'photo');
                                    setShowMediaEditor(true);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-xs shadow-sm hover:shadow-md transform hover:scale-105"
                                  title={`編輯${isVideo ? '影片' : '相片'}`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>編輯</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const newFiles = selectedFiles.filter((_, i) => i !== index);
                                  setSelectedFiles(newFiles);
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-xs shadow-sm hover:shadow-md transform hover:scale-105"
                                title="移除檔案"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>移除</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={uploadFiles}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] text-white rounded-xl hover:from-[#8B3A1F] hover:to-[#6B2A0F] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 w-full sm:w-auto justify-center shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>上傳中...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>開始上傳</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={uploading ? cancelUpload : () => {
                          setSelectedFiles([]);
                          setShowUploadArea(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFF9F2] to-[#FFFCEB] text-[#A64B2A] rounded-xl hover:from-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-200 w-full sm:w-auto justify-center shadow-sm hover:shadow-md transform hover:scale-105 border border-[#EADBC8]"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>{uploading ? '取消上傳' : '取消'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 沒有選中檔案時的取消按鈕 */}
                {selectedFiles.length === 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowUploadArea(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFF9F2] to-[#FFFCEB] text-[#A64B2A] rounded-xl hover:from-[#FFD59A] hover:to-[#EBC9A4] transition-all duration-200 w-full sm:w-auto justify-center shadow-sm hover:shadow-md transform hover:scale-105 mx-auto border border-[#EADBC8]"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>取消上傳</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 媒體列表 */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanami-primary"></div>
              </div>
            ) : media.length === 0 ? (
              <div className="text-center py-12">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">還沒有媒體檔案</h3>
                <p className="text-gray-600">點擊上傳按鈕開始添加影片或相片</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {media.map((item) => (
                  <HanamiCard key={item.id} className="p-4">
                    {viewMode === 'grid' ? (
                      // 網格檢視
                      <div>
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative group">
                          {item.media_type === 'video' ? (
                            <>
                              <img
                                src={getMediaThumbnailUrl(item)}
                                alt={item.title || item.file_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  // 如果圖片載入失敗，顯示預設圖標
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <Video className="h-8 w-8 text-white drop-shadow-lg" />
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                {item.file_duration ? getDuration(item.file_duration) : '00:00'}
                              </div>
                            </>
                          ) : (
                            <img
                              src={getMediaThumbnailUrl(item)}
                              alt={item.title || item.file_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                // 如果圖片載入失敗，顯示預設圖標
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          )}
                          {/* 預設圖標 - 當圖片載入失敗時顯示 */}
                          <div className={`absolute inset-0 flex items-center justify-center ${item.media_type === 'video' ? 'hidden' : ''}`}>
                            {item.media_type === 'video' ? (
                              <Video className="h-12 w-12 text-gray-400" />
                            ) : (
                              <PhotoIcon className="h-12 w-12 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {editingMedia?.id === item.id ? (
                            // 編輯模式
                            <div className="space-y-2">
                              <HanamiInput
                                value={editTitle}
                                onChange={(value) => setEditTitle(value)}
                                placeholder="輸入新標題"
                                className="text-sm"
                                onKeyDown={handleKeyDown}
                              />
                              <div className="flex gap-1">
                                <HanamiButton
                                  variant="primary"
                                  size="sm"
                                  onClick={saveMediaTitle}
                                  className="flex-1"
                                >
                                  保存
                                </HanamiButton>
                                <HanamiButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={cancelEdit}
                                >
                                  取消
                                </HanamiButton>
                              </div>
                            </div>
                          ) : (
                            // 顯示模式
                            <h4 className="font-medium truncate cursor-pointer hover:text-[#A64B2A] transition-colors group" 
                                onClick={() => startEditTitle(item)}>
                              {item.title || item.file_name}
                              <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#A64B2A]">
                                ✏️
                              </span>
                            </h4>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{getFileSize(item.file_size)}</span>
                            {item.media_type === 'video' && item.file_duration && (
                              <span>{getDuration(item.file_duration)}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <HanamiButton
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedMedia(item);
                                setShowPreview(true);
                              }}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </HanamiButton>
                            <HanamiButton
                              variant="soft"
                              size="sm"
                              onClick={() => startEditTitle(item)}
                              disabled={isEditing}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </HanamiButton>
                            <HanamiButton
                              variant="soft"
                              size="sm"
                              onClick={() => startLessonAssignment(item)}
                              disabled={showLessonSelector}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </HanamiButton>
                            <HanamiButton
                              variant="danger"
                              size="sm"
                              onClick={() => deleteMedia(item.id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </HanamiButton>
                          </div>
                          
                          {/* 課程關聯顯示 */}
                          {getMediaLesson(item) && (
                            <div className="mt-2 p-2 bg-gradient-to-r from-[#FFF9F2] to-[#FFFCEB] rounded-lg border border-[#EADBC8]">
                              <div className="flex items-center gap-1 text-xs text-[#A64B2A]">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="truncate">{getLessonDisplayName(getMediaLesson(item)!)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // 列表檢視
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative group flex-shrink-0">
                          {item.media_type === 'video' ? (
                            <>
                              <img
                                src={getMediaThumbnailUrl(item)}
                                alt={item.title || item.file_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  // 如果圖片載入失敗，顯示預設圖標
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <Video className="h-6 w-6 text-white drop-shadow-lg" />
                              </div>
                              <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                                {item.file_duration ? getDuration(item.file_duration) : '00:00'}
                              </div>
                            </>
                          ) : (
                            <img
                              src={getMediaThumbnailUrl(item)}
                              alt={item.title || item.file_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                // 如果圖片載入失敗，顯示預設圖標
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          )}
                          {/* 預設圖標 - 當圖片載入失敗時顯示 */}
                          <div className={`absolute inset-0 flex items-center justify-center ${item.media_type === 'video' ? 'hidden' : ''}`}>
                            {item.media_type === 'video' ? (
                              <Video className="h-8 w-8 text-gray-400" />
                            ) : (
                              <PhotoIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          {editingMedia?.id === item.id ? (
                            // 編輯模式
                            <div className="space-y-2">
                              <HanamiInput
                                value={editTitle}
                                onChange={(value) => setEditTitle(value)}
                                placeholder="輸入新標題"
                                className="text-sm"
                                onKeyDown={handleKeyDown}
                              />
                              <div className="flex gap-1">
                                <HanamiButton
                                  variant="primary"
                                  size="sm"
                                  onClick={saveMediaTitle}
                                >
                                  保存
                                </HanamiButton>
                                <HanamiButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={cancelEdit}
                                >
                                  取消
                                </HanamiButton>
                              </div>
                            </div>
                          ) : (
                            // 顯示模式
                            <>
                              <h4 className="font-medium cursor-pointer hover:text-[#A64B2A] transition-colors group" 
                                  onClick={() => startEditTitle(item)}>
                                {item.title || item.file_name}
                                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#A64B2A]">
                                  ✏️
                                </span>
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{getFileSize(item.file_size)}</span>
                                {item.media_type === 'video' && item.file_duration && (
                                  <span>{getDuration(item.file_duration)}</span>
                                )}
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <HanamiButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedMedia(item);
                              setShowPreview(true);
                            }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </HanamiButton>
                          <HanamiButton
                            variant="soft"
                            size="sm"
                            onClick={() => startEditTitle(item)}
                            disabled={isEditing}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </HanamiButton>
                          <HanamiButton
                            variant="soft"
                            size="sm"
                            onClick={() => startLessonAssignment(item)}
                            disabled={showLessonSelector}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </HanamiButton>
                          <HanamiButton
                            variant="danger"
                            size="sm"
                            onClick={() => deleteMedia(item.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </HanamiButton>
                        </div>
                        
                        {/* 課程關聯顯示 */}
                        {getMediaLesson(item) && (
                          <div className="mt-2 p-2 bg-gradient-to-r from-[#FFF9F2] to-[#FFFCEB] rounded-lg border border-[#EADBC8]">
                            <div className="flex items-center gap-1 text-xs text-[#A64B2A]">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span>{getLessonDisplayName(getMediaLesson(item)!)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </HanamiCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 媒體預覽模態視窗 */}
      {showPreview && selectedMedia && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-medium">{selectedMedia.title || selectedMedia.file_name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedMedia.media_type === 'video' ? (
                <video
                  controls
                  className="w-full max-h-96 object-contain"
                  src={getMediaPreviewUrl(selectedMedia)}
                >
                  您的瀏覽器不支援影片播放
                </video>
              ) : (
                <img
                  src={getMediaPreviewUrl(selectedMedia)}
                  alt={selectedMedia.title || selectedMedia.file_name}
                  className="w-full max-h-96 object-contain"
                />
              )}
              <div className="mt-4 text-sm text-gray-600">
                <p>檔案大小: {getFileSize(selectedMedia.file_size)}</p>
                {selectedMedia.file_duration && (
                  <p>時長: {getDuration(selectedMedia.file_duration)}</p>
                )}
                <p>上傳時間: {new Date(selectedMedia.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 課程選擇器模態視窗 */}
      {showLessonSelector && selectedMediaForLesson && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* 標題欄 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">設定課程關聯</h2>
                <p className="text-gray-600 mt-1">
                  為「{selectedMediaForLesson.title || selectedMediaForLesson.file_name}」選擇關聯的課程
                </p>
              </div>
              <button
                onClick={cancelLessonAssignment}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* 課程列表 */}
            <div className="p-6">
              <div className="space-y-3">
                {/* 無關聯選項 */}
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="lesson"
                    value=""
                    checked={selectedLessonId === ''}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">不關聯任何課程</div>
                    <div className="text-sm text-gray-600">此媒體將不會與任何課程關聯</div>
                  </div>
                </label>

                {/* 課程選項 */}
                {studentLessons.map((lesson) => (
                  <label key={lesson.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="lesson"
                      value={lesson.id}
                      checked={selectedLessonId === lesson.id}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{getLessonDisplayName(lesson)}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {lesson.lesson_activities && (
                          <div>活動: {lesson.lesson_activities}</div>
                        )}
                        {lesson.notes && (
                          <div>備註: {lesson.notes}</div>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* 空狀態 */}
              {studentLessons.length === 0 && (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到課程</h3>
                  <p className="text-gray-600">此學生目前沒有任何課程記錄</p>
                </div>
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <HanamiButton
                variant="secondary"
                onClick={cancelLessonAssignment}
              >
                取消
              </HanamiButton>
              <HanamiButton
                variant="primary"
                onClick={saveLessonAssignment}
              >
                確認設定
              </HanamiButton>
            </div>
          </div>
        </div>
      )}

      {/* 方案升級模態視窗 */}
      {showUpgradeModal && student && (
        <PlanUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          student={student}
          onUpgradeSuccess={handleUpgradeSuccess}
        />
      )}
      
      {/* 媒體編輯器 */}
      {showMediaEditor && fileToEdit && editingFileType && (
        <MediaEditor
          file={fileToEdit}
          type={editingFileType}
          onSave={handleMediaEditorSave}
          onCancel={handleMediaEditorCancel}
        />
      )}
    </div>
  );
} 