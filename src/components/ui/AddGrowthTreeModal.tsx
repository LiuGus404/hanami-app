import React, { useState, useEffect, useRef } from 'react';

import HanamiButton from './HanamiButton';
import { PopupSelect } from './PopupSelect';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface GoalInput {
  goal_name: string;
  goal_description: string;
  goal_icon: string;
  progress_max: number;
  required_abilities: string[];
  related_activities: string[];
  progress_contents: string[];
}

interface AddGrowthTreeModalProps {
  onClose: () => void;
  onSubmit: (treeData: any, goals: GoalInput[]) => void;
  abilitiesOptions: { value: string; label: string }[];
  activitiesOptions: { value: string; label: string }[];
  teachersOptions: { value: string; label: string }[];
  courseTypesOptions: { value: string; label: string }[];
  editingTree?: any;
}

export default function AddGrowthTreeModal(props: AddGrowthTreeModalProps) {
  const [treeName, setTreeName] = useState(props.editingTree?.tree_name || '');
  const [treeDescription, setTreeDescription] = useState(props.editingTree?.tree_description || '');
  const [treeColor, setTreeColor] = useState(props.editingTree?.tree_color || '#FFD59A');
  const [treeIcon, setTreeIcon] = useState(props.editingTree?.tree_icon || '🌳');
  const [treeLevel, setTreeLevel] = useState(props.editingTree?.tree_level || 1);
  const [courseType, setCourseType] = useState(props.editingTree?.course_type || '');
  const [reviewTeachers, setReviewTeachers] = useState<string[]>(props.editingTree?.review_teachers || []);
  const [notes, setNotes] = useState(props.editingTree?.notes || '');
  
  // 課程類型選擇器狀態
  const [showCourseTypeSelect, setShowCourseTypeSelect] = useState(false);
  const [tempSelectedCourseType, setTempSelectedCourseType] = useState<string>('');
  
  // 課程類型選擇器處理函數
  const handleCourseTypeSelect = () => {
    setTempSelectedCourseType(courseType);
    setShowCourseTypeSelect(true);
  };
  
  const handleCourseTypeConfirm = () => {
    setCourseType(tempSelectedCourseType);
    setShowCourseTypeSelect(false);
  };
  
  const handleCourseTypeCancel = () => {
    setTempSelectedCourseType(courseType);
    setShowCourseTypeSelect(false);
  };
  
  // 其他狀態保持不變...
  const [goals, setGoals] = useState<GoalInput[]>(() => {
    if (props.editingTree?.goals) {
      // 編輯模式：載入現有目標，確保進度內容正確
      return props.editingTree.goals.map((goal: any) => ({
        ...goal,
        progress_max: Number(goal.progress_max) || 5,
        required_abilities: Array.isArray(goal.required_abilities) ? goal.required_abilities : [],
        related_activities: Array.isArray(goal.related_activities) ? goal.related_activities : [],
        progress_contents: Array.isArray(goal.progress_contents) 
          ? goal.progress_contents.filter((content: string) => content && content.trim() !== '')
          : [],
      }));
    }
    // 新增模式：使用預設值
    return [{
      goal_name: '',
      goal_description: '',
      goal_icon: '⭐',
      progress_max: 5,
      required_abilities: [],
      related_activities: [],
      progress_contents: [],
    }];
  });
  const [loading, setLoading] = useState(false);
  const [showTeachersDropdown, setShowTeachersDropdown] = useState(false);

  // 1. 新增狀態
  const [showActivitySelector, setShowActivitySelector] = useState<{open: boolean, goalIdx: number | null}>({ open: false, goalIdx: null });
  const [activitySearchText, setActivitySearchText] = useState('');
  const [activityTempSelected, setActivityTempSelected] = useState<string[]>([]);

  // 2. 新增能力選擇器狀態
  const [showAbilitySelector, setShowAbilitySelector] = useState<{open: boolean, goalIdx: number | null}>({ open: false, goalIdx: null });
  const [abilitySearchText, setAbilitySearchText] = useState('');
  const [abilityTempSelected, setAbilityTempSelected] = useState<string[]>([]);

  // 監控每個目標的 progress_max 變化
  useEffect(() => {
    setGoals(goals => goals.map(goal => {
      if (!goal.progress_max || goal.progress_max < 1) return { ...goal, progress_contents: [] };
      const max = goal.progress_max;
      let contents = goal.progress_contents || [];
      
      // 同步進度內容數量與進度條最大值
      if (contents.length !== max) {
        if (contents.length < max) {
          // 如果內容不足，用空字串填充
          contents = [...contents, ...Array(max - contents.length).fill('')];
        } else if (contents.length > max) {
          // 如果內容過多，截取前 max 個
          contents = contents.slice(0, max);
        }
      }
      
      return { ...goal, progress_contents: contents };
    }));
  }, [goals.map(g => g.progress_max).join(',')]);

  const handleGoalChange = (idx: number, key: keyof GoalInput, value: any) => {
    setGoals(goals => goals.map((g, i) => i === idx ? { ...g, [key]: value } : g));
  };
  const handleProgressContentChange = (goalIdx: number, contentIdx: number, value: string) => {
    setGoals(goals => goals.map((g, i) => i === goalIdx ? {
      ...g,
      progress_contents: g.progress_contents.map((c, j) => j === contentIdx ? value : c),
    } : g));
  };
  const addGoal = () => setGoals(goals => [...goals, { 
    goal_name: '', 
    goal_description: '', 
    goal_icon: '⭐', 
    progress_max: 5, 
    required_abilities: [], 
    related_activities: [], 
    progress_contents: [], 
  }]);
  const removeGoal = (idx: number) => setGoals(goals => goals.filter((_, i) => i !== idx));

  const handleTeacherToggle = (teacherId: string) => {
    setReviewTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId],
    );
    // 選擇後不自動關閉，讓用戶可以繼續選擇多個
  };

  const selectedTeachers = props.teachersOptions.filter(opt => reviewTeachers.includes(opt.value));

  // 點擊外部關閉下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.teachers-dropdown-container')) {
        setShowTeachersDropdown(false);
      }
    };

    if (showTeachersDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTeachersDropdown]);

  // 2. 彈窗選擇器
  const openActivitySelector = (goalIdx: number) => {
    setActivityTempSelected(goals[goalIdx].related_activities || []);
    setActivitySearchText('');
    setShowActivitySelector({ open: true, goalIdx });
  };
  const closeActivitySelector = () => setShowActivitySelector({ open: false, goalIdx: null });
  const handleActivityToggle = (id: string) => {
    setActivityTempSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleActivityConfirm = () => {
    if (showActivitySelector.goalIdx !== null) {
      handleGoalChange(showActivitySelector.goalIdx, 'related_activities', activityTempSelected);
    }
    closeActivitySelector();
  };
  const filteredActivities = props.activitiesOptions.filter(a => a.label.includes(activitySearchText));

  // 3. 能力選擇器函數
  const openAbilitySelector = (goalIdx: number) => {
    setAbilityTempSelected(goals[goalIdx].required_abilities || []);
    setAbilitySearchText('');
    setShowAbilitySelector({ open: true, goalIdx });
  };
  const closeAbilitySelector = () => setShowAbilitySelector({ open: false, goalIdx: null });
  const handleAbilityToggle = (id: string) => {
    setAbilityTempSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleAbilityConfirm = () => {
    if (showAbilitySelector.goalIdx !== null) {
      handleGoalChange(showAbilitySelector.goalIdx, 'required_abilities', abilityTempSelected);
    }
    closeAbilitySelector();
  };
  const filteredAbilities = props.abilitiesOptions.filter(a => a.label.includes(abilitySearchText));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fixedGoals = goals.map(g => {
        // 過濾掉空的進度內容
        const filteredProgressContents = Array.isArray(g.progress_contents) 
          ? g.progress_contents.filter((content: string) => content && content.trim() !== '')
          : [];
        
        return {
          ...g,
          progress_max: Number(g.progress_max) || 5,
          progress_contents: filteredProgressContents,
          related_activities: Array.isArray(g.related_activities) ? g.related_activities : [],
          required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : [],
        };
      });
      
      console.log('修正後的目標資料:', fixedGoals);
      
      await props.onSubmit({
        tree_name: treeName,
        tree_description: treeDescription,
        tree_color: treeColor,
        tree_icon: treeIcon,
        review_teachers: reviewTeachers,
        notes,
        tree_level: treeLevel,
        course_type: courseType,
      }, fixedGoals);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* 標題欄 */}
        <div className="bg-[#FFF9F2] px-6 py-4 border-b border-[#EADBC8]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2B3A3B]">{props.editingTree ? '編輯成長樹' : '新增成長樹'}</h2>
            <button
              className="text-[#A68A64] hover:text-[#8B7355] transition-colors"
              onClick={props.onClose}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </button>
          </div>
        </div>
        {/* 表單內容 - 可滾動 */}
        <div className="flex-1 overflow-y-auto">
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            {/* 成長樹名稱 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">成長樹名稱</label>
              <input
                required
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                placeholder="請輸入成長樹名稱..."
                type="text"
                value={treeName}
                onChange={e => setTreeName(e.target.value)}
              />
            </div>

            {/* 成長樹描述 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">成長樹描述</label>
              <textarea
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A] resize-none"
                placeholder="請描述成長樹的內容和目標..."
                rows={3}
                value={treeDescription}
                onChange={e => setTreeDescription(e.target.value)}
              />
            </div>

            {/* 基本設定 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">課程類型</label>
                <button
                  type="button"
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white hover:bg-[#FFF9F2] transition-colors text-left flex items-center justify-between"
                  onClick={handleCourseTypeSelect}
                >
                  <span>
                    {courseType 
                      ? props.courseTypesOptions.find(opt => opt.value === courseType)?.label || '請選擇課程類型'
                      : '請選擇課程類型'
                    }
                  </span>
                  <FunnelIcon className="h-4 w-4 text-[#A68A64]" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">等級</label>
                <input
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  max={10}
                  min={1}
                  placeholder="1-10"
                  type="number"
                  value={treeLevel}
                  onChange={e => setTreeLevel(Number(e.target.value))}
                />
              </div>
            </div>

            {/* 外觀設定 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">主題色彩</label>
                <input
                  className="w-full h-12 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="color"
                  value={treeColor}
                  onChange={e => setTreeColor(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B] mb-2">圖案</label>
                <input
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A] text-center text-2xl"
                  maxLength={2}
                  placeholder="🌳"
                  type="text"
                  value={treeIcon}
                  onChange={e => setTreeIcon(e.target.value)}
                />
              </div>
            </div>

            {/* 目標列表 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">目標列表</label>
              {goals.map((goal, idx) => (
                <div key={idx} className="border border-[#EADBC8] rounded-lg p-4 mb-4 bg-[#FFFDF8] relative">
                  <button
                    className="absolute top-2 right-2 text-[#A64B2A] hover:text-[#8B3A1F] transition-colors"
                    type="button"
                    onClick={() => removeGoal(idx)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    </svg>
                  </button>
                  
                  <div className="space-y-4">
                    {/* 目標名稱和圖案 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-[#2B3A3B] mb-2">目標名稱</label>
                        <input
                          required
                          className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                          placeholder="請輸入目標名稱..."
                          type="text"
                          value={goal.goal_name}
                          onChange={e => handleGoalChange(idx, 'goal_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2B3A3B] mb-2">圖案</label>
                        <input
                          className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A] text-center text-2xl"
                          maxLength={2}
                          placeholder="⭐"
                          type="text"
                          value={goal.goal_icon}
                          onChange={e => handleGoalChange(idx, 'goal_icon', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* 目標描述 */}
                    <div>
                      <label className="block text-sm font-medium text-[#2B3A3B] mb-2">目標描述</label>
                      <textarea
                        className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A] resize-none"
                        placeholder="請描述此目標的內容..."
                        rows={2}
                        value={goal.goal_description}
                        onChange={e => handleGoalChange(idx, 'goal_description', e.target.value)}
                      />
                    </div>

                    {/* 進度條最大值 */}
                    <div>
                      <label className="block text-sm font-medium text-[#2B3A3B] mb-2">進度條最大值</label>
                      <input
                        className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                        max={100}
                        min={1}
                        placeholder="1-100"
                        type="number"
                        value={goal.progress_max}
                        onChange={e => handleGoalChange(idx, 'progress_max', Number(e.target.value))}
                      />
                    </div>

                    {/* 進度內容 */}
                    <div>
                      <label className="block text-sm font-medium text-[#2B3A3B] mb-2">
                        進度內容 (共 {goal.progress_max} 步)
                      </label>
                      {goal.progress_contents.map((content, cidx) => (
                        <div key={cidx} className="flex gap-2 items-center mb-2">
                          <input
                            className="flex-1 px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                            placeholder={`第${cidx + 1}步內容`}
                            type="text"
                            value={content}
                            onChange={e => handleProgressContentChange(idx, cidx, e.target.value)}
                          />
                        </div>
                      ))}
                      <p className="text-xs text-[#A68A64] mt-2">
                        提示：修改上方的「進度條最大值」會自動調整進度內容的數量
                      </p>
                    </div>

                    {/* 發展能力和活動 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2B3A3B] mb-2">所需發展能力</label>
                        <button
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white"
                          type="button"
                          onClick={() => openAbilitySelector(idx)}
                        >
                          {goal.required_abilities && goal.required_abilities.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {goal.required_abilities.map((id, index) => {
                                const ability = props.abilitiesOptions.find(a => a.value === id);
                                return ability ? (
                                  <span key={`ability-${idx}-${index}-${id}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30">
                                    {ability.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            '請選擇所需發展能力'
                          )}
                        </button>
                      </div>
                      {/* 相關活動選擇 */}
                      <div>
                        <label className="block text-sm font-medium text-[#2B3A3B] mb-2">相關活動</label>
                        <button
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white"
                          type="button"
                          onClick={() => openActivitySelector(idx)}
                        >
                          {goal.related_activities && goal.related_activities.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {goal.related_activities.map((id, index) => {
                                const activity = props.activitiesOptions.find(a => a.value === id);
                                return activity ? (
                                  <span key={`activity-${idx}-${index}-${id}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30">
                                    {activity.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            '請選擇相關活動'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                className="w-full px-4 py-3 text-[#A64B2A] border border-[#EADBC8] rounded-lg hover:bg-[#FFF9F2] transition-colors"
                type="button"
                onClick={addGoal}
              >
                + 新增目標
              </button>
            </div>

            {/* 備註 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">備註</label>
              <textarea
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A] resize-none"
                placeholder="補充說明..."
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* 負責檢視老師 */}
            <div className="teachers-dropdown-container">
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">負責檢視老師</label>
              <div className="relative">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowTeachersDropdown(!showTeachersDropdown)}
                >
                  {selectedTeachers.length > 0 ? (
                    <div>
                      <div className="font-medium text-[#2B3A3B]">
                        已選擇 {selectedTeachers.length} 位老師
                      </div>
                      <div className="text-sm text-[#A68A64]">
                        {selectedTeachers.map(t => t.label).join(', ')}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#A68A64]">請選擇負責檢視的老師</span>
                  )}
                </button>
                {showTeachersDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="max-h-48 overflow-y-auto">
                      {props.teachersOptions.map((teacher) => (
                        <button
                          key={teacher.value}
                          className={`w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0 ${
                            reviewTeachers.includes(teacher.value) ? 'bg-[#FFF9F2]' : ''
                          }`}
                          type="button"
                          onClick={() => handleTeacherToggle(teacher.value)}
                        >
                          <div className="font-medium text-[#2B3A3B]">{teacher.label}</div>
                          {reviewTeachers.includes(teacher.value) && (
                            <div className="text-sm text-[#A64B2A]">✓ 已選擇</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 按鈕區域 */}
            <div className="flex gap-3 pt-4">
              <button
                className="flex-1 px-4 py-3 text-[#A68A64] border border-[#EADBC8] rounded-lg hover:bg-[#FFF9F2] transition-colors"
                type="button"
                onClick={props.onClose}
              >
                取消
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !treeName}
                type="submit"
              >
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 活動多選彈窗 */}
      {showActivitySelector.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-lg">選擇相關活動</span>
              <button className="text-gray-400 hover:text-gray-600" onClick={closeActivitySelector}>✕</button>
            </div>
            <div className="p-4 flex flex-col gap-4 overflow-y-auto">
              <input
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                placeholder="搜尋活動..."
                type="text"
                value={activitySearchText}
                onChange={e => setActivitySearchText(e.target.value)}
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredActivities.length === 0 && <div className="text-gray-400 text-center py-4">查無活動</div>}
                {filteredActivities.map(act => (
                  <button
                    key={act.value}
                    className={`w-full p-3 border rounded-lg text-left transition-colors ${
                      activityTempSelected.includes(act.value)
                        ? 'border-hanami-primary bg-hanami-primary/10 text-hanami-text'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    type="button"
                    onClick={() => handleActivityToggle(act.value)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{act.label}</span>
                      {activityTempSelected.includes(act.value) && (
                        <span className="text-hanami-primary">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <HanamiButton variant="secondary" onClick={closeActivitySelector}>取消</HanamiButton>
              <HanamiButton className="bg-hanami-primary hover:bg-hanami-accent" onClick={handleActivityConfirm}>確認</HanamiButton>
            </div>
          </div>
        </div>
      )}

      {/* 能力多選彈窗 */}
      {showAbilitySelector.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-lg">選擇所需發展能力</span>
              <button className="text-gray-400 hover:text-gray-600" onClick={closeAbilitySelector}>✕</button>
            </div>
            <div className="p-4 flex flex-col gap-4 overflow-y-auto">
              <input
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                placeholder="搜尋發展能力..."
                type="text"
                value={abilitySearchText}
                onChange={e => setAbilitySearchText(e.target.value)}
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredAbilities.length === 0 && <div className="text-gray-400 text-center py-4">查無發展能力</div>}
                {filteredAbilities.map(ability => (
                  <button
                    key={ability.value}
                    className={`w-full p-3 border rounded-lg text-left transition-colors ${
                      abilityTempSelected.includes(ability.value)
                        ? 'border-hanami-primary bg-hanami-primary/10 text-hanami-text'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    type="button"
                    onClick={() => handleAbilityToggle(ability.value)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{ability.label}</span>
                      {abilityTempSelected.includes(ability.value) && (
                        <span className="text-hanami-primary">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <HanamiButton variant="secondary" onClick={closeAbilitySelector}>取消</HanamiButton>
              <HanamiButton className="bg-hanami-primary hover:bg-hanami-accent" onClick={handleAbilityConfirm}>確認</HanamiButton>
            </div>
          </div>
        </div>
      )}

      {/* 課程類型選擇彈窗 */}
      {showCourseTypeSelect && (
        <PopupSelect
          mode="single"
          options={props.courseTypesOptions}
          selected={tempSelectedCourseType}
          title="選擇課程類型"
          onCancel={handleCourseTypeCancel}
          onChange={(value) => setTempSelectedCourseType(Array.isArray(value) ? value[0] || '' : value)}
          onConfirm={handleCourseTypeConfirm}
        />
      )}
    </div>
  );
} 