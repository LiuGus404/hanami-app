'use client';

import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { HanamiButton, HanamiCard, HanamiInput } from '@/components/ui';
import { ActivityTemplate } from '@/types/template';


interface TemplateSelectorProps {
  templates: ActivityTemplate[];
  onSelect: (template: ActivityTemplate) => void;
  onEdit: (template: ActivityTemplate) => void;
  onDelete: (templateId: string) => void;
  onAddNew: () => void;
}

export function TemplateSelector({
  templates,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
}: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  console.log('TemplateSelector 收到的範本:', templates);

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

  const filteredTemplates = templates.filter(template => {
    const templateName = template.template_name || template.name || '';
    const templateDescription = template.template_description || template.description || '';
    
    const matchesSearch = !searchTerm || 
      templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      templateDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  console.log('過濾後的範本:', filteredTemplates);

  const handleDelete = (template: ActivityTemplate) => {
    if (confirm(`確定要刪除範本「${template.name}」嗎？此操作無法復原。`)) {
      onDelete(template.id);
      toast.success('範本刪除成功');
    }
  };

  return (
    <div className="space-y-4">
      {/* 搜尋和篩選 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <HanamiInput
            placeholder="搜尋範本..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">全部分類</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <HanamiButton
          className="bg-gradient-to-r from-green-500 to-green-600"
          onClick={onAddNew}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          新增範本
        </HanamiButton>
      </div>

      {/* 範本列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <HanamiCard key={template.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {template.template_name || template.name}
                </h3>
                {template.category && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
                    {template.category}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <HanamiButton
                  size="sm"
                  variant="primary"
                  onClick={() => onSelect(template)}
                >
                  <EyeIcon className="h-4 w-4" />
                </HanamiButton>
                <HanamiButton
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(template)}
                >
                  <PencilIcon className="h-4 w-4" />
                </HanamiButton>
                <HanamiButton
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(template)}
                >
                  <TrashIcon className="h-4 w-4" />
                </HanamiButton>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {template.template_description || template.description || '無描述'}
            </p>
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{(template.template_schema?.fields || template.fields || []).length} 個欄位</span>
              <span>{new Date(template.updated_at || template.created_at).toLocaleDateString()}</span>
            </div>
          </HanamiCard>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || selectedCategory ? '沒有找到符合條件的範本' : '尚未建立任何範本'}
        </div>
      )}
    </div>
  );
} 