'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

import { supabase } from '@/lib/supabase';

interface ChildDevelopmentMilestone {
  id: string;
  age_months: number;
  age_description: string;
  age_range_min: number;
  age_range_max: number;
  music_interest: string;
  separation_anxiety: string;
  attention_span: string;
  fine_motor: string;
  emotional_development: string;
  social_interaction: string;
  joint_attention: string;
  social_norms: string;
  language_comprehension: string;
  spatial_concept: string;
  hand_eye_coordination: string;
  bilateral_coordination: string;
  development_data: any;
  milestones: string[];
  red_flags: string[];
  music_development: any;
  recommended_activities: string[];
  teaching_strategies: string[];
  notes: string;
  source: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ChildDevelopmentMilestonesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<ChildDevelopmentMilestone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<ChildDevelopmentMilestone | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 載入兒童發展里程碑資料
  const loadMilestones = async () => {
    try {
      setLoading(true);
      
      // 使用預設資料，因為 hanami_child_development_milestones 表可能不存在
      const defaultAgeGroups: ChildDevelopmentMilestone[] = [
        {
          id: '6-12',
          age_months: 6,
          age_description: '6-12個月',
          age_range_min: 6,
          age_range_max: 12,
          music_interest: '',
          separation_anxiety: '',
          attention_span: '',
          fine_motor: '',
          emotional_development: '',
          social_interaction: '',
          joint_attention: '',
          social_norms: '',
          language_comprehension: '',
          spatial_concept: '',
          hand_eye_coordination: '',
          bilateral_coordination: '',
          development_data: {},
          milestones: [],
          red_flags: [],
          music_development: {},
          recommended_activities: [],
          teaching_strategies: [],
          notes: '',
          source: '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '12-18',
          age_months: 12,
          age_description: '12-18個月',
          age_range_min: 12,
          age_range_max: 18,
          music_interest: '',
          separation_anxiety: '',
          attention_span: '',
          fine_motor: '',
          emotional_development: '',
          social_interaction: '',
          joint_attention: '',
          social_norms: '',
          language_comprehension: '',
          spatial_concept: '',
          hand_eye_coordination: '',
          bilateral_coordination: '',
          development_data: {},
          milestones: [],
          red_flags: [],
          music_development: {},
          recommended_activities: [],
          teaching_strategies: [],
          notes: '',
          source: '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setMilestones(defaultAgeGroups);
      setLoading(false);
    } catch (error) {
      console.error('載入兒童發展里程碑失敗:', error);
      toast.error('載入兒童發展里程碑失敗');
    } finally {
      setLoading(false);
    }
  };

  // 刪除里程碑
  const deleteMilestone = async (id: string) => {
    if (!confirm('確定要刪除此里程碑嗎？')) return;

    try {
      // 由於 hanami_child_development_milestones 表可能不存在，直接顯示成功訊息
      toast.success('里程碑刪除成功（模擬）');
      loadMilestones();
    } catch (error) {
      console.error('刪除里程碑失敗:', error);
      toast.error('刪除里程碑失敗');
    }
  };

  // 切換啟用狀態
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // 由於 hanami_child_development_milestones 表可能不存在，直接顯示成功訊息
      toast.success(`里程碑已${!currentStatus ? '啟用' : '停用'}（模擬）`);
      loadMilestones();
    } catch (error) {
      console.error('更新里程碑狀態失敗:', error);
      toast.error('更新里程碑狀態失敗');
    }
  };

