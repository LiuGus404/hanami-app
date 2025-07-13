'use client';

import { 
  ClockIcon, 
  StarIcon, 
  TagIcon, 
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

import { HanamiCard, HanamiButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface ActivityDetailModalProps {
  activity: any;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function ActivityDetailModal({ 
  activity, 
  onClose, 
  onEdit, 
  onDuplicate, 
  onDelete, 
}: ActivityDetailModalProps) {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activity?.template_id) {
      loadTemplate();
    } else {
      setLoading(false);
    }
  }, [activity]);

  const loadTemplate = async () => {
    try {
      // 如果沒有 template_id，直接設置為 null
      if (!activity?.template_id) {
        setTemplate(null);
        setLoading(false);
        return;
      }

      // 查詢 hanami_resource_templates 表
      const { data, error } = await supabase
        .from('hanami_resource_templates')
        .select('*')
        .eq('id', activity.template_id)
        .single();

      if (error) {
        console.log('範本載入失敗:', error);
        setTemplate(null);
      } else {
        setTemplate(data);
      }
    } catch (error) {
      console.error('載入範本失敗:', error);
      setTemplate(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return '已發布';
      case 'archived':
        return '已封存';
      default:
        return '草稿';
    }
  };

  const getActivityTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'game': '遊戲活動',
      'training': '訓練活動',
      'exercise': '練習活動',
      'storybook': '繪本活動',
      'performance': '表演活動',
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanami-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-hanami-text">
                  {activity.activity_name}
                </h2>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(activity.status)}`}>
                  {getStatusText(activity.status)}
                </span>
              </div>
              <p className="text-hanami-text-secondary">
                {getActivityTypeText(activity.activity_type)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                className="p-2 rounded-full bg-hanami-secondary hover:bg-hanami-accent transition-colors"
                title="編輯"
                onClick={onEdit}
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
                title="複製"
                onClick={onDuplicate}
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
                title="刪除"
                onClick={onDelete}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                title="關閉"
                onClick={onClose}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本資訊 */}
          <HanamiCard className="p-6">
            <h3 className="text-lg font-semibold text-hanami-text mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              基本資訊
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">時長：</span>
                <span className="font-medium">{activity.estimated_duration} 分鐘</span>
              </div>
              
              <div className="flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">難度：</span>
                <span className="font-medium">等級 {activity.difficulty_level}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">類型：</span>
                <span className="font-medium">{getActivityTypeText(activity.activity_type)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">創建時間：</span>
                <span className="font-medium">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </HanamiCard>

          {/* 活動描述 */}
          {activity.activity_description && (
            <HanamiCard className="p-6">
              <h3 className="text-lg font-semibold text-hanami-text mb-4">活動描述</h3>
              <p className="text-hanami-text-secondary leading-relaxed">
                {activity.activity_description}
              </p>
            </HanamiCard>
          )}

          {/* 分類和標籤 */}
          {(activity.category || activity.tags?.length > 0) && (
            <HanamiCard className="p-6">
              <h3 className="text-lg font-semibold text-hanami-text mb-4 flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                分類與標籤
              </h3>
              
              <div className="space-y-3">
                {activity.category && (
                  <div>
                    <span className="text-sm text-gray-600">分類：</span>
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm ml-2">
                      {activity.category}
                    </span>
                  </div>
                )}
                
                {activity.tags?.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">標籤：</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {activity.tags.map((tag: string, index: number) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </HanamiCard>
          )}

          {/* 所需道具 */}
          {activity.materials_needed?.length > 0 && (
            <HanamiCard className="p-6">
              <h3 className="text-lg font-semibold text-hanami-text mb-4">所需道具</h3>
              <div className="flex flex-wrap gap-2">
                {activity.materials_needed.map((material: string, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {material}
                  </span>
                ))}
              </div>
            </HanamiCard>
          )}

          {/* 範本資訊 */}
          {template && (
            <HanamiCard className="p-6">
              <h3 className="text-lg font-semibold text-hanami-text mb-4">使用範本</h3>
              <div className="p-4 bg-hanami-primary/10 rounded-lg">
                <h4 className="font-medium text-hanami-text mb-2">
                  {template.template_name}
                </h4>
                <p className="text-sm text-hanami-text-secondary mb-3">
                  {template.template_description}
                </p>
                
                {/* 範本欄位資料 */}
                {template.template_schema?.fields && activity.custom_fields && (
                  <div className="space-y-3">
                    {template.template_schema.fields.map((field: any) => {
                      // 嘗試多種可能的欄位名稱
                      const fieldNames = [field.name, field.title, field.id, field.label];
                      let value = null;
                      
                      for (const fieldName of fieldNames) {
                        if (fieldName && activity.custom_fields[fieldName] !== undefined) {
                          value = activity.custom_fields[fieldName];
                          break;
                        }
                      }
                      
                      if (!value) return null;
                      
                      return (
                        <div key={field.name || field.id}>
                          <span className="text-sm font-medium text-gray-600">
                            {field.name || field.title || field.id}：
                          </span>
                          {field.type === 'array' ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Array.isArray(value) ? value.map((item: string, index: number) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm"
                                >
                                  {item}
                                </span>
                              )) : (
                                <span className="text-sm">{value}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm ml-2">{value}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* 如果沒有範本欄位，顯示所有 custom_fields */}
                {(!template.template_schema?.fields || !activity.custom_fields) && activity.custom_fields && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-700">自訂欄位資料：</h5>
                    {Object.entries(activity.custom_fields).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-sm font-medium text-gray-600">
                          {key}：
                        </span>
                        {Array.isArray(value) ? (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {value.map((item: string, index: number) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm ml-2">{String(value)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </HanamiCard>
          )}

          {/* 注意事項 */}
          {activity.instructions && (
            <HanamiCard className="p-6">
              <h3 className="text-lg font-semibold text-hanami-text mb-4">注意事項</h3>
              <p className="text-hanami-text-secondary leading-relaxed">
                {activity.instructions}
              </p>
            </HanamiCard>
          )}

          {/* 使用統計 */}
          <HanamiCard className="p-6">
            <h3 className="text-lg font-semibold text-hanami-text mb-4">使用統計</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">使用次數</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">收藏次數</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">評分</div>
              </div>
            </div>
          </HanamiCard>
        </div>

        {/* 底部按鈕 */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <HanamiButton
            variant="secondary"
            onClick={onClose}
          >
            關閉
          </HanamiButton>
          <HanamiButton
            className="bg-hanami-primary hover:bg-hanami-accent"
            onClick={onEdit}
          >
            編輯活動
          </HanamiButton>
        </div>
      </div>
    </div>
  );
} 