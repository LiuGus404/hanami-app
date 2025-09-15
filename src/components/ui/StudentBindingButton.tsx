'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Heart, HeartOff, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useParentId } from '@/hooks/useParentId';

interface StudentBindingButtonProps {
  studentId: string;
  studentName: string;
  studentOid?: string;
  institution?: string;
  isBound?: boolean;
  onBindingChange?: (isBound: boolean) => void;
  className?: string;
}

export default function StudentBindingButton({
  studentId,
  studentName,
  studentOid,
  institution = 'Hanami Music',
  isBound = false,
  onBindingChange,
  className = ''
}: StudentBindingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [bound, setBound] = useState(isBound);
  const parentId = useParentId();

  const handleBind = async () => {
    if (bound) {
      // 取消綁定
      await handleUnbind();
      return;
    }

    if (!parentId) {
      toast.error('請先登入');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/parent/bind-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          studentName,
          studentOid,
          institution,
          bindingType: 'parent',
          notes: `綁定 ${studentName} 到我的帳戶`,
          parentId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBound(true);
        onBindingChange?.(true);
        toast.success('孩子綁定成功！', {
          icon: '❤️',
          style: {
            background: '#FFF9F2',
            color: '#4B4036',
            border: '1px solid #FFD59A',
          },
        });
      } else {
        toast.error(data.error || '綁定失敗', {
          icon: '❌',
          style: {
            background: '#FFE0E0',
            color: '#4B4036',
            border: '1px solid #FFB6C1',
          },
        });
      }
    } catch (error) {
      console.error('綁定孩子錯誤:', error);
      toast.error('綁定失敗，請稍後再試', {
        icon: '❌',
        style: {
          background: '#FFE0E0',
          color: '#4B4036',
          border: '1px solid #FFB6C1',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = async () => {
    if (!parentId) {
      toast.error('請先登入');
      return;
    }

    setLoading(true);
    try {
      // 首先獲取綁定 ID
      const response = await fetch(`/api/parent/bind-student?parentId=${parentId}`);
      const data = await response.json();
      
      if (data.success && data.bindings) {
        const binding = data.bindings.find((b: any) => b.student_id === studentId);
        
        if (binding) {
          const deleteResponse = await fetch(`/api/parent/bind-student?bindingId=${binding.id}&parentId=${parentId}`, {
            method: 'DELETE',
          });
          
          const deleteData = await deleteResponse.json();
          
          if (deleteData.success) {
            setBound(false);
            onBindingChange?.(false);
            toast.success('取消綁定成功', {
              icon: '💔',
              style: {
                background: '#FFF9F2',
                color: '#4B4036',
                border: '1px solid #FFD59A',
              },
            });
          } else {
            toast.error(deleteData.error || '取消綁定失敗');
          }
        }
      }
    } catch (error) {
      console.error('取消綁定錯誤:', error);
      toast.error('取消綁定失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleBind}
      disabled={loading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${bound
          ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-[#4B4036] hover:from-[#FFD59A] hover:to-[#FFB6C1]'
          : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:from-[#EBC9A4] hover:to-[#FFD59A]'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-lg hover:shadow-xl
        ${className}
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4B4036]"></div>
      ) : bound ? (
        <>
          <Heart className="w-4 h-4 fill-current" />
          <span>已綁定</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>綁定孩子</span>
        </>
      )}
    </motion.button>
  );
}

// 綁定狀態指示器組件
export function BindingStatusIndicator({ isBound, className = '' }: { isBound: boolean; className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isBound ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 font-medium">已綁定</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">未綁定</span>
        </>
      )}
    </div>
  );
}
