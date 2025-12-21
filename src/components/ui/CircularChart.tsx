'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CircularChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  value?: string | number;
  showLabel?: boolean;
  animationDuration?: number;
  className?: string;
}

export function CircularChart({
  percentage,
  size = 120,
  strokeWidth = 12,
  color = '#FFB6C1',
  backgroundColor = '#EADBC8',
  label,
  value,
  showLabel = true,
  animationDuration = 1.5,
  className = ''
}: CircularChartProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* 背景圓 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          {/* 進度圓 */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: animationDuration, ease: 'easeOut' }}
          />
        </svg>
        {/* 中心文字 */}
        {showLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {value !== undefined && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: animationDuration * 0.5 }}
                className="text-2xl font-bold text-[#4B4036]"
              >
                {value}
              </motion.div>
            )}
            {label && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: animationDuration * 0.7 }}
                className="text-xs text-[#2B3A3B] mt-1"
              >
                {label}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  showLegend?: boolean;
  className?: string;
}

export function PieChart({
  data,
  size = 200,
  showLegend = true,
  className = ''
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // 從頂部開始

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    // 計算 SVG 路徑
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    return {
      ...item,
      pathData,
      percentage,
      startAngle,
      endAngle
    };
  });

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {segments.map((segment, index) => (
            <motion.path
              key={index}
              d={segment.pathData}
              fill={segment.color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                type: 'spring',
                stiffness: 100
              }}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
        </svg>
      </div>
      {showLegend && (
        <div className="mt-4 space-y-2 w-full">
          {segments.map((segment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-[#2B3A3B]">{segment.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#4B4036]">
                  {segment.value.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">
                  ({segment.percentage.toFixed(1)}%)
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}



