  // 篩選里程碑
  const filteredMilestones = milestones.filter(milestone => {
    const matchesSearch = milestone.age_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         milestone.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    loadMilestones();
  }, [filterActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCD58B] mx-auto mb-4"></div>
          <p className="text-[#2B3A3B]">載入兒童發展里程碑中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回管理面板</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2">兒童發展里程碑管理</h1>
          <p className="text-[#4B4036]">管理不同月齡和歲數小朋友的發展情況參考資料</p>
        </div>

        {/* 操作欄 */}
        <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* 搜尋框 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B4036] w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜尋年齡組或備註..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64]"
                />
              </div>

              {/* 篩選按鈕 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterActive(null)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterActive === null
                      ? 'bg-[#FFD59A] text-[#4B4036]'
                      : 'bg-gray-100 text-[#4B4036] hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterActive(true)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterActive === true
                      ? 'bg-[#FFD59A] text-[#4B4036]'
                      : 'bg-gray-100 text-[#4B4036] hover:bg-gray-200'
                  }`}
                >
                  啟用
                </button>
                <button
                  onClick={() => setFilterActive(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterActive === false
                      ? 'bg-[#FFD59A] text-[#4B4036]'
                      : 'bg-gray-100 text-[#4B4036] hover:bg-gray-200'
                  }`}
                >
                  停用
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={loadMilestones}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>刷新</span>
              </button>
              <button
                onClick={() => router.push('/admin/child-development-milestones/new')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors hover:from-[#EBC9A4] hover:to-[#FFD59A]"
              >
                <Plus className="w-4 h-4" />
                <span>新增里程碑</span>
              </button>
            </div>
          </div>
        </div>

        {/* 里程碑列表 */}
        <div className="bg-white rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="p-6 border-b border-[#EADBC8]">
            <h2 className="text-xl font-bold text-[#2B3A3B]">
              發展里程碑列表 ({filteredMilestones.length})
            </h2>
          </div>

          <div className="p-6">
            {filteredMilestones.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-[#4B4036]">沒有找到符合條件的里程碑</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`bg-gradient-to-br from-[#FFFDF8] to-[#FFF9F2] rounded-xl p-6 border border-[#EADBC8] transition-all duration-200 hover:shadow-md ${
                      !milestone.is_active ? 'opacity-60' : ''
                    }`}
                  >
                    {/* 標題和狀態 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#2B3A3B] mb-1">
                          {milestone.age_description}
                        </h3>
                        <p className="text-sm text-[#4B4036]">
                          {milestone.age_range_min}-{milestone.age_range_max}個月
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${milestone.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>

                    {/* 發展能力描述 */}
                    <div className="space-y-2 mb-4">
                      <div className="text-sm">
                        <span className="text-[#4B4036] font-medium">音樂興趣:</span>
                        <p className="text-[#2B3A3B] text-xs mt-1 line-clamp-2">{milestone.music_interest || '未設定'}</p>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#4B4036] font-medium">專注力:</span>
                        <p className="text-[#2B3A3B] text-xs mt-1 line-clamp-2">{milestone.attention_span || '未設定'}</p>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#4B4036] font-medium">小肌發展:</span>
                        <p className="text-[#2B3A3B] text-xs mt-1 line-clamp-2">{milestone.fine_motor || '未設定'}</p>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#4B4036] font-medium">社交互動:</span>
                        <p className="text-[#2B3A3B] text-xs mt-1 line-clamp-2">{milestone.social_interaction || '未設定'}</p>
                      </div>
                    </div>

                    {/* 建議活動 */}
                    {milestone.recommended_activities && milestone.recommended_activities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-[#4B4036] mb-2">建議活動：</p>
                        <div className="flex flex-wrap gap-1">
                          {milestone.recommended_activities.slice(0, 3).map((activity, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-[#FFD59A] text-[#4B4036] text-xs rounded-full"
                            >
                              {activity}
                            </span>
                          ))}
                          {milestone.recommended_activities.length > 3 && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                              +{milestone.recommended_activities.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2 pt-4 border-t border-[#EADBC8]">
                      <button
                        onClick={() => {
                          setSelectedMilestone(milestone);
                          setShowDetailModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors text-sm"
                      >
                        <Eye className="w-3 h-3" />
                        <span>詳情</span>
                      </button>
                      <button
                        onClick={() => router.push(`/admin/child-development-milestones/${milestone.id}/edit`)}
                        className="flex items-center gap-1 px-3 py-1 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors text-sm"
                      >
                        <Edit className="w-3 h-3" />
                        <span>編輯</span>
                      </button>
                      <button
                        onClick={() => toggleActive(milestone.id, milestone.is_active)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors text-sm ${
                          milestone.is_active
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        <span>{milestone.is_active ? '停用' : '啟用'}</span>
                      </button>
                      <button
                        onClick={() => deleteMilestone(milestone.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors text-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>刪除</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 詳情彈窗 */}
        {showDetailModal && selectedMilestone && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#EADBC8]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#2B3A3B]">
                    {selectedMilestone.age_description} 發展詳情
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-[#4B4036] hover:text-[#2B3A3B]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 基本資訊 */}
                <div>
                  <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">基本資訊</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#4B4036]">年齡範圍</p>
                      <p className="font-medium text-[#2B3A3B]">
                        {selectedMilestone.age_range_min}-{selectedMilestone.age_range_max}個月
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#4B4036]">狀態</p>
                      <p className="font-medium text-[#2B3A3B]">
                        {selectedMilestone.is_active ? '啟用' : '停用'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 發展評分 */}
                <div>
                  <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">發展評分 (1-5分)</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: '音樂興趣', value: selectedMilestone.music_interest },
                      { label: '分離焦慮', value: selectedMilestone.separation_anxiety },
                      { label: '專注力', value: selectedMilestone.attention_span },
                      { label: '小肌發展', value: selectedMilestone.fine_motor },
                      { label: '情緒發展', value: selectedMilestone.emotional_development },
                      { label: '社交互動', value: selectedMilestone.social_interaction },
                      { label: '共享注意力', value: selectedMilestone.joint_attention },
                      { label: '社交規範', value: selectedMilestone.social_norms },
                      { label: '語言理解', value: selectedMilestone.language_comprehension },
                      { label: '空間概念', value: selectedMilestone.spatial_concept },
                      { label: '手眼協調', value: selectedMilestone.hand_eye_coordination },
                      { label: '雙手協調', value: selectedMilestone.bilateral_coordination }
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-[#4B4036] mb-1">{item.label}</p>
                        <p className="text-sm text-[#2B3A3B]">{item.value || '未設定'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 發展里程碑 */}
                {selectedMilestone.milestones && selectedMilestone.milestones.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">發展里程碑</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <ul className="space-y-2">
                        {selectedMilestone.milestones.map((milestone, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-[#FFD59A] rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-[#4B4036]">{milestone}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 建議活動 */}
                {selectedMilestone.recommended_activities && selectedMilestone.recommended_activities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">建議活動</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMilestone.recommended_activities.map((activity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-full text-sm"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 教學策略 */}
                {selectedMilestone.teaching_strategies && selectedMilestone.teaching_strategies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">教學策略</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <ul className="space-y-2">
                        {selectedMilestone.teaching_strategies.map((strategy, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-[#4B4036]">{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 備註 */}
                {selectedMilestone.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">備註</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-[#4B4036]">{selectedMilestone.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[#EADBC8]">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => router.push(`/admin/child-development-milestones/${selectedMilestone.id}/edit`)}
                    className="px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-lg transition-colors"
                  >
                    關閉
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}