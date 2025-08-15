'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';

import AccountIcon from '@/components/ui/AccountIcon';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { Database } from '@/lib/database.types';

interface AccountFormProps {
  userType: 'teacher' | 'student' | 'admin';
  editingUser?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AccountForm({ userType, editingUser, onClose, onSuccess }: AccountFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (editingUser) {
      setFormData(editingUser);
    } else {
      // 設定預設值
      setFormData({
        teacher_status: 'active',
        student_type: 'active',
        role: 'admin',
      });
    }
  }, [editingUser]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let tableName = '';
      let data: any = {};

      switch (userType) {
        case 'teacher':
          tableName = 'hanami_employee';
          data = {
            teacher_fullname: formData.teacher_fullname,
            teacher_nickname: formData.teacher_nickname,
            teacher_email: formData.teacher_email,
            teacher_phone: formData.teacher_phone,
            teacher_role: formData.teacher_role,
            teacher_status: formData.teacher_status,
            teacher_password: formData.teacher_password || '123456', // 預設密碼
          };
          break;
        case 'student':
          tableName = 'Hanami_Students';
          data = {
            full_name: formData.full_name,
            nick_name: formData.nick_name,
            student_email: formData.student_email,
            contact_number: formData.contact_number,
            parent_email: formData.parent_email,
            student_age: formData.student_age ? parseInt(formData.student_age) : null,
            course_type: formData.course_type,
            student_type: formData.student_type,
            student_password: formData.student_password || '123456', // 預設密碼
          };
          break;
        case 'admin':
          tableName = 'hanami_admin';
          data = {
            admin_name: formData.admin_name,
            admin_email: formData.admin_email,
            role: formData.role,
            admin_password: formData.admin_password || '123456', // 預設密碼
          };
          break;
      }

      if (editingUser) {
        // 更新現有帳戶
        const { error: updateError } = await supabase
          .from(tableName as any)
          .update(data)
          .eq('id', editingUser.id);

        if (updateError) {
          setError(`更新失敗：${updateError.message}`);
        } else {
          alert('帳戶更新成功');
          onSuccess();
          onClose();
        }
      } else {
        // 新增帳戶
        const { error: insertError } = await supabase
          .from(tableName as any)
          .insert(data);

        if (insertError) {
          setError(`新增失敗：${insertError.message}`);
        } else {
          alert('帳戶新增成功');
          onSuccess();
          onClose();
        }
      }
    } catch (error) {
      console.error('Error saving account:', error);
      setError('操作失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const getFormFields = () => {
    switch (userType) {
      case 'teacher':
        return [
          { name: 'teacher_fullname', label: '全名', type: 'text', required: true },
          { name: 'teacher_nickname', label: '暱稱', type: 'text', required: true },
          { name: 'teacher_email', label: '電子郵件', type: 'email', required: true },
          { name: 'teacher_phone', label: '電話', type: 'tel' },
          { name: 'teacher_role', label: '職位', type: 'text' },
          { name: 'teacher_status', label: '狀態', type: 'select', options: [
            { value: 'active', label: '在職' },
            { value: 'inactive', label: '離職' },
          ] },
          { name: 'teacher_password', label: '密碼', type: 'password' },
        ];
      case 'student':
        return [
          { name: 'full_name', label: '全名', type: 'text', required: true },
          { name: 'nick_name', label: '暱稱', type: 'text' },
          { name: 'student_email', label: '學生電子郵件', type: 'email' },
          { name: 'contact_number', label: '聯絡電話', type: 'tel', required: true },
          { name: 'parent_email', label: '家長電子郵件', type: 'email' },
          { name: 'student_age', label: '年齡', type: 'number' },
          { name: 'course_type', label: '課程類型', type: 'text' },
          { name: 'student_type', label: '狀態', type: 'select', options: [
            { value: 'active', label: '在學' },
            { value: 'inactive', label: '休學' },
          ] },
          { name: 'student_password', label: '密碼', type: 'password' },
        ];
      case 'admin':
        return [
          { name: 'admin_name', label: '管理員姓名', type: 'text', required: true },
          { name: 'admin_email', label: '電子郵件', type: 'email', required: true },
          { name: 'role', label: '角色', type: 'select', options: [
            { value: 'admin', label: '管理員' },
            { value: 'super_admin', label: '超級管理員' },
          ] },
          { name: 'admin_password', label: '密碼', type: 'password' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <HanamiCard className="w-full max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <AccountIcon className="mr-3" size="lg" type={userType} />
          <h3 className="text-lg font-bold text-[#2B3A3B]">
            {editingUser ? '編輯' : '新增'}{userType === 'teacher' ? '老師' : userType === 'student' ? '學生' : '管理員'}帳戶
          </h3>
        </div>

        {error && (
          <div className="mb-4 bg-[#FFE0E0] border border-[#FF6B6B] text-[#A64B2A] px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {getFormFields().map((field) => (
            <div key={field.name}>
              {field.type === 'select' ? (
                <HanamiSelect
                  label={field.label}
                  options={field.options || []}
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
              ) : (
                <HanamiInput
                  label={field.label}
                  placeholder={`請輸入${field.label}`}
                  required={field.required}
                  type={field.type as 'text' | 'email' | 'password' | 'tel' | 'number'}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <HanamiButton
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              取消
            </HanamiButton>
            <HanamiButton
              disabled={loading}
              type="submit"
              variant="primary"
            >
              {loading ? '處理中...' : (editingUser ? '更新' : '新增')}
            </HanamiButton>
          </div>
        </form>
      </HanamiCard>
    </div>
  );
} 