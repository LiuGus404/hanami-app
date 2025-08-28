'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreePine, Star, Lock, CheckCircle, Target, TrendingUp, Award } from 'lucide-react';

// 型別定義
interface GrowthNode {
  id: string;
  name: string;
  description?: string;
  level: number;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  prerequisites: string[];
  icon?: string;
  color?: string;
}

interface GrowthTreeData {
  id: string;
  tree_name: string;
  tree_description?: string;
  tree_icon?: string;
  nodes: GrowthNode[];
  totalProgress: number;
  currentLevel: number;
}

interface GrowthTreeVisualizationProps {
  studentId: string;
  treeData: GrowthTreeData[];
  className?: string;
  variant?: 'compact' | 'detailed' | 'full';
  onNodeClick?: (node: GrowthNode) => void;
}

// 樹狀結構佈局計算
const calculateTreeLayout = (nodes: GrowthNode[]) => {
  const levels = Math.max(...nodes.map(n => n.level)) + 1;
  const layout: { [key: number]: GrowthNode[] } = {};
  
  // 按等級分組
  nodes.forEach(node => {
    if (!layout[node.level]) layout[node.level] = [];
    layout[node.level].push(node);
  });
  
  return { levels, layout };
};

// 單個樹節點組件
const TreeNode: React.FC<{
  node: GrowthNode;
  position: { x: number; y: number };
  variant: string;
  onClick?: (node: GrowthNode) => void;
}> = ({ node, position, variant, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const nodeVariants = {
    locked: {
      scale: 0.8,
      opacity: 0.4,
      filter: 'grayscale(100%)'
    },
    unlocked: {
      scale: 1,
      opacity: 1,
      filter: 'grayscale(0%)'
    },
    completed: {
      scale: 1.1,
      opacity: 1,
      filter: 'grayscale(0%)',
      boxShadow: '0 0 20px rgba(255, 215, 154, 0.6)'
    },
    hover: {
      scale: 1.15,
      y: -5,
      transition: { duration: 0.2 }
    }
  };

  const getNodeState = () => {
    if (node.isCompleted) return 'completed';
    if (node.isUnlocked) return 'unlocked';
    return 'locked';
  };

  const getNodeIcon = () => {
    if (node.isCompleted) return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (!node.isUnlocked) return <Lock className="w-6 h-6 text-gray-400" />;
    return <Target className="w-6 h-6 text-hanami-primary" />;
  };

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
      variants={nodeVariants}
      initial={getNodeState()}
      animate={isHovered ? 'hover' : getNodeState()}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick?.(node)}
    >
      {/* 主節點 */}
      <div className={`
        relative w-16 h-16 rounded-full border-4 flex items-center justify-center
        ${node.isCompleted 
          ? 'bg-gradient-to-br from-[#FFE4B5] to-[#FFD700] border-[#FFC107] shadow-lg shadow-yellow-200'
          : node.isUnlocked 
            ? 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] border-[#FFB6C1] shadow-lg shadow-pink-200'
            : 'bg-gradient-to-br from-[#F5F5F5] to-[#E8E8E8] border-[#D1D5DB]'
        }
        transition-all duration-300
      `}>
        {getNodeIcon()}
        
        {/* 進度環 */}
        {node.isUnlocked && !node.isCompleted && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="28"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="3"
              fill="none"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="28"
              stroke="white"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 28 * (1 - (node.progress / node.maxProgress))
              }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </svg>
        )}
      </div>

      {/* 節點標籤 */}
      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-xs font-medium text-hanami-text whitespace-nowrap px-2 py-1 bg-white rounded shadow-sm">
          {node.name}
        </div>
        {variant === 'detailed' && (
          <div className="text-xs text-hanami-text-secondary mt-1">
            {node.progress}/{node.maxProgress}
          </div>
        )}
      </div>

      {/* 懸停詳細資訊 */}
      <AnimatePresence>
        {isHovered && variant !== 'compact' && (
          <motion.div
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-48 p-3 bg-white rounded-lg shadow-xl border border-hanami-border z-10"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="font-bold text-hanami-text text-sm mb-1">{node.name}</h4>
            {node.description && (
              <p className="text-xs text-hanami-text-secondary mb-2">{node.description}</p>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-hanami-text">進度</span>
              <span className="font-medium text-hanami-primary">
                {Math.round((node.progress / node.maxProgress) * 100)}%
              </span>
            </div>
            {!node.isUnlocked && node.prerequisites.length > 0 && (
              <div className="mt-2 pt-2 border-t border-hanami-border">
                <p className="text-xs text-gray-500">需要完成：</p>
                <p className="text-xs text-hanami-text-secondary">
                  {node.prerequisites.join(', ')}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 連接線組件
const TreeConnection: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive: boolean;
}> = ({ from, to, isActive }) => {
  const pathVariants = {
    inactive: {
      pathLength: 0,
      opacity: 0.3,
      stroke: '#E5E7EB'
    },
    active: {
      pathLength: 1,
      opacity: 0.8,
      stroke: '#FFD59A'
    }
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <motion.path
        d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${from.y - 30} ${to.x} ${to.y}`}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        variants={pathVariants}
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
    </svg>
  );
};

export default function GrowthTreeVisualization({
  studentId,
  treeData,
  className = '',
  variant = 'detailed',
  onNodeClick
}: GrowthTreeVisualizationProps) {
  const [selectedTree, setSelectedTree] = useState<GrowthTreeData | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (treeData.length > 0) {
      setSelectedTree(treeData[0]);
    }
  }, [treeData]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 1500);
    return () => clearTimeout(timer);
  }, [selectedTree]);

  if (!selectedTree) {
    return (
      <div className={`p-6 text-center ${className}`}>
                        <TreePine className="w-12 h-12 mx-auto text-hanami-text-secondary mb-4" />
        <p className="text-hanami-text-secondary">尚未設置成長樹</p>
      </div>
    );
  }

  const { levels, layout } = calculateTreeLayout(selectedTree.nodes);
  const containerHeight = levels * 120 + 100;
  const containerWidth = Math.max(...Object.values(layout).map(nodes => nodes.length)) * 120 + 100;

  return (
    <div className={`bg-gradient-to-br from-hanami-background to-hanami-surface rounded-2xl p-6 ${className}`}>
      {/* 樹選擇器 */}
      {treeData.length > 1 && (
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {treeData.map((tree) => (
              <motion.button
                key={tree.id}
                onClick={() => setSelectedTree(tree)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                  ${selectedTree.id === tree.id
                    ? 'bg-hanami-primary text-hanami-text'
                    : 'bg-hanami-surface text-hanami-text-secondary hover:bg-hanami-primary/20'
                  }
                  transition-colors
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tree.tree_name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 樹標題和統計 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-hanami-text flex items-center">
                            <TreePine className="w-6 h-6 mr-2 text-hanami-primary" />
            {selectedTree.tree_name}
          </h3>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-hanami-text-secondary">總進度</div>
              <div className="text-lg font-bold text-hanami-primary">
                {selectedTree.totalProgress}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-hanami-text-secondary">當前等級</div>
              <div className="text-lg font-bold text-hanami-accent">
                Lv.{selectedTree.currentLevel}
              </div>
            </div>
          </div>
        </div>

        {selectedTree.tree_description && (
          <p className="text-hanami-text-secondary text-sm">{selectedTree.tree_description}</p>
        )}
      </div>

      {/* 樹狀視覺化區域 */}
      <div className="relative bg-gradient-to-br from-[#FFFCF0] via-white to-[#FFF9F5] rounded-xl p-3 sm:p-6 overflow-auto max-h-96 sm:max-h-[500px] border border-[#FFE4E6]" style={{ 
        minHeight: Math.min(containerHeight, 300)
      }}>
        <div className="relative" style={{ 
          width: containerWidth, 
          height: containerHeight,
          minWidth: '100%'
        }}>
          {/* 渲染連接線 */}
          {Object.entries(layout).map(([levelStr, nodes]) => {
            const level = parseInt(levelStr);
            if (level === levels - 1) return null; // 最後一層不需要連接線
            
            return nodes.map((node, nodeIndex) => {
              const nextLevelNodes = layout[level + 1] || [];
              const fromX = (nodeIndex + 1) * (containerWidth / (nodes.length + 1));
              const fromY = (level + 1) * 120;
              
              return nextLevelNodes.map((nextNode, nextIndex) => {
                if (!nextNode.prerequisites.includes(node.id)) return null;
                
                const toX = (nextIndex + 1) * (containerWidth / (nextLevelNodes.length + 1));
                const toY = (level + 2) * 120;
                
                return (
                  <TreeConnection
                    key={`${node.id}-${nextNode.id}`}
                    from={{ x: fromX, y: fromY }}
                    to={{ x: toX, y: toY }}
                    isActive={node.isCompleted && animationComplete}
                  />
                );
              });
            });
          })}

          {/* 渲染節點 */}
          {Object.entries(layout).map(([levelStr, nodes]) => {
            const level = parseInt(levelStr);
            return nodes.map((node, index) => {
              const x = (index + 1) * (containerWidth / (nodes.length + 1));
              const y = (level + 1) * 120;
              
              return (
                <TreeNode
                  key={node.id}
                  node={node}
                  position={{ x, y }}
                  variant={variant}
                  onClick={onNodeClick}
                />
              );
            });
          })}
        </div>
      </div>

      {/* 圖例 */}
      {variant !== 'compact' && (
        <div className="mt-4 flex justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-300" />
            <span className="text-hanami-text-secondary">未解鎖</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-hanami-primary border-2 border-hanami-primary" />
            <span className="text-hanami-text-secondary">進行中</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-300 border-2 border-yellow-500" />
            <span className="text-hanami-text-secondary">已完成</span>
          </div>
        </div>
      )}
    </div>
  );
}
