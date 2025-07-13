'use client';

import { PlusIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { HanamiButton, HanamiInput, HanamiSelect, HanamiCard } from '@/components/ui';
import { ActivityTemplate, TemplateField, FieldType } from '@/types/template';


interface DynamicActivityFormProps {
  template: ActivityTemplate;
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function DynamicActivityForm({
  template,
  initialData,
  onSubmit,
  onCancel,
}: DynamicActivityFormProps) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // 初始化表單資料，使用範本的預設值
    const initialFormData: any = {};
    template.fields.forEach(field => {
      if (initialData && initialData[field.id] !== undefined) {
        initialFormData[field.id] = initialData[field.id];
      } else if (field.defaultValue !== undefined) {
        initialFormData[field.id] = field.defaultValue;
      } else {
        // 根據欄位類型設定預設值
        switch (field.type) {
          case 'checkboxes':
          case 'multiple_choice_grid':
          case 'tick_box_grid':
            initialFormData[field.id] = [];
            break;
          case 'rating':
          case 'linear_scale':
            initialFormData[field.id] = 0;
            break;
          case 'file_upload':
            initialFormData[field.id] = [];
            break;
          case 'date':
          case 'time':
            initialFormData[field.id] = '';
            break;
          default:
            initialFormData[field.id] = '';
        }
      }
    });
    setFormData(initialFormData);
  }, [template, initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    template.fields.forEach(field => {
      const value = formData[field.id];
      
      if (field.required) {
        if (['checkboxes', 'multiple_choice_grid', 'tick_box_grid', 'file_upload'].includes(field.type)) {
          if (!Array.isArray(value) || value.length === 0) {
            newErrors[field.id] = `${field.title} 為必填欄位`;
          }
        } else if (value === '' || value === null || value === undefined) {
          newErrors[field.id] = `${field.title} 為必填欄位`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    } else {
      toast.error('請檢查表單錯誤');
    }
  };

  const updateField = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [fieldId]: value }));
    // 清除該欄位的錯誤
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const addArrayItem = (fieldId: string) => {
    const currentArray = formData[fieldId] || [];
    updateField(fieldId, [...currentArray, '']);
  };

  const removeArrayItem = (fieldId: string, index: number) => {
    const currentArray = formData[fieldId] || [];
    const newArray = currentArray.filter((_: any, i: number) => i !== index);
    updateField(fieldId, newArray);
  };

  const updateArrayItem = (fieldId: string, index: number, value: string) => {
    const currentArray = formData[fieldId] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateField(fieldId, newArray);
  };

  // 插入測試資料
  const fillTestData = () => {
    const testData: any = {};
    template.fields.forEach(field => {
      switch (field.id) {
        case 'title':
          testData[field.id] = '測試音樂活動';
          break;
        case 'description':
          testData[field.id] = '這是一個測試用的音樂教學活動，用於驗證系統功能。';
          break;
        case 'activity_type':
          testData[field.id] = field.options?.includes('遊戲活動') ? '遊戲活動' : (field.options?.[0] || '');
          break;
        case 'difficulty_level':
          testData[field.id] = field.options?.includes('初級') ? '初級' : (field.options?.[0] || '');
          break;
        case 'duration':
          testData[field.id] = 30;
          break;
        case 'objectives':
          testData[field.id] = ['培養節奏感', '提升音樂欣賞能力', '增進團體合作'];
          break;
        case 'materials':
          testData[field.id] = ['樂器', '節奏棒', '音樂播放器'];
          break;
        case 'instructions':
          testData[field.id] = '1. 播放音樂\n2. 學生跟隨節奏拍手\n3. 分組進行節奏遊戲\n4. 總結活動心得';
          break;
        case 'notes':
          testData[field.id] = '適合 3-6 歲兒童，注意音量控制';
          break;
        default:
          // 其他欄位給預設值
          if (field.type === 'array') {
            testData[field.id] = [];
          } else if (field.type === 'number') {
            testData[field.id] = 0;
          } else {
            testData[field.id] = '';
          }
      }
    });
    setFormData(testData);
    toast.success('已自動填入測試資料！');
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.id];
    const error = errors[field.id];

    switch (field.type) {
      case 'title':
      case 'short_answer':
        return (
          <HanamiInput
            error={error}
            label={field.title}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(value) => updateField(field.id, value)}
          />
        );

      case 'paragraph':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={field.placeholder}
              rows={4}
              value={value}
              onChange={(e) => updateField(field.id, e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'multiple_choice':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center gap-2">
                  <input
                    checked={value === option}
                    className="text-blue-600"
                    name={field.id}
                    type="radio"
                    value={option}
                    onChange={(e) => updateField(field.id, e.target.value)}
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'checkboxes':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center gap-2">
                  <input
                    checked={Array.isArray(value) && value.includes(option)}
                    className="text-blue-600"
                    type="checkbox"
                    value={option}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        updateField(field.id, [...currentValues, option]);
                      } else {
                        updateField(field.id, currentValues.filter(v => v !== option));
                      }
                    }}
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'dropdown':
        return (
          <HanamiSelect
            error={error}
            label={field.title}
            options={field.options?.map(opt => ({ value: opt, label: opt })) || []}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(value) => updateField(field.id, value)}
          />
        );

      case 'linear_scale':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{field.scale_labels?.min || '1'}</span>
              <div className="flex gap-2">
                {Array.from({ length: (field.max_scale || 5) - (field.min_scale || 1) + 1 }, (_, i) => {
                  const scaleValue = (field.min_scale || 1) + i;
                  return (
                    <label key={scaleValue} className="flex flex-col items-center gap-1">
                      <input
                        checked={value === scaleValue}
                        className="text-blue-600"
                        name={field.id}
                        type="radio"
                        value={scaleValue}
                        onChange={(e) => updateField(field.id, parseInt(e.target.value))}
                      />
                      <span className="text-xs">{scaleValue}</span>
                    </label>
                  );
                })}
              </div>
              <span className="text-sm text-gray-600">{field.scale_labels?.max || '5'}</span>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'rating':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`p-1 rounded transition-colors ${
                    value >= star 
                      ? 'text-yellow-400 bg-yellow-50' 
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                  type="button"
                  onClick={() => updateField(field.id, star)}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'file_upload':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              accept={field.allowed_types?.join(',')}
              className="w-full p-2 border border-gray-300 rounded-lg"
              multiple={field.multiple_files}
              type="file"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                updateField(field.id, files);
              }}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <HanamiInput
            error={error}
            label={field.title}
            required={field.required}
            type="date"
            value={value}
            onChange={(value) => updateField(field.id, value)}
          />
        );

      case 'time':
        return (
          <HanamiInput
            error={error}
            label={field.title}
            required={field.required}
            type="time"
            value={value}
            onChange={(value) => updateField(field.id, value)}
          />
        );

      case 'url':
      case 'email':
      case 'phone':
        return (
          <HanamiInput
            error={error}
            label={field.title}
            placeholder={field.placeholder}
            required={field.required}
            type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'tel'}
            value={value}
            onChange={(value) => updateField(field.id, value)}
          />
        );

      default:
        return (
          <HanamiInput
            error={error}
            label={field.title}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(value) => updateField(field.id, value)}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">新增教學活動</h2>
        <HanamiButton
          className="bg-gradient-to-r from-green-500 to-green-600"
          variant="cute"
          onClick={fillTestData}
        >
          <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
          插入測試資料
        </HanamiButton>
      </div>
      <HanamiCard className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            使用範本：{template.name}
          </h3>
          {template.description && (
            <p className="text-gray-600 text-sm">{template.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {template.fields.map(field => (
            <div
              key={field.id}
              className={
              ['paragraph', 'checkboxes', 'multiple_choice', 'linear_scale', 'rating', 'file_upload'].includes(field.type) 
                ? 'md:col-span-2' 
                : ''
            }
            >
              {renderField(field)}
            </div>
          ))}
        </div>
      </HanamiCard>

      <div className="flex justify-end gap-3">
        <HanamiButton variant="secondary" onClick={onCancel}>
          取消
        </HanamiButton>
        <HanamiButton className="bg-gradient-to-r from-blue-500 to-blue-600" onClick={handleSubmit}>
          儲存活動
        </HanamiButton>
      </div>
    </div>
  );
} 