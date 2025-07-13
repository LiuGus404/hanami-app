'use client';

import { 
  ChartBarIcon, 
  UserGroupIcon, 
  StarIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, FileText, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

import HanamiButton from '@/components/ui/HanamiButton';
import HanamiCard from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import HanamiSelect from '@/components/ui/HanamiSelect';
import { supabase } from '@/lib/supabase';
import { DevelopmentAbility, StudentAbility, DEVELOPMENT_ABILITIES } from '@/types/progress';

export default function AbilitiesPage() {
  const [abilities, setAbilities] = useState<DevelopmentAbility[]>([]);
  const [studentAbilities, setStudentAbilities] = useState<StudentAbility[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 新增能力表單狀態
  const [newAbility, setNewAbility] = useState({
    ability_name: '',
    ability_description: '',
    ability_color: '#FFB6C1',
    max_level: 5,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 載入發展能力
      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('hanami_development_abilities')
        .select('*')
        .order('ability_name');

      if (abilitiesError) throw abilitiesError;
      // 修正 null 欄位為 undefined
      const fixedAbilities = (abilitiesData || []).map((a: any) => ({
        ...a,
        ability_description: a.ability_description ?? undefined,
        ability_icon: a.ability_icon ?? undefined,
        ability_color: a.ability_color ?? undefined,
      }));
      setAbilities(fixedAbilities);

      // 載入學生
      const { data: studentsData, error: studentsError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, nick_name, student_age, course_type')
        .order('full_name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // 載入學生能力記錄
      const { data: studentAbilitiesData, error: studentAbilitiesError } = await supabase
        .from('hanami_student_abilities')
        .select(`
          *,
          ability:hanami_development_abilities(*)
        `);

      if (studentAbilitiesError) throw studentAbilitiesError;
      // 修正欄位名稱與 null 欄位
      const fixedStudentAbilities = (studentAbilitiesData || []).map((a: any) => ({
        ...a,
        last_updated: a.last_assessment_date ?? a.updated_at ?? '',
        notes: a.notes ?? undefined,
      }));
      setStudentAbilities(fixedStudentAbilities);

    } catch (err) {
      console.error('載入資料失敗：', err);
      setError('載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const createAbility = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_development_abilities')
        .insert([newAbility])
        .select()
        .single();

      if (error) throw error;
      // 修正 null 欄位為 undefined
      const fixedData = {
        ...data,
        ability_description: data.ability_description ?? undefined,
        ability_icon: data.ability_icon ?? undefined,
        ability_color: data.ability_color ?? undefined,
      };
      setAbilities([...abilities, fixedData]);
      setShowCreateModal(false);
      setNewAbility({
        ability_name: '',
        ability_description: '',
        ability_color: '#FFB6C1',
        max_level: 5,
      });
    } catch (err) {
      console.error('建立能力失敗：', err);
      setError('建立能力失敗');
    }
  };

  const getStudentAbility = (studentId: string, abilityId: string) => {
    return studentAbilities.find(sa => 
      sa.student_id === studentId && sa.ability_id === abilityId,
    );
  };

  const getAbilityLevelColor = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAbilityLevelText = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return '優秀';
    if (percentage >= 60) return '良好';
    if (percentage >= 40) return '一般';
    return '需要加強';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-hanami-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-hanami-text flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-hanami-primary" />
            學生發展能力管理
          </h1>
          <p className="text-hanami-text-secondary mt-2">
            追蹤和管理學生的八大核心發展能力
          </p>
        </div>
        <div className="flex gap-3">
          <HanamiButton
            className="flex items-center gap-2"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="h-5 w-5" />
            新增能力
          </HanamiButton>
        </div>
      </div>

      {/* 學生進度管理導航按鈕區域 */}
      <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => window.location.href = '/admin/student-progress/dashboard'}
          >
            <BarChart3 className="w-4 h-4" />
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
            onClick={() => window.location.href = '/admin/student-progress/abilities'}
          >
            <TrendingUp className="w-4 h-4" />
            發展能力圖卡
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => window.location.href = '/admin/student-progress/activities'}
          >
            <Gamepad2 className="w-4 h-4" />
            教學活動管理
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => window.location.href = '/admin/student-progress'}
          >
            <FileText className="w-4 h-4" />
            進度記錄管理
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

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 學生選擇器 */}
      <HanamiCard>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-hanami-text mb-3">
            選擇學生查看能力
          </h3>
          <HanamiSelect
            options={[
              { value: '', label: '請選擇學生' },
              ...students.map(student => ({
                value: student.id,
                label: student.full_name,
              })),
            ]}
            value={selectedStudent || ''}
            onChange={e => setSelectedStudent(e.target.value)}
          />
        </div>
      </HanamiCard>

      {/* 能力概覽 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {abilities.map((ability) => (
          <HanamiCard key={ability.id} className="hover:shadow-lg transition-shadow">
            <div className="p-4 text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: ability.ability_color || '#FFB6C1' }}
              >
                <StarIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-hanami-text mb-1">
                {ability.ability_name}
              </h3>
              <p className="text-sm text-hanami-text-secondary mb-3">
                {ability.ability_description}
              </p>
              
              {/* 學生能力統計 */}
              <div className="space-y-2">
                {students.slice(0, 3).map((student) => {
                  const studentAbility = getStudentAbility(student.id, ability.id);
                  const level = studentAbility?.current_level || 0;
                  return (
                    <div key={student.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">
                        {student.nick_name || student.full_name}
                      </span>
                      <span className={`font-medium ${getAbilityLevelColor(level, ability.max_level)}`}>
                        {level}/{ability.max_level}
                      </span>
                    </div>
                  );
                })}
                {students.length > 3 && (
                  <div className="text-xs text-hanami-text-secondary">
                    +{students.length - 3} 位學生
                  </div>
                )}
              </div>
            </div>
          </HanamiCard>
        ))}
      </div>

      {/* 選中學生的詳細能力 */}
      {selectedStudent && (
        <HanamiCard>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-hanami-text mb-4 flex items-center gap-2">
              <UserGroupIcon className="h-6 w-6 text-hanami-primary" />
              {students.find(s => s.id === selectedStudent)?.full_name} 的能力評估
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {abilities.map((ability) => {
                const studentAbility = getStudentAbility(selectedStudent, ability.id);
                const level = studentAbility?.current_level || 0;
                const percentage = (level / ability.max_level) * 100;
                
                return (
                  <div key={ability.id} className="border border-hanami-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: ability.ability_color || '#FFB6C1' }}
                        >
                          <StarIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-hanami-text">
                          {ability.ability_name}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${getAbilityLevelColor(level, ability.max_level)}`}>
                        {getAbilityLevelText(level, ability.max_level)}
                      </span>
                    </div>
                    
                    {/* 進度條 */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-hanami-text-secondary mb-1">
                        <span>等級 {level}</span>
                        <span>最高 {ability.max_level}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: ability.ability_color || '#FFB6C1',
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* 評語 */}
                    {studentAbility?.notes && (
                      <p className="text-sm text-hanami-text-secondary">
                        {studentAbility.notes}
                      </p>
                    )}
                    
                    {/* 操作按鈕 */}
                    <div className="mt-3">
                      <HanamiButton
                        className="flex items-center gap-1"
                        size="sm"
                        variant="secondary"
                      >
                        <EyeIcon className="h-4 w-4" />
                        查看詳情
                      </HanamiButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </HanamiCard>
      )}

      {/* 新增能力模態框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#FFF9F2]/80 to-[#FFD59A]/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-hanami-text mb-4">
              新增發展能力
            </h2>
            
            <div className="space-y-4">
              <HanamiInput
                required
                label="能力名稱"
                placeholder="例如：小肌發展"
                value={newAbility.ability_name}
                onChange={e => setNewAbility({ ...newAbility, ability_name: e.target.value })}
              />

              <HanamiInput
                label="能力描述"
                placeholder="能力的詳細描述"
                value={newAbility.ability_description}
                onChange={e => setNewAbility({ ...newAbility, ability_description: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <HanamiInput
                  label="最高等級"
                  placeholder="1~10"
                  type="number"
                  value={newAbility.max_level.toString()}
                  onChange={e => setNewAbility({ ...newAbility, max_level: parseInt(e.target.value) || 5 })}
                />

                <div>
                  <label className="block text-sm font-medium text-hanami-text mb-2">
                    主題色彩
                  </label>
                  <input
                    className="w-full h-10 rounded-lg border border-hanami-border"
                    type="color"
                    value={newAbility.ability_color}
                    onChange={e => setNewAbility({ ...newAbility, ability_color: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <HanamiButton
                className="flex-1"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </HanamiButton>
              <HanamiButton
                className="flex-1"
                disabled={!newAbility.ability_name}
                variant="primary"
                onClick={createAbility}
              >
                建立
              </HanamiButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 