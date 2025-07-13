'use client';

import { PlusIcon, TrashIcon, CogIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { 
  BarChart3, 
  TreePine, 
  TrendingUp, 
  Gamepad2, 
  FileText, 
  Users, 
  Database,
  Type,
  CheckSquare,
  ChevronDown,
  Star,
  Grid3X3,
  Calendar,
  Clock,
  Link,
  Mail,
  Phone,
  Upload,
  Hash,
  CircleDot,
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';

import { HanamiButton, HanamiInput, HanamiSelect, HanamiCard } from '@/components/ui';
import { 
  FieldType, 
  TemplateField, 
  ActivityTemplate, 
  FIELD_TYPES, 
  CATEGORIES, 
} from '@/types/template';

interface ActivityTemplateBuilderProps {
  onSave: (template: ActivityTemplate) => Promise<void>;
  onCancel: () => void;
  template?: ActivityTemplate;
}



export function ActivityTemplateBuilder({ 
  onSave, 
  onCancel, 
  template: initialTemplate, 
}: ActivityTemplateBuilderProps) {
  const [template, setTemplate] = useState<Partial<ActivityTemplate>>(
    initialTemplate || {
      name: '',
      description: '',
      fields: [],
      category: '',
      tags: [],
    },
  );
  const [showFieldTypeSelector, setShowFieldTypeSelector] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [selectedCategory, setSelectedCategory] = useState<'basic' | 'choice' | 'advanced' | 'media'>('basic');

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const fields = Array.from(template.fields || []);
    const [reorderedField] = fields.splice(result.source.index, 1);
    fields.splice(result.destination.index, 0, reorderedField);

    setTemplate(prev => ({ ...prev, fields }));
  };

  const addField = () => {
    setShowFieldTypeSelector(true);
  };

  const selectFieldType = (fieldType: FieldType) => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      type: fieldType,
      title: '',
      required: false,
    };
    setEditingField(newField);
    setEditingIndex(-1);
    setShowFieldTypeSelector(false);
    setShowFieldEditor(true);
  };

  const editField = (index: number) => {
    setEditingField(template.fields?.[index] || null);
    setEditingIndex(index);
    setShowFieldEditor(true);
  };

  const deleteField = (index: number) => {
    const fields = template.fields?.filter((_, i) => i !== index) || [];
    setTemplate(prev => ({ ...prev, fields }));
  };

  const saveField = (field: TemplateField) => {
    const fields = [...(template.fields || [])];
    
    if (editingIndex >= 0) {
      fields[editingIndex] = field;
    } else {
      fields.push(field);
    }
    
    setTemplate(prev => ({ ...prev, fields }));
    setShowFieldEditor(false);
    setEditingField(null);
    setEditingIndex(-1);
  };

  const handleSave = () => {
    if (!template.name?.trim()) {
      toast.error('請輸入範本名稱');
      return;
    }
    if (!template.fields?.length) {
      toast.error('請至少添加一個欄位');
      return;
    }

    const newTemplate: ActivityTemplate = {
      id: initialTemplate?.id || `template_${Date.now()}`,
      name: template.name,
      description: template.description || '',
      fields: template.fields,
      category: template.category || '',
      tags: template.tags || [],
      created_at: initialTemplate?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // 新增資料庫格式的欄位
      template_name: template.name,
      template_description: template.description || '',
      template_schema: {
        fields: template.fields,
      },
      template_type: template.category || 'custom',
      is_active: true,
    };

    onSave(newTemplate);
  };

  const getFieldTypeLabel = (type: FieldType) => {
    return FIELD_TYPES.find(t => t.type === type)?.name || type;
  };

  const renderFieldTypeSelector = () => {
    if (!showFieldTypeSelector) return null;

    const filteredTypes = FIELD_TYPES.filter(type => type.category === selectedCategory);

    // 動態渲染圖案的函數
    const renderIcon = (iconName: string) => {
      const iconProps = { className: 'w-6 h-6' };
      switch (iconName) {
        case 'Type': return <Type {...iconProps} />;
        case 'Hash': return <Hash {...iconProps} />;
        case 'FileText': return <FileText {...iconProps} />;
        case 'CircleDot': return <CircleDot {...iconProps} />;
        case 'CheckSquare': return <CheckSquare {...iconProps} />;
        case 'ChevronDown': return <ChevronDown {...iconProps} />;
        case 'BarChart3': return <BarChart3 {...iconProps} />;
        case 'Star': return <Star {...iconProps} />;
        case 'Grid3X3': return <Grid3X3 {...iconProps} />;
        case 'Upload': return <Upload {...iconProps} />;
        case 'Link': return <Link {...iconProps} />;
        case 'Mail': return <Mail {...iconProps} />;
        case 'Phone': return <Phone {...iconProps} />;
        case 'Calendar': return <Calendar {...iconProps} />;
        case 'Clock': return <Clock {...iconProps} />;
        case 'Database': return <Database {...iconProps} />;
        default: return <Type {...iconProps} />;
      }
    };

    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">選擇欄位類型</h3>
          
          {/* 分類標籤 */}
          <div className="flex gap-2 mb-4">
            {CATEGORIES.map(category => (
              <button
                key={category.key}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category.key
                    ? 'bg-hanami-primary text-hanami-text'
                    : 'bg-hanami-surface text-hanami-text-secondary hover:bg-hanami-secondary'
                }`}
                onClick={() => setSelectedCategory(category.key as any)}
              >
                {renderIcon(category.icon)}
                {category.name}
              </button>
            ))}
          </div>
          
          {/* 欄位類型網格 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredTypes.map(fieldType => (
              <button
                key={fieldType.type}
                className="p-4 rounded-lg border-2 border-hanami-border hover:border-hanami-primary hover:bg-hanami-surface transition-all text-left group"
                onClick={() => selectFieldType(fieldType.type)}
              >
                <div className="mb-2 text-hanami-primary group-hover:text-hanami-accent">
                  {renderIcon(fieldType.icon)}
                </div>
                <div className="font-medium text-hanami-text">{fieldType.name}</div>
                <div className="text-sm text-hanami-text-secondary">{fieldType.description}</div>
              </button>
            ))}
          </div>
          
          <div className="flex justify-end mt-4">
            <HanamiButton
              variant="secondary"
              onClick={() => setShowFieldTypeSelector(false)}
            >
              取消
            </HanamiButton>
          </div>
        </div>
      </div>
    );
  };

  const renderFieldEditor = () => {
    if (!showFieldEditor) return null;

    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingIndex >= 0 ? '編輯欄位' : '新增欄位'}
          </h3>
          
          <FieldEditor
            field={editingField}
            onCancel={() => {
              setShowFieldEditor(false);
              setEditingField(null);
              setEditingIndex(-1);
            }}
            onSave={saveField}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 範本基本資訊 */}
      <HanamiCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">範本基本資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HanamiInput
            required
            label="範本名稱"
            placeholder="輸入範本名稱"
            value={template.name}
            onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
          />
          <HanamiInput
            label="分類"
            placeholder="輸入分類"
            value={template.category}
            onChange={(e) => setTemplate(prev => ({ ...prev, category: e.target.value }))}
          />
          <div className="md:col-span-2">
            <HanamiInput
              label="描述"
              placeholder="輸入範本描述"
              value={template.description}
              onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
      </HanamiCard>

      {/* 欄位編輯器 */}
      <HanamiCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">範本欄位</h3>
          <HanamiButton
            className="bg-gradient-to-r from-green-500 to-green-600"
            onClick={addField}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            新增欄位
          </HanamiButton>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fields" isCombineEnabled={false} isDropDisabled={false}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {template.fields?.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                      >
                        <div {...provided.dragHandleProps} className="cursor-move">
                          <CogIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{field.title}</div>
                          <div className="text-sm text-gray-500">
                            {getFieldTypeLabel(field.type)}
                            {field.required && ' (必填)'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <HanamiButton
                            size="sm"
                            variant="secondary"
                            onClick={() => editField(index)}
                          >
                            編輯
                          </HanamiButton>
                          <HanamiButton
                            size="sm"
                            variant="danger"
                            onClick={() => deleteField(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </HanamiButton>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {!template.fields?.length && (
          <div className="text-center py-8 text-gray-500">
            尚未添加任何欄位，點擊「新增欄位」開始建構範本
          </div>
        )}
      </HanamiCard>

      {/* 操作按鈕 */}
      <div className="flex justify-end gap-3">
        <HanamiButton variant="secondary" onClick={onCancel}>
          取消
        </HanamiButton>
        <HanamiButton className="bg-gradient-to-r from-blue-500 to-blue-600" onClick={handleSave}>
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          儲存範本
        </HanamiButton>
      </div>

      {renderFieldTypeSelector()}
      {renderFieldEditor()}
    </div>
  );
}

interface FieldEditorProps {
  field: TemplateField | null;
  onSave: (field: TemplateField) => void;
  onCancel: () => void;
}

function FieldEditor({ field, onSave, onCancel }: FieldEditorProps) {
  const [fieldData, setFieldData] = useState<TemplateField>(
    field || {
      id: `field_${Date.now()}`,
      type: 'short_answer',
      title: '',
      required: false,
    },
  );

  const handleSave = () => {
    if (!fieldData.title?.trim()) {
      toast.error('請輸入欄位標題');
      return;
    }
    onSave(fieldData);
  };

  const renderFieldSpecificSettings = () => {
    switch (fieldData.type) {
      case 'multiple_choice':
      case 'checkboxes':
      case 'dropdown':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium">選項</label>
            {fieldData.options?.map((option, index) => (
              <div key={index} className="flex gap-2">
                <HanamiInput
                  placeholder={`選項 ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(fieldData.options || [])];
                    newOptions[index] = e.target.value;
                    setFieldData({ ...fieldData, options: newOptions });
                  }}
                />
                <button
                  className="text-red-500 hover:text-red-700 px-2"
                  onClick={() => {
                    const newOptions = fieldData.options?.filter((_, i) => i !== index);
                    setFieldData({ ...fieldData, options: newOptions });
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <HanamiButton
              variant="soft"
              onClick={() => {
                const newOptions = [...(fieldData.options || []), ''];
                setFieldData({ ...fieldData, options: newOptions });
              }}
            >
              + 新增選項
            </HanamiButton>
          </div>
        );
        
      case 'linear_scale':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <HanamiInput
                label="最小值"
                type="number"
                value={fieldData.min_scale || 1}
                onChange={(e) => setFieldData({ ...fieldData, min_scale: parseInt(e.target.value) })}
              />
              <HanamiInput
                label="最大值"
                type="number"
                value={fieldData.max_scale || 5}
                onChange={(e) => setFieldData({ ...fieldData, max_scale: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <HanamiInput
                label="最小值標籤"
                value={fieldData.scale_labels?.min || ''}
                onChange={(e) => setFieldData({
                  ...fieldData,
                  scale_labels: { 
                    min: e.target.value, 
                    max: fieldData.scale_labels?.max ?? '', 
                  },
                })}
              />
              <HanamiInput
                label="最大值標籤"
                value={fieldData.scale_labels?.max || ''}
                onChange={(e) => setFieldData({
                  ...fieldData,
                  scale_labels: { 
                    min: fieldData.scale_labels?.min ?? '', 
                    max: e.target.value, 
                  },
                })}
              />
            </div>
          </div>
        );
        
      case 'file_upload':
        return (
          <div className="space-y-3">
            <HanamiInput
              label="允許的檔案類型"
              placeholder="pdf, jpg, png, mp3"
              value={fieldData.allowed_types?.join(', ') || ''}
              onChange={(e) => setFieldData({
                ...fieldData,
                allowed_types: e.target.value.split(',').map(t => t.trim()),
              })}
            />
            <HanamiInput
              label="最大檔案大小 (MB)"
              type="number"
              value={fieldData.max_size ? fieldData.max_size / 1024 / 1024 : 10}
              onChange={(e) => setFieldData({
                ...fieldData,
                max_size: parseInt(e.target.value) * 1024 * 1024,
              })}
            />
            <label className="flex items-center gap-2">
              <input
                checked={fieldData.multiple_files || false}
                type="checkbox"
                onChange={(e) => setFieldData({
                  ...fieldData,
                  multiple_files: e.target.checked,
                })}
              />
              <span className="text-sm">允許多個檔案</span>
            </label>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <HanamiInput
        required
        label="欄位標題"
        placeholder="輸入欄位標題"
        value={fieldData.title}
        onChange={(e) => setFieldData(prev => ({ ...prev, title: e.target.value }))}
      />

      <HanamiInput
        label="說明文字"
        placeholder="輸入說明文字"
        value={fieldData.description || ''}
        onChange={(e) => setFieldData(prev => ({ ...prev, description: e.target.value }))}
      />

      <HanamiInput
        label="預設值"
        placeholder="輸入預設值"
        value={fieldData.placeholder || ''}
        onChange={(e) => setFieldData(prev => ({ ...prev, placeholder: e.target.value }))}
      />

      <label className="flex items-center gap-2">
        <input
          checked={fieldData.required || false}
          className="rounded"
          type="checkbox"
          onChange={(e) => setFieldData(prev => ({ ...prev, required: e.target.checked }))}
        />
        <span className="text-sm">必填欄位</span>
      </label>

      {/* 欄位特定設定 */}
      {renderFieldSpecificSettings()}

      <div className="flex justify-end gap-3 pt-4">
        <HanamiButton size="sm" variant="secondary" onClick={onCancel}>
          取消
        </HanamiButton>
        <HanamiButton size="sm" onClick={handleSave}>
          儲存欄位
        </HanamiButton>
      </div>
    </div>
  );
} 