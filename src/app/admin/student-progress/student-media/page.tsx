'use client';

import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  Cog6ToothIcon,
  HomeIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import {
  TreePine,
  FileText,
  Users,
  Video
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { HanamiCard, HanamiButton, HanamiInput } from '@/components/ui';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { StudentMediaModal, PlanUpgradeModal } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { StudentMediaQuota, StudentMedia } from '@/types/progress';

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

export default function StudentMediaPage() {
  const [students, setStudents] = useState<StudentWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithMedia | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [courseTypes, setCourseTypes] = useState<Array<{id: string, name: string}>>([]);

  // 篩選狀態
  const [filters, setFilters] = useState({
    course_types: [] as string[],
    plan_types: [] as string[],
    usage_levels: [] as string[], // low, medium, high
  });

  // 彈出選擇相關狀態
  const [showPopup, setShowPopup] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState<string | string[]>([]);

  useEffect(() => {
    loadStudents();
    loadCourseTypes();
  }, []);

  const loadCourseTypes = async () => {
    try {
      const response = await fetch('/api/course-types');
      if (response.ok) {
        const data = await response.json();
        setCourseTypes(data);
      } else {
        console.error('載入課程類型失敗');
        // 如果載入失敗，使用備用選項
        setCourseTypes([
          { id: '1', name: '鋼琴' },
          { id: '2', name: '小提琴' },
          { id: '3', name: '大提琴' },
          { id: '4', name: '長笛' },
          { id: '5', name: '吉他' },
          { id: '6', name: '鼓組' },
          { id: '7', name: '聲樂' },
          { id: '8', name: '音樂專注力' },
        ]);
      }
    } catch (error) {
      console.error('載入課程類型失敗:', error);
      // 如果載入失敗，使用備用選項
      setCourseTypes([
        { id: '1', name: '鋼琴' },
        { id: '2', name: '小提琴' },
        { id: '3', name: '大提琴' },
        { id: '4', name: '長笛' },
        { id: '5', name: '吉他' },
        { id: '6', name: '鼓組' },
        { id: '7', name: '聲樂' },
        { id: '8', name: '音樂專注力' },
      ]);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      // 先載入學生基本資料
      const { data: studentsData, error: studentsError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, nick_name, course_type')
        .order('full_name');

      if (studentsError) throw studentsError;

      // 分別載入配額資料
      const { data: quotaData, error: quotaError } = await supabase
        .from('hanami_student_media_quota')
        .select('*');

      if (quotaError) {
        console.warn('載入配額資料失敗，使用預設配額:', quotaError);
      }

      // 載入媒體統計
      const { data: mediaStats, error: mediaError } = await supabase
        .from('hanami_student_media')
        .select('student_id, media_type')
        .in('student_id', studentsData?.map(s => s.id) || []);

      if (mediaError) {
        console.warn('載入媒體統計失敗:', mediaError);
      }

      // 處理資料
      const processedStudents = (studentsData || []).map(student => {
        // 查找學生的配額資料
        const existingQuota = quotaData?.find(q => q.student_id === student.id);
        
        const getValidPlanType = (planType: string): 'free' | 'basic' | 'standard' | 'premium' | 'professional' => {
          if ([
            'free', 'basic', 'standard', 'premium', 'professional'
          ].includes(planType)) {
            return planType as 'free' | 'basic' | 'standard' | 'premium' | 'professional';
          }
          if (planType === 'free:create') return 'free';
          return 'free';
        };

        const quota: StudentMediaQuota = existingQuota ? {
          student_id: existingQuota.student_id,
          plan_type: getValidPlanType(existingQuota.plan_type || 'free'),
          video_limit: existingQuota.video_limit || 5,
          photo_limit: existingQuota.photo_limit || 10,
          video_count: existingQuota.video_count || 0,
          photo_count: existingQuota.photo_count || 0,
          total_used_space: existingQuota.total_used_space || 0,
          last_updated: existingQuota.last_updated || new Date().toISOString(),
        } : {
          student_id: student.id,
          plan_type: 'free',
          video_limit: 5,
          photo_limit: 10,
          video_count: 0,
          photo_count: 0,
          total_used_space: 0,
          last_updated: new Date().toISOString(),
        };

        const studentMedia = mediaStats?.filter(m => m.student_id === student.id) || [];
        const mediaCount = {
          video: studentMedia.filter(m => m.media_type === 'video').length,
          photo: studentMedia.filter(m => m.media_type === 'photo').length,
        };

        return {
          id: student.id,
          full_name: student.full_name,
          nick_name: student.nick_name,
          course_type: student.course_type,
          quota,
          media_count: mediaCount,
        };
      });

      setStudents(processedStudents);
    } catch (error) {
      console.error('載入學生資料失敗:', error);
      toast.error('載入學生資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const getUsageLevel = (quota: StudentMediaQuota) => {
    const videoUsage = quota.video_count / quota.video_limit;
    const photoUsage = quota.photo_count / quota.photo_limit;
    const maxUsage = Math.max(videoUsage, photoUsage);
    
    if (maxUsage >= 0.9) return 'high';
    if (maxUsage >= 0.7) return 'medium';
    return 'low';
  };

  const getUsageColor = (usageLevel: string) => {
    switch (usageLevel) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // 新增：格式化檔案大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 新增：獲取學生總使用容量
  const getStudentTotalUsedSize = (student: StudentWithMedia) => {
    // 這裡需要從資料庫獲取學生的實際媒體檔案大小
    // 暫時使用估算值：每個影片 10MB，每個相片 1MB
    return (student.media_count.video * 10 * 1024 * 1024) + (student.media_count.photo * 1024 * 1024);
  };

  // 新增：獲取學生計劃容量
  const getStudentPlanSize = (student: StudentWithMedia) => {
    let planType = student.quota.plan_type as string;
    if (planType === 'free:create') planType = 'free';
    switch (planType as 'free' | 'basic' | 'standard' | 'premium' | 'professional') {
      case 'free':
        return 250 * 1024 * 1024; // 250MB
      case 'basic':
        return 1.5 * 1024 * 1024 * 1024; // 1.5GB
      case 'premium':
        return 5 * 1024 * 1024 * 1024; // 5GB
      case 'professional':
        return 10 * 1024 * 1024 * 1024; // 10GB
      default:
        return 250 * 1024 * 1024; // 預設 250MB
    }
  };

  // 新增：獲取容量使用百分比
  const getCapacityUsagePercentage = (student: StudentWithMedia) => {
    const usedSize = getStudentTotalUsedSize(student);
    const planSize = getStudentPlanSize(student);
    return planSize > 0 ? Math.min((usedSize / planSize) * 100, 100) : 0;
  };

  const handleStudentClick = (student: StudentWithMedia) => {
    setSelectedStudent(student);
    setShowMediaModal(true);
  };

  const handleUploadClick = (student: StudentWithMedia) => {
    setSelectedStudent(student);
    setShowUploadModal(true);
  };

  const handleUpgradeClick = (student: StudentWithMedia) => {
    setSelectedStudent(student);
    setShowUpgradeModal(true);
  };

  // 新增：處理升級成功
  const handleUpgradeSuccess = () => {
    // 重新載入學生資料
    loadStudents();
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
  };

  const handlePopupConfirm = () => {
    const field = showPopup.field;
    if (field === 'course_types') {
      handleFilterChange('course_types', popupSelected);
    } else if (field === 'plan_types') {
      handleFilterChange('plan_types', popupSelected);
    } else if (field === 'usage_levels') {
      handleFilterChange('usage_levels', popupSelected);
    }
    setShowPopup({ field: '', open: false });
    setPopupSelected([]);
  };

  const handlePopupCancel = () => {
    setShowPopup({ field: '', open: false });
    setPopupSelected([]);
  };

  const clearFilters = () => {
    setFilters({
      course_types: [],
      plan_types: [],
      usage_levels: [],
    });
    setSearchQuery('');
  };

  const getFilteredStudents = () => {
    return students.filter(student => {
      // 搜尋篩選
      const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (student.nick_name && student.nick_name.toLowerCase().includes(searchQuery.toLowerCase()));

      // 課程類型篩選
      const matchesCourseType = filters.course_types.length === 0 || 
                               (student.course_type && filters.course_types.includes(student.course_type));

      // 方案類型篩選
      const matchesPlanType = filters.plan_types.length === 0 || 
                             filters.plan_types.includes(student.quota.plan_type);

      // 使用量篩選 - 基於容量使用率
      const capacityUsage = getCapacityUsagePercentage(student);
      const matchesUsageLevel = filters.usage_levels.length === 0 || 
                               (capacityUsage >= 80 && filters.usage_levels.includes('high')) ||
                               (capacityUsage >= 50 && capacityUsage < 80 && filters.usage_levels.includes('medium')) ||
                               (capacityUsage < 50 && filters.usage_levels.includes('low'));

      return matchesSearch && matchesCourseType && matchesPlanType && matchesUsageLevel;
    });
  };

  const filteredStudents = getFilteredStudents();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-hanami-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* 導航欄 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
                onClick={() => window.location.href = '/admin/student-progress'}
              >
                <HomeIcon className="w-4 h-4" />
                進度儀表板
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
                onClick={() => window.location.href = '/admin/student-progress/growth-trees'}
              >
                <TreePine className="w-4 h-4" />
                成長樹管理
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
                onClick={() => window.location.href = '/admin/student-progress/abilities'}
              >
                <AcademicCapIcon className="w-4 h-4" />
                發展能力圖卡
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
                onClick={() => window.location.href = '/admin/student-progress/activities'}
              >
                <FileText className="w-4 h-4" />
                教學活動管理
              </button>
              
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2] bg-[#FFF9F2] text-[#2B3A3B]"
                onClick={() => window.location.href = '/admin/student-progress/student-media'}
              >
                <Video className="w-4 h-4" />
                學生媒體管理
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
                onClick={() => window.location.href = '/admin/students'}
              >
                <Users className="w-4 h-4" />
                返回學生管理
              </button>
            </div>
          </div>

          {/* 標題和操作按鈕 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">學生媒體管理</h1>
              <p className="text-gray-600 mt-1">管理每位學生的影片和相片媒體檔案</p>
            </div>
            <div className="flex gap-3 items-center">
              <HanamiButton 
                variant="primary" 
                onClick={() => setShowUploadModal(true)}
              >
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                批量上傳
              </HanamiButton>
            </div>
          </div>

          {/* 搜尋和篩選 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <HanamiInput
                  placeholder="搜尋學生姓名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <HanamiButton
                variant="secondary"
                onClick={() => handlePopupOpen('course_types')}
                className="flex items-center gap-2"
              >
                <FunnelIcon className="h-4 w-4" />
                課程類型
                {filters.course_types.length > 0 && (
                  <span className="bg-hanami-primary text-white rounded-full px-2 py-1 text-xs">
                    {filters.course_types.length}
                  </span>
                )}
              </HanamiButton>
              
              <HanamiButton
                variant="secondary"
                onClick={() => handlePopupOpen('plan_types')}
                className="flex items-center gap-2"
              >
                <FunnelIcon className="h-4 w-4" />
                方案類型
                {filters.plan_types.length > 0 && (
                  <span className="bg-hanami-primary text-white rounded-full px-2 py-1 text-xs">
                    {filters.plan_types.length}
                  </span>
                )}
              </HanamiButton>
              
              <HanamiButton
                variant="secondary"
                onClick={() => handlePopupOpen('usage_levels')}
                className="flex items-center gap-2"
              >
                <FunnelIcon className="h-4 w-4" />
                使用率
                {filters.usage_levels.length > 0 && (
                  <span className="bg-hanami-primary text-white rounded-full px-2 py-1 text-xs">
                    {filters.usage_levels.length}
                  </span>
                )}
              </HanamiButton>
              
              <HanamiButton
                variant="soft"
                onClick={clearFilters}
              >
                清除篩選
              </HanamiButton>
            </div>
          </div>

          {/* 統計資訊 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">統計資訊</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div>
                <span className="text-gray-600">總學生數:</span>
                <span className="ml-2 font-medium">{students.length}</span>
              </div>
              <div>
                <span className="text-gray-600">250MB:</span>
                <span className="ml-2 font-medium">
                  {students.filter(s => s.quota.plan_type === 'free').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">250MB(新建):</span>
                <span className="ml-2 font-medium">
                  {students.filter(s => (s.quota as any).plan_type === 'free:create').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">1.5GB:</span>
                <span className="ml-2 font-medium">
                  {students.filter(s => s.quota.plan_type === 'basic').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">5GB:</span>
                <span className="ml-2 font-medium">
                  {students.filter(s => s.quota.plan_type === 'premium').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">10GB:</span>
                <span className="ml-2 font-medium">
                  {students.filter(s => s.quota.plan_type === 'professional').length}
                </span>
              </div>
            </div>
          </div>

          {/* 學生列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStudents.map((student) => {
              const usageLevel = getUsageLevel(student.quota);
              const usageColor = getUsageColor(usageLevel);
              
              return (
                <HanamiCard 
                  key={student.id} 
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleStudentClick(student)}
                >
                  {/* 學生基本資訊 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-hanami-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {student.full_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                      {student.nick_name && (
                        <p className="text-sm text-gray-600">({student.nick_name})</p>
                      )}
                      {student.course_type && (
                        <p className="text-xs text-gray-500">{student.course_type}</p>
                      )}
                    </div>
                  </div>

                  {/* 配額狀態 */}
                  <div className="space-y-3 mb-4">
                    {/* 容量使用圓形圖表 */}
                    <div className="flex items-center justify-center mb-3">
                      <div className="relative w-16 h-16">
                        {/* 背景圓圈 */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-200"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {/* 進度圓圈 */}
                          <path
                            className={`transition-all duration-1000 ease-out ${
                              getCapacityUsagePercentage(student) >= 80 
                                ? 'text-red-400' 
                                : getCapacityUsagePercentage(student) >= 50
                                ? 'text-yellow-400'
                                : 'text-green-400'
                            }`}
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={`${getCapacityUsagePercentage(student)}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        {/* 中心文字 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xs font-bold text-gray-700">
                              {Math.round(getCapacityUsagePercentage(student))}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 容量資訊 */}
                    <div className="text-center space-y-1 mb-3">
                      <div className="text-sm font-bold text-gray-900">
                        {formatFileSize(getStudentTotalUsedSize(student))} / {formatFileSize(getStudentPlanSize(student))}
                      </div>
                      <div className="text-xs text-gray-600">
                        容量使用
                      </div>
                    </div>

                    {/* 媒體數量統計 */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* 影片數量 */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Video className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">影片</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {student.media_count.video}
                        </div>
                        <div className="text-xs text-gray-600">個</div>
                      </div>

                      {/* 相片數量 */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <PhotoIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">相片</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {student.media_count.photo}
                        </div>
                        <div className="text-xs text-gray-600">張</div>
                      </div>
                    </div>
                  </div>

                  {/* 使用量警告 */}
                  {getCapacityUsagePercentage(student) >= 80 && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg mb-4">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">容量即將用完</span>
                    </div>
                  )}

                  {/* 方案標籤 */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.quota.plan_type === 'free' ? 'bg-green-100 text-green-800' :
                      (student.quota as any).plan_type === 'free:create' ? 'bg-green-100 text-green-800' :
                      student.quota.plan_type === 'basic' ? 'bg-blue-100 text-blue-800' :
                      student.quota.plan_type === 'premium' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {student.quota.plan_type === 'free' ? '250MB' : 
                       (student.quota as any).plan_type === 'free:create' ? '250MB (新建)' :
                       student.quota.plan_type === 'basic' ? '1.5GB' : 
                       student.quota.plan_type === 'premium' ? '5GB' : '10GB'}
                    </span>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getCapacityUsagePercentage(student) >= 80 ? 'bg-red-100 text-red-800' :
                      getCapacityUsagePercentage(student) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getCapacityUsagePercentage(student) >= 80 ? '高使用率' : 
                       getCapacityUsagePercentage(student) >= 50 ? '中使用率' : '低使用率'}
                    </span>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex gap-2">
                    <HanamiButton
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        handleUploadClick(student);
                      }}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      上傳
                    </HanamiButton>
                    
                    <HanamiButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        handleStudentClick(student);
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </HanamiButton>
                    
                    <HanamiButton
                      variant="soft"
                      size="sm"
                      onClick={() => {
                        handleUpgradeClick(student);
                      }}
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-1" />
                      方案
                    </HanamiButton>
                  </div>
                </HanamiCard>
              );
            })}
          </div>

          {/* 空狀態 */}
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到學生</h3>
              <p className="text-gray-600">請嘗試調整搜尋條件或篩選器</p>
            </div>
          )}

          {/* 篩選彈出視窗 */}
          {showPopup.open && (
            <PopupSelect
              title={`選擇${showPopup.field === 'course_types' ? '課程類型' : 
                             showPopup.field === 'plan_types' ? '方案類型' : '使用率'}`}
              options={
                showPopup.field === 'course_types' ? 
                  courseTypes.map(courseType => ({
                    value: courseType.name,
                    label: courseType.name
                  })) :
                showPopup.field === 'plan_types' ? [
                  { value: 'free', label: '250MB' },
                  { value: 'free:create', label: '250MB (新建)' },
                  { value: 'basic', label: '1.5GB' },
                  { value: 'premium', label: '5GB' },
                  { value: 'professional', label: '10GB' },
                ] :
                [
                  { value: 'low', label: '低使用率 (<50%)' },
                  { value: 'medium', label: '中使用率 (50-80%)' },
                  { value: 'high', label: '高使用率 (≥80%)' },
                ]
              }
              selected={popupSelected}
              onChange={setPopupSelected}
              onConfirm={handlePopupConfirm}
              onCancel={handlePopupCancel}
              mode="multi"
            />
          )}

          {/* 學生媒體管理模態視窗 */}
          <StudentMediaModal
            isOpen={showMediaModal}
            onClose={() => setShowMediaModal(false)}
            student={selectedStudent}
          />

          {/* 方案升級模態視窗 */}
          <PlanUpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            student={selectedStudent}
            onUpgradeSuccess={handleUpgradeSuccess}
          />
        </div>
      </div>
    </div>
  );
} 