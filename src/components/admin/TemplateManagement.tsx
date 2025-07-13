'use client';

import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { ActivityTemplateBuilder } from './ActivityTemplateBuilder';

import { HanamiButton, HanamiInput, HanamiCard } from '@/components/ui';
import { ActivityTemplate } from '@/types/template';

interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'array';
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: any;
}

interface TemplateManagementProps {
  onBack: () => void;
}

export function TemplateManagement({ onBack }: TemplateManagementProps) {
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ActivityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 範本操作狀態
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<ActivityTemplate | null>(null);

  // 載入範本資料
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/activity-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        setFilteredTemplates(data);
      } else {
        throw new Error('載入失敗');
      }
    } catch (error) {
      console.error('載入範本失敗:', error);
      toast.error('載入範本失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // 篩選範本
  useEffect(() => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(template => {
        const templateName = template.template_name || template.name || '';
        const templateDescription = template.template_description || template.description || '';
        
        return templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               templateDescription.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery]);

  // 新增範本
  const handleSaveTemplate = async (template: ActivityTemplate) => {
    try {
      const response = await fetch('/api/activity-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        toast.success('範本儲存成功');
        setShowTemplateBuilder(false);
        setEditingTemplate(null);
        loadTemplates();
      } else {
        throw new Error('儲存失敗');
      }
    } catch (error) {
      console.error('儲存範本失敗:', error);
      toast.error('儲存範本失敗');
    }
  };

  // 更新範本
  const handleUpdateTemplate = async (template: ActivityTemplate) => {
    if (!editingTemplate) return;

    try {
      const response = await fetch(`/api/activity-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        toast.success('範本更新成功');
        setShowTemplateBuilder(false);
        setEditingTemplate(null);
        loadTemplates();
      } else {
        throw new Error('更新失敗');
      }
    } catch (error) {
      console.error('更新範本失敗:', error);
      toast.error('更新範本失敗');
    }
  };

  // 刪除範本
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('確定要刪除此範本嗎？此操作無法復原。')) return;

    try {
      const response = await fetch(`/api/activity-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('範本刪除成功');
        loadTemplates();
      } else {
        throw new Error('刪除失敗');
      }
    } catch (error) {
      console.error('刪除範本失敗:', error);
      toast.error('刪除範本失敗');
    }
  };

  // 複製範本
  const handleCopyTemplate = async (template: ActivityTemplate) => {
    try {
      const copiedTemplate = {
        ...template,
        id: undefined,
        name: `${template.name} (複製)`,
        created_at: new Date().toISOString(),
      };

      const response = await fetch('/api/activity-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copiedTemplate),
      });

      if (response.ok) {
        toast.success('範本複製成功');
        loadTemplates();
      } else {
        throw new Error('複製失敗');
      }
    } catch (error) {
      console.error('複製範本失敗:', error);
      toast.error('複製範本失敗');
    }
  };

  const renderTemplateCard = (template: ActivityTemplate) => {
    // 適配新的資料庫結構
    const templateName = template.template_name || template.name || '';
    const templateDescription = template.template_description || template.description || '';
    const templateFields = template.template_schema?.fields || template.fields || [];
    const templateCreatedAt = template.created_at || template.created_at || new Date().toISOString();
    
    return (
      <HanamiCard key={template.id} className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{templateName}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{templateDescription}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <DocumentTextIcon className="h-4 w-4" />
              <span>{templateFields.length} 個欄位</span>
              <span>•</span>
              <span>{new Date(templateCreatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-1 ml-4">
            <HanamiButton
              size="sm"
              variant="soft"
              onClick={() => setViewingTemplate(template)}
            >
              <EyeIcon className="h-4 w-4" />
            </HanamiButton>
            <HanamiButton
              size="sm"
              variant="soft"
              onClick={() => {
                setEditingTemplate(template);
                setShowTemplateBuilder(true);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </HanamiButton>
            <HanamiButton
              size="sm"
              variant="soft"
              onClick={() => handleCopyTemplate(template)}
            >
              <PlusIcon className="h-4 w-4" />
            </HanamiButton>
            <HanamiButton
              size="sm"
              variant="danger"
              onClick={() => handleDeleteTemplate(template.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </HanamiButton>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {templateFields.slice(0, 3).map((field: TemplateField) => (
            <span key={field.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {field.label}
            </span>
          ))}
          {templateFields.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              +{templateFields.length - 3} 更多
            </span>
          )}
        </div>
      </HanamiCard>
    );
  };

  if (showTemplateBuilder) {
    return (
      <ActivityTemplateBuilder
        template={editingTemplate || undefined}
        onCancel={() => {
          setShowTemplateBuilder(false);
          setEditingTemplate(null);
        }}
        onSave={editingTemplate ? handleUpdateTemplate : handleSaveTemplate}
      />
    );
  }

  if (viewingTemplate) {
    const templateName = viewingTemplate.template_name || viewingTemplate.name || '';
    const templateDescription = viewingTemplate.template_description || viewingTemplate.description || '';
    const templateFields = viewingTemplate.template_schema?.fields || viewingTemplate.fields || [];
    const templateCreatedAt = viewingTemplate.created_at || viewingTemplate.created_at || new Date().toISOString();
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">查看範本</h2>
          <HanamiButton variant="secondary" onClick={() => setViewingTemplate(null)}>
            返回
          </HanamiButton>
        </div>
        
        <HanamiCard className="p-6">
          <h3 className="text-xl font-semibold mb-4">{templateName}</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">描述</h4>
              <p className="text-gray-600">{templateDescription}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">欄位列表</h4>
              <div className="space-y-2">
                {templateFields.map((field: TemplateField) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{field.label}</span>
                      <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                      {field.required && (
                        <span className="text-red-500 text-sm ml-2">*必填</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {field.placeholder && `"${field.placeholder}"`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 text-sm text-gray-500">
              <span>建立時間：{new Date(templateCreatedAt).toLocaleString()}</span>
              {viewingTemplate.updated_at && (
                <span>• 更新時間：{new Date(viewingTemplate.updated_at).toLocaleString()}</span>
              )}
            </div>
          </div>
        </HanamiCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標題和操作按鈕 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <HanamiButton variant="secondary" onClick={onBack}>
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            返回
          </HanamiButton>
          <h1 className="text-3xl font-bold text-gray-900">範本管理</h1>
        </div>
        <HanamiButton
          className="bg-gradient-to-r from-blue-500 to-blue-600"
          onClick={() => setShowTemplateBuilder(true)}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          新增範本
        </HanamiButton>
      </div>

      {/* 搜尋 */}
      <HanamiCard className="p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <HanamiInput
            className="pl-10"
            placeholder="搜尋範本..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </HanamiCard>

      {/* 範本列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <HanamiCard className="p-12 text-center">
          <div className="text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">沒有找到範本</p>
            <p className="text-sm">嘗試調整搜尋條件或新增新範本</p>
          </div>
        </HanamiCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(renderTemplateCard)}
        </div>
      )}
    </div>
  );
} 