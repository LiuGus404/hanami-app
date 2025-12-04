'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

export type MessageStatus = 'queued' | 'processing' | 'completed' | 'error' | 'cancelled' | 'sent';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  compact?: boolean; // 緊湊模式（只顯示圖標）
  className?: string;
}

export function MessageStatusIndicator({
  status,
  compact = false,
  className = ''
}: MessageStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'queued':
        return {
          icon: ClockIcon,
          text: '排隊中',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          animate: false
        };
      case 'processing':
        return {
          icon: CpuChipIcon,
          text: 'AI 處理中',
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          animate: true
        };
      case 'completed':
        return {
          icon: CheckCircleIcon,
          text: '已完成',
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          animate: false
        };
      case 'sent':
        return {
          icon: CheckCircleIcon,
          text: '已發送',
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          animate: false
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          text: '發送失敗',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          animate: false
        };
      case 'cancelled':
        return {
          icon: ExclamationTriangleIcon,
          text: '已取消',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          animate: false
        };
      default:
        return {
          icon: ClockIcon,
          text: '未知狀態',
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <motion.div
        className={`inline-flex items-center ${config.color} ${className}`}
        animate={config.animate ? { rotate: 360 } : {}}
        transition={config.animate ? {
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        } : {}}
        title={config.text}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${config.bgColor} ${config.color} ${className}`}
    >
      <motion.div
        animate={config.animate ? { rotate: 360 } : {}}
        transition={config.animate ? {
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        } : {}}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
      <span className="text-xs font-medium">{config.text}</span>
    </motion.div>
  );
}

// 簡化版：只顯示圖標的組件
export function MessageStatusIcon({
  status,
  className = ''
}: {
  status: MessageStatus;
  className?: string;
}) {
  return <MessageStatusIndicator status={status} compact className={className} />;
}
