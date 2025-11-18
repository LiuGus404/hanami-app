'use client';

import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  orgId?: string | null;
  orgName?: string | null;
}

export function TemplateManagement({ onBack, orgId, orgName }: TemplateManagementProps) {
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
      // 如果提供了 orgId，在查詢參數中傳遞
      const url = orgId ? `/api/activity-templates?orgId=${orgId}` : '/api/activity-templates';
      const response = await fetch(url);
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
  }, [orgId]);

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
      const templateData = orgId ? { ...template, org_id: orgId } : template;
      const response = await fetch('/api/activity-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
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
      // 準備更新資料，確保包含所有必要欄位
      const templateData = template as any;
      const updateData = {
        template_name: templateData.template_name || template.name,
        template_description: templateData.template_description || template.description || '',
        template_type: templateData.template_type || template.category || 'custom',
        template_schema: templateData.template_schema || {
          fields: template.fields || [],
          metadata: {
            version: "1.0",
            last_updated: new Date().toISOString(),
          },
        },
        is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        org_id: orgId || undefined,
      };

      const response = await fetch(`/api/activity-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success('範本更新成功');
        setShowTemplateBuilder(false);
        setEditingTemplate(null);
        loadTemplates();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('更新範本 API 錯誤:', errorData);
        throw new Error(errorData.error || '更新失敗');
      }
    } catch (error) {
      console.error('更新範本失敗:', error);
      toast.error(`更新範本失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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
      // 適配新的資料庫結構
      const templateData = template as any;
      const templateName = templateData.template_name || template.name || '未命名範本';
      const templateDescription = templateData.template_description || template.description || '';
      const templateType = templateData.template_type || template.category || 'custom';
      const templateSchema = templateData.template_schema || { fields: template.fields || [] };
      
      const copiedTemplate = {
        template_name: `${templateName} (複製)`,
        template_description: templateDescription,
        template_type: templateType,
        template_schema: templateSchema,
        is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        org_id: orgId || undefined,
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
        const errorData = await response.json().catch(() => ({}));
        console.error('複製範本 API 錯誤:', errorData);
        throw new Error(errorData.error || '複製失敗');
      }
    } catch (error) {
      console.error('複製範本失敗:', error);
      toast.error(`複製範本失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const renderTemplateCard = (template: ActivityTemplate, index: number) => {
    // 適配新的資料庫結構
    const templateName = template.template_name || template.name || '';
    const templateDescription = template.template_description || template.description || '';
    const templateFields = template.template_schema?.fields || template.fields || [];
    const templateCreatedAt = template.created_at || template.created_at || new Date().toISOString();
    
    return (
      <motion.div
        key={template.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.1,
          type: "spring",
          damping: 20,
          stiffness: 300
        }}
        whileHover={{ 
          y: -8, 
          scale: 1.02,
          boxShadow: "0 25px 50px rgba(255, 182, 193, 0.2)"
        }}
        className="relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-[#EADBC8] overflow-hidden group"
      >
        {/* 動態背景裝飾 */}
        <motion.div
          animate={{ 
            background: [
              "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 80%, rgba(255, 213, 154, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl"
        />
        
        {/* 懸停光效 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-[#FFB6C1]/5 to-[#FFD59A]/5 rounded-3xl"
        />

        {/* 卡片內容 */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {/* 標題區域 */}
              <div className="flex items-center space-x-3 mb-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-md flex-shrink-0"
                >
                  <SparklesIcon className="w-4 h-4 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-[#4B4036] group-hover:text-[#FFB6C1] transition-colors truncate">
                  {templateName}
                </h3>
              </div>
              
              {/* 描述 */}
              <p className="text-[#2B3A3B] mb-4 leading-relaxed line-clamp-2">{templateDescription}</p>
              
              {/* 統計資訊 */}
              <div className="flex items-center space-x-4 text-sm text-[#2B3A3B] mb-4">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center space-x-1"
                >
                  <DocumentTextIcon className="w-4 h-4 text-[#FFB6C1]" />
                  <span>{templateFields.length} 個欄位</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center space-x-1"
                >
                  <ClockIcon className="w-4 h-4 text-[#FFD59A]" />
                  <span>{new Date(templateCreatedAt).toLocaleDateString()}</span>
                </motion.div>
              </div>
              
              {/* 欄位標籤 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {templateFields.slice(0, 3).map((field: TemplateField) => (
                  <motion.span
                    key={field.id}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200 shadow-sm"
                  >
                    {field.label}
                  </motion.span>
                ))}
                {templateFields.length > 3 && (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 border border-gray-200 shadow-sm"
                  >
                    +{templateFields.length - 3} 更多
                  </motion.span>
                )}
              </div>
            </div>

            {/* 操作按鈕組 */}
            <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewingTemplate(template)}
                className="p-2 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-lg transition-all shadow-md"
                title="查看"
              >
                <EyeIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setEditingTemplate(template);
                  setShowTemplateBuilder(true);
                }}
                className="p-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all shadow-md"
                title="編輯"
              >
                <PencilIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleCopyTemplate(template)}
                className="p-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFB6C1] hover:to-[#FFD59A] text-white rounded-lg transition-all shadow-md"
                title="複製"
              >
                <PlusIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDeleteTemplate(template.id)}
                className="p-2 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all shadow-md"
                title="刪除"
              >
                <TrashIcon className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
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
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm border border-[#EADBC8] rounded-2xl p-6 shadow-lg"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#4B4036]">查看範本</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewingTemplate(null)}
                className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-[#EADBC8] text-[#4B4036] rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                返回
              </motion.button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl border-2 border-[#EADBC8] overflow-hidden"
          >
            {/* 動態背景裝飾 */}
            <motion.div
              animate={{ 
                background: [
                  "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 80%, rgba(255, 213, 154, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)"
                ]
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute inset-0 rounded-3xl"
            />
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-md"
                >
                  <SparklesIcon className="w-5 h-5 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-[#4B4036]">{templateName}</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-[#4B4036] mb-2">描述</h4>
                  <p className="text-[#2B3A3B] bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-[#EADBC8]">{templateDescription || '無描述'}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[#4B4036] mb-4">欄位列表</h4>
                  <div className="space-y-3">
                    {templateFields.map((field: TemplateField, index: number) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#EADBC8] hover:shadow-md transition-all"
                      >
                        <div>
                          <span className="font-medium text-[#4B4036]">{field.label}</span>
                          <span className="text-sm text-[#A68A64] ml-2">({field.type})</span>
                          {field.required && (
                            <span className="text-red-500 text-sm ml-2">*必填</span>
                          )}
                        </div>
                        <div className="text-sm text-[#A68A64]">
                          {field.placeholder && `"${field.placeholder}"`}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm text-[#2B3A3B] pt-4 border-t border-[#EADBC8]">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="w-4 h-4 text-[#FFD59A]" />
                    <span>建立時間：{new Date(templateCreatedAt).toLocaleString()}</span>
                  </div>
                  {viewingTemplate.updated_at && (
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-4 h-4 text-[#FFB6C1]" />
                      <span>更新時間：{new Date(viewingTemplate.updated_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 標題和操作按鈕 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm border border-[#EADBC8] rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors flex-shrink-0"
              >
                <ArrowLeftIcon className="h-5 w-5 text-[#4B4036]" />
              </motion.button>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-[#4B4036] mb-1">範本管理</h1>
                {orgName && (
                  <p className="text-sm text-[#2B3A3B]">
                    管理屬於 {orgName} 的範本
                  </p>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTemplateBuilder(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              <span>新增範本</span>
            </motion.button>
          </div>
        </motion.div>

        {/* 搜尋 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm border border-[#EADBC8] rounded-2xl p-4 shadow-lg"
        >
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#A68A64]" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-[#EADBC8] rounded-xl text-[#4B4036] placeholder-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all"
              placeholder="搜尋範本..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* 範本列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-[#FFD59A] border-t-[#FFB6C1] rounded-full"
            />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-12 text-center shadow-xl border-2 border-[#EADBC8]"
          >
            <div className="text-[#2B3A3B]">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-16 h-16 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <DocumentTextIcon className="h-8 w-8 text-white" />
              </motion.div>
              <p className="text-lg font-medium mb-2 text-[#4B4036]">沒有找到範本</p>
              <p className="text-sm text-[#2B3A3B]">嘗試調整搜尋條件或新增新範本</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => renderTemplateCard(template, index))}
          </div>
        )}
      </div>
    </div>
  );
} 