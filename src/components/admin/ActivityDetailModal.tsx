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

// 添加 getTemplateFields 函數，與 ActivityForm.tsx 保持一致
function getTemplateFields(template: any) {
  console.log('getTemplateFields - 輸入範本:', template);
  
  if (!template) {
    console.log('getTemplateFields - 範本為空，返回空陣列');
    return [];
  }
  
  // 如果 template_schema 是物件且有 fields 屬性
  if (template.template_schema && typeof template.template_schema === 'object' && template.template_schema.fields) {
    console.log('getTemplateFields - 從 template_schema.fields 獲取欄位:', template.template_schema.fields);
    return template.template_schema.fields;
  }
  
  // 如果 template_schema 是陣列
  if (Array.isArray(template.template_schema)) {
    console.log('getTemplateFields - 從 template_schema 陣列獲取欄位:', template.template_schema);
    return template.template_schema;
  }
  
  // 如果 template_schema 是物件但沒有 fields 屬性，嘗試其他可能的屬性
  if (template.template_schema && typeof template.template_schema === 'object') {
    console.log('getTemplateFields - template_schema 物件:', template.template_schema);
    // 嘗試找到包含欄位定義的屬性
    for (const key in template.template_schema) {
      if (Array.isArray(template.template_schema[key])) {
        console.log(`getTemplateFields - 從 ${key} 獲取欄位:`, template.template_schema[key]);
        return template.template_schema[key];
      }
    }
  }
  
  // 如果範本直接有 fields 屬性
  if (template.fields && Array.isArray(template.fields)) {
    console.log('getTemplateFields - 從 template.fields 獲取欄位:', template.fields);
    return template.fields;
  }
  
  console.log('getTemplateFields - 未找到欄位定義，返回空陣列');
  return [];
}

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

      console.log('載入範本，template_id:', activity.template_id);

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
        console.log('載入的範本資料:', data);
        if (data && typeof data.template_schema === 'object' && data.template_schema && 'fields' in data.template_schema && Array.isArray(data.template_schema.fields)) {
          console.log('範本欄位順序:', data.template_schema.fields.map((f: any) => f.title || f.id));
        }
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
              <h3 className="text-lg font-semibold text-hanami-text mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                使用範本
              </h3>
              <div className="bg-gradient-to-br from-[#FFFDF8] to-[#FFF9F2] p-6 rounded-xl border border-[#EADBC8]">
                <div className="mb-4 p-3 bg-[#FFD59A] rounded-lg">
                  <span className="text-sm font-semibold text-[#4B4036]">範本名稱：</span>
                  <span className="text-sm text-[#4B4036] ml-2 font-medium">
                    {template.template_name}
                  </span>
                </div>
                
                {template.template_description && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-[#EADBC8]">
                    <span className="text-sm font-semibold text-[#4B4036]">範本描述：</span>
                    <p className="text-sm text-[#4B4036] mt-1">
                      {template.template_description}
                    </p>
                  </div>
                )}
                
                {/* 範本欄位資料 */}
                {template && activity.custom_fields && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-[#4B4036] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD59A] rounded-full"></span>
                      範本欄位資料
                    </h5>
                    {/* 使用 getTemplateFields 函數獲取欄位，確保順序一致 */}
                    {getTemplateFields(template).map((field: any, index: number) => {
                      // 嘗試多種可能的欄位名稱，與 ActivityForm 的邏輯一致
                      const fieldNames = [field.title, field.id, field.name, field.label];
                      let value = null;
                      
                      for (const fieldName of fieldNames) {
                        if (fieldName && activity.custom_fields[fieldName] !== undefined) {
                          value = activity.custom_fields[fieldName];
                          break;
                        }
                      }
                      
                      if (!value) {
                        console.log(`未找到欄位值: ${field.title || field.id} (${field.id})`);
                        return null;
                      }
                      
                      console.log(`顯示欄位 ${index + 1}: ${field.title || field.id} =`, value);
                      
                      return (
                        <div key={field.id || field.name} className="bg-white p-4 rounded-lg border border-[#EADBC8] shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-[#FFD59A] text-[#4B4036] px-2 py-1 rounded-full text-xs font-medium">
                              {index + 1}
                            </span>
                            <div className="text-sm font-semibold text-[#4B4036]">
                              {field.title || field.name || field.id}
                            </div>
                            <span className="px-2 py-1 bg-[#EADBC8] rounded-full text-xs text-[#A68A64]">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                必填
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-[#4B4036] bg-[#FFF9F2] p-3 rounded-lg border border-[#EADBC8]">
                            {field.type === 'array' || Array.isArray(value) ? (
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(value) ? value.map((item: string, itemIndex: number) => (
                                  <span 
                                    key={itemIndex}
                                    className="px-2 py-1 bg-[#EADBC8] text-[#4B4036] rounded text-sm"
                                  >
                                    {item}
                                  </span>
                                )) : (
                                  <span className="text-sm">{value}</span>
                                )}
                              </div>
                            ) : (
                              <span className="whitespace-pre-wrap">{String(value)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* 調試信息 - 僅在開發環境顯示 */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
                        <div className="font-semibold mb-2">調試信息：</div>
                        <div>範本欄位數量: {getTemplateFields(template).length}</div>
                        <div>自訂欄位數量: {Object.keys(activity.custom_fields || {}).length}</div>
                        <div>自訂欄位鍵名: {Object.keys(activity.custom_fields || {}).join(', ')}</div>
                        <div>範本欄位順序: {getTemplateFields(template).map((f: any) => f.title || f.id).join(' → ')}</div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 如果沒有範本欄位，顯示所有 custom_fields */}
                {(!template.template_schema?.fields || !activity.custom_fields) && activity.custom_fields && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-[#4B4036] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD59A] rounded-full"></span>
                      自訂欄位資料
                    </h5>
                    {Object.entries(activity.custom_fields).map(([key, value], index) => (
                      <div key={key} className="bg-white p-4 rounded-lg border border-[#EADBC8] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-[#FFD59A] text-[#4B4036] px-2 py-1 rounded-full text-xs font-medium">
                            {index + 1}
                          </span>
                          <div className="text-sm font-semibold text-[#4B4036]">
                            {key}
                          </div>
                        </div>
                        <div className="text-sm text-[#4B4036] bg-[#FFF9F2] p-3 rounded-lg border border-[#EADBC8]">
                          {Array.isArray(value) ? (
                            <div className="flex flex-wrap gap-2">
                              {value.map((item: string, itemIndex: number) => (
                                <span 
                                  key={itemIndex}
                                  className="px-2 py-1 bg-[#EADBC8] text-[#4B4036] rounded text-sm"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap">{String(value)}</span>
                          )}
                        </div>
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