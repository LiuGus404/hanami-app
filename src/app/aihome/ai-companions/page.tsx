'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Bars3Icon, 
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  PlusIcon,
  ClockIcon,
  CpuChipIcon,
  XMarkIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  HeartIcon,
  ArrowPathIcon,
  UserIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSaasSupabaseClient } from '@/lib/supabase';
import Image from 'next/image';
import UsageStatsDisplay from '@/components/ai-companion/UsageStatsDisplay';

interface AIRoom {
  id: string;
  title: string;
  description: string;
  lastMessage: string;
  lastActivity: Date;
  memberCount: number;
  activeRoles: string[];
  messageCount: number;
  status: 'active' | 'archived';
}

interface AICompanion {
  id: 'hibi' | 'mori' | 'pico';
  name: string;
  nameEn: string;
  description: string;
  specialty: string;
  icon: any;
  imagePath: string;
  personality: string;
  abilities: string[];
  color: string;
  status: 'online' | 'busy' | 'offline';
  isManager?: boolean;
}

// 安全的 JSON 解析函數
const safeJsonParse = async (response: Response, context: string = 'API') => {
  try {
    const responseText = await response.text();
    console.log(`🔍 ${context} 原始響應文本:`, responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.log(`⚠️ ${context} 收到空響應`);
      return { success: false, error: 'Empty response' };
    }
    
    return JSON.parse(responseText);
  } catch (jsonError) {
    console.error(`❌ ${context} JSON 解析失敗:`, jsonError);
    return { success: false, error: 'Invalid JSON response', details: jsonError instanceof Error ? jsonError.message : String(jsonError) };
  }
};

// 獲取用戶有權訪問的房間 ID 列表（應用層權限檢查）
const getUserAccessibleRoomIds = async (userId: string): Promise<string> => {
  try {
    const saasSupabase = getSaasSupabaseClient();
    const { data: memberRooms, error } = await saasSupabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId);
    
    if (error || !memberRooms) {
      console.log('🔍 用戶沒有額外的房間成員身份');
      return '';
    }
    
    const roomIds = memberRooms.map((rm: any) => rm.room_id).join(',');
    console.log('🔍 用戶參與的房間 ID:', roomIds);
    return roomIds;
  } catch (error) {
    console.error('❌ 獲取房間成員身份失敗:', error);
    return '';
  }
};

export default function AICompanionsPage() {
  const { user } = useSaasAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'roles' | 'memory' | 'stats'>('chat');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<AIRoom | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<AICompanion | null>(null);

  // 聊天室資料 - 從資料庫載入
  const [rooms, setRooms] = useState<AIRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creatingChat, setCreatingChat] = useState<string | null>(null); // 正在創建聊天室的 companion ID
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [selectedCompanionForProject, setSelectedCompanionForProject] = useState<AICompanion | null>(null);
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false);

  // 從 Supabase 載入用戶的聊天室
  const loadUserRooms = async () => {
    if (!user?.id) return;

    const saasSupabase = getSaasSupabaseClient();

    try {
      setLoadingRooms(true);
      
      console.log('🔍 開始載入聊天室，用戶 ID:', user.id);
      
      // 方法 1: 載入用戶創建的聊天室（簡化權限檢查）
      const { data: allRooms, error: allRoomsError } = await saasSupabase
        .from('ai_rooms')
        .select('id, title, description, room_type, last_message_at, created_at, created_by')
        .eq('is_archived', false)
        .eq('created_by', user.id)  // 只載入用戶創建的房間
        .order('last_message_at', { ascending: false })
        .limit(20) as { data: any[] | null; error: any };

      if (allRoomsError) {
        console.error('❌ 載入聊天室失敗:', allRoomsError);
        console.log('🔧 嘗試不含角色的基本查詢...');
        
        // 方法 2: 不含角色資料的基本查詢
        const { data: basicRooms, error: basicError } = await saasSupabase
          .from('ai_rooms')
          .select('id, title, description, room_type, last_message_at, created_at, created_by')
          .eq('is_archived', false)
          .order('last_message_at', { ascending: false })
          .limit(20) as { data: any[] | null; error: any };
          
        if (basicError) {
          console.error('❌ 基本查詢也失敗:', basicError);
          console.log('📝 這表示權限或表格配置有問題');
          setRooms([]);
          setLoadingRooms(false);
          return;
        } else {
          console.log('✅ 基本查詢成功，將使用備用邏輯處理角色');
          // 使用基本查詢的結果，但沒有 role_instances 資料
          if (basicRooms && basicRooms.length > 0) {
            const userRelatedRooms = basicRooms.filter(room => 
              room.created_by === user.id || 
              room.title.includes('測試')
            );
            
            console.log('🎯 用戶相關聊天室:', userRelatedRooms.length, '個');
            
            // 處理沒有 role_instances 的房間
            const roomsWithStats = await Promise.all(userRelatedRooms.map(async (room) => {
              // 沒有資料庫角色資料，使用標題/描述推斷
              let activeRoles: string[] = [];
              
              console.log('處理房間（無角色資料）:', room.title, room.description);
              
              // 使用標題和描述推斷角色
              if (room.title.includes('Hibi')) activeRoles.push('Hibi');
              if (room.title.includes('墨墨') || room.title.includes('Mori')) activeRoles.push('墨墨');
              if (room.title.includes('皮可') || room.title.includes('Pico')) activeRoles.push('皮可');
              
              if (room.description?.includes('Hibi') && !activeRoles.includes('Hibi')) activeRoles.push('Hibi');
              if ((room.description?.includes('墨墨') || room.description?.includes('Mori')) && !activeRoles.includes('墨墨')) activeRoles.push('墨墨');
              if ((room.description?.includes('皮可') || room.description?.includes('Pico')) && !activeRoles.includes('皮可')) activeRoles.push('皮可');
              
              // 如果仍然沒有角色，嘗試從 sessionStorage 獲取
              if (activeRoles.length === 0 && typeof window !== 'undefined') {
                const sessionKey = `room_${room.id}_roles`;
                const sessionRoles = sessionStorage.getItem(sessionKey);
                if (sessionRoles) {
                  try {
                    const parsedRoles = JSON.parse(sessionRoles);
                    if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
                      // 將 sessionStorage 中的角色 ID 轉換為顯示名稱
                      activeRoles = parsedRoles.map(roleId => {
                        if (roleId === 'hibi') return 'Hibi';
                        if (roleId === 'mori') return '墨墨';
                        if (roleId === 'pico') return '皮可';
                        return roleId;
                      });
                      console.log('📱 從 sessionStorage 恢復角色:', activeRoles);
                    }
                  } catch (error) {
                    console.log('⚠️ sessionStorage 解析失敗:', error);
                  }
                }
                
                // 最後的預設邏輯
                if (activeRoles.length === 0) {
                  activeRoles = ['墨墨'];
                }
              }
              
              console.log('房間最終角色（備用邏輯）:', room.title, '→', activeRoles);
              
              // 載入該房間的最新訊息（備用邏輯）
              let lastMessage = '點擊進入對話...';
              let messageCount = 0;
              
              try {
                console.log('🔍 開始查詢房間訊息（備用）:', room.id, room.title);
                
                // 查詢最新訊息，包含 content_json 以檢查訊息類型
                const { data: latestMessage, error: messageError } = await saasSupabase
                  .from('ai_messages')
                  .select('content, content_json, created_at')
                  .eq('room_id', room.id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                
                console.log('🔍 查詢結果（備用）:', { latestMessage, messageError });
                
                if (!messageError && latestMessage) {
                  const content = (latestMessage as any).content || '';
                  
                  // 檢查訊息類型
                  let messageType = 'text';
                  if ((latestMessage as any).content_json) {
                    try {
                      const contentJson = typeof (latestMessage as any).content_json === 'string' 
                        ? JSON.parse((latestMessage as any).content_json) 
                        : (latestMessage as any).content_json;
                      messageType = contentJson.type || 'text';
                    } catch (e) {
                      // JSON 解析失敗，使用內容分析
                      messageType = 'text';
                    }
                  }
                  
                  // 如果 content_json 沒有類型信息，通過內容分析判斷
                  if (messageType === 'text') {
                    // 檢查是否為圖片訊息
                    if (content.includes('image_url') || 
                        content.includes('🎨') || 
                        content.includes('創作完成') ||
                        content.includes('圖片') ||
                        content.match(/https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i)) {
                      messageType = 'image';
                    }
                    // 檢查是否為影片訊息
                    else if (content.includes('video_url') || 
                             content.includes('🎬') ||
                             content.includes('影片') ||
                             content.match(/https?:\/\/.*\.(mp4|avi|mov|wmv|webm)/i)) {
                      messageType = 'video';
                    }
                  }
                  
                  // 根據訊息類型設置顯示文字
                  if (messageType === 'image') {
                    lastMessage = '（圖片）';
                  } else if (messageType === 'video') {
                    lastMessage = '（影片）';
                  } else {
                    // 文字訊息：截取內容（最多50個字符）
                    lastMessage = content.length > 50 
                      ? content.substring(0, 50) + '...' 
                      : content;
                  }
                  
                  console.log('✅ 載入最新訊息（備用）:', room.title, '→', lastMessage, `(類型: ${messageType})`);
                } else {
                  console.log('⚠️ 未找到該房間的訊息（備用）:', room.title, messageError?.message);
                }

                // 查詢訊息總數
                const { count, error: countError } = await saasSupabase
                  .from('ai_messages')
                  .select('*', { count: 'exact', head: true })
                  .eq('room_id', room.id);
                
                if (!countError && count !== null) {
                  messageCount = count;
                  console.log('✅ 載入訊息數量（備用）:', room.title, '→', messageCount);
                }
              } catch (error) {
                console.log('⚠️ 載入訊息資料時發生錯誤（備用）:', error);
              }
              
              return {
                id: room.id,
                title: room.title,
                description: room.description || '',
                lastMessage: lastMessage,
                lastActivity: new Date(room.last_message_at),
                memberCount: 1,
                activeRoles,
                messageCount: messageCount,
                status: 'active' as const
              };
            }));
            
            setRooms(roomsWithStats);
            console.log('✅ 載入了', roomsWithStats.length, '個聊天室（使用備用邏輯）');
          } else {
            setRooms([]);
          }
          setLoadingRooms(false);
          return;
        }
      } else {
        console.log('✅ 成功載入聊天室:', allRooms?.length || 0, '個');
        
        if (allRooms && allRooms.length > 0) {
          // 篩選用戶相關的聊天室（前端篩選）
          const userRelatedRooms = allRooms.filter(room => 
            room.created_by === user.id || 
            room.title.includes('測試') // 暫時包含測試聊天室
          );
          
          console.log('🎯 用戶相關聊天室:', userRelatedRooms.length, '個');
          
          // 處理聊天室資料
          if (userRelatedRooms.length > 0) {
            // 為每個房間查詢角色資料
            const roomsWithStats = await Promise.all(userRelatedRooms.map(async (room) => {
              // 從資料庫獲取的實際角色資料
              let activeRoles: string[] = [];
              
              // 調試日誌
              console.log('處理房間:', room.title);
              
              // 查詢該房間的角色資料（三步查詢避免關聯問題）
              try {
                // 第一步：查 room_roles 取得 role_instance_id
                const { data: roomRoleLinks, error: roomRolesError } = await saasSupabase
                  .from('room_roles')
                  .select('role_instance_id')
                  .eq('room_id', room.id)
                  .eq('is_active', true);
                
                if (roomRolesError) {
                  console.log('⚠️ 查詢房間角色關聯失敗:', roomRolesError.message);
                } else if (roomRoleLinks && roomRoleLinks.length > 0) {
                  const roleInstanceIds = roomRoleLinks.map((r: any) => r.role_instance_id).filter(Boolean);
                  
                  // 第二步：查 role_instances 取得 role_id
                  const { data: roleInstances, error: roleInstancesError } = await saasSupabase
                    .from('role_instances')
                    .select('id, role_id, nickname')
                    .in('id', roleInstanceIds);
                  
                  if (roleInstancesError) {
                    console.log('⚠️ 查詢角色實例失敗:', roleInstancesError.message);
                  } else if (roleInstances && roleInstances.length > 0) {
                    const roleIds = roleInstances.map((ri: any) => ri.role_id).filter(Boolean);
                    
                    // 第三步：查 ai_roles 取得角色資訊
                    const { data: aiRoles, error: aiRolesError } = await saasSupabase
                      .from('ai_roles')
                      .select('id, name, slug')
                      .in('id', roleIds);
                    
                    if (aiRolesError) {
                      console.log('⚠️ 查詢 AI 角色失敗:', aiRolesError.message);
                    } else if (aiRoles && aiRoles.length > 0) {
                      console.log('✅ 找到角色資料:', aiRoles.length, '個');
                      activeRoles = roleInstances
                        .map((instance: any) => {
                          const aiRole = aiRoles.find((ar: any) => ar.id === instance.role_id);
                          if (!aiRole) return null;
                      
                          const roleName = (aiRole as any).name || instance.nickname;
                          // 標準化角色名稱
                          if (roleName === 'Hibi' || roleName?.includes('Hibi')) return 'Hibi';
                          if (roleName === 'Mori' || roleName?.includes('墨墨') || roleName?.includes('Mori')) return '墨墨';
                          if (roleName === 'Pico' || roleName?.includes('皮可') || roleName?.includes('Pico')) return '皮可';
                          return roleName; // 保持原名稱
                        })
                        .filter(Boolean); // 移除空值
                    }
                  }
                }
              } catch (error) {
                console.log('⚠️ 查詢角色資料時發生錯誤:', error);
              }
              
              // 如果資料庫中沒有角色資料，使用備用邏輯
              if (activeRoles.length === 0) {
                console.log('⚠️ 資料庫中沒有角色資料，嘗試從 sessionStorage 獲取');
                
                // 先嘗試從 sessionStorage 獲取
                if (typeof window !== 'undefined') {
                  const sessionKey = `room_${room.id}_roles`;
                  const sessionRoles = sessionStorage.getItem(sessionKey);
                  if (sessionRoles) {
                    try {
                      const parsedRoles = JSON.parse(sessionRoles);
                      if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
                        // 將 sessionStorage 中的角色 ID 轉換為顯示名稱
                        activeRoles = parsedRoles.map(roleId => {
                          if (roleId === 'hibi') return 'Hibi';
                          if (roleId === 'mori') return '墨墨';
                          if (roleId === 'pico') return '皮可';
                          return roleId;
                        });
                        console.log('📱 從 sessionStorage 恢復角色:', activeRoles);
                      }
                    } catch (error) {
                      console.log('⚠️ sessionStorage 解析失敗:', error);
                    }
                  }
                }
                
                // 如果 sessionStorage 也沒有，使用標題/描述推斷
                if (activeRoles.length === 0) {
                  console.log('🔍 使用標題/描述推斷角色');
                  
                  // 基於房間標題推斷角色（與聊天室頁面保持一致）
                  const roomTitle = room.title?.toLowerCase() || '';
                  
                  if (roomTitle.includes('繪本') || roomTitle.includes('圖') || roomTitle.includes('創作') || roomTitle.includes('設計') || 
                      roomTitle.includes('畫') || roomTitle.includes('藝術') || roomTitle.includes('美術') || roomTitle.includes('視覺') ||
                      roomTitle.includes('插畫') || roomTitle.includes('繪畫') || roomTitle.includes('圖像') || roomTitle.includes('視覺化')) {
                    activeRoles.push('皮可');
                  } else if (roomTitle.includes('研究') || roomTitle.includes('分析') || roomTitle.includes('調查') || 
                             roomTitle.includes('資料') || roomTitle.includes('資訊') || roomTitle.includes('知識') || 
                             roomTitle.includes('學習') || roomTitle.includes('探索') || roomTitle.includes('能力') ||
                             roomTitle.includes('成長') || roomTitle.includes('發展') || roomTitle.includes('評估') ||
                             roomTitle.includes('教學') || roomTitle.includes('教育') || roomTitle.includes('課程')) {
                    activeRoles.push('墨墨');
                  } else if (roomTitle.includes('統籌') || roomTitle.includes('協作') || roomTitle.includes('管理') || 
                             roomTitle.includes('專案') || roomTitle.includes('計劃') || roomTitle.includes('規劃') ||
                             roomTitle.includes('團隊') || roomTitle.includes('合作') || roomTitle.includes('整合') ||
                             roomTitle.includes('組織') || roomTitle.includes('安排') || roomTitle.includes('協調')) {
                    activeRoles.push('Hibi');
                  }
                  
                  // 檢查標題中的角色名稱
                  if (room.title.includes('Hibi') && !activeRoles.includes('Hibi')) activeRoles.push('Hibi');
                  if ((room.title.includes('墨墨') || room.title.includes('Mori')) && !activeRoles.includes('墨墨')) activeRoles.push('墨墨');
                  if ((room.title.includes('皮可') || room.title.includes('Pico')) && !activeRoles.includes('皮可')) activeRoles.push('皮可');
                  
                  // 檢查描述中的角色
                  if (room.description?.includes('Hibi') && !activeRoles.includes('Hibi')) activeRoles.push('Hibi');
                  if ((room.description?.includes('墨墨') || room.description?.includes('Mori')) && !activeRoles.includes('墨墨')) activeRoles.push('墨墨');
                  if ((room.description?.includes('皮可') || room.description?.includes('Pico')) && !activeRoles.includes('皮可')) activeRoles.push('皮可');
                  
                  // 最後的預設邏輯：根據房間類型推斷
                  if (activeRoles.length === 0) {
                    const isPersonalChat = room.title.includes('與') && room.title.includes('的對話');
                    if (isPersonalChat) {
                      activeRoles = ['墨墨']; // 個人對話預設為墨墨
                    } else {
                      activeRoles = ['墨墨']; // 未知房間預設為墨墨（避免顯示全部角色）
                    }
                  }
                }
              }

              // 調試日誌 - 最終角色
              console.log('房間最終角色:', room.title, '→', activeRoles);

              // 載入該房間的最新訊息
              let lastMessage = '點擊進入對話...';
              let messageCount = 0;
              
              try {
                console.log('🔍 開始查詢房間訊息:', room.id, room.title);
                
                // 先查詢該房間是否有任何訊息
                const { count: totalMessages } = await saasSupabase
                  .from('ai_messages')
                  .select('*', { count: 'exact', head: true })
                  .eq('room_id', room.id);
                
                console.log('🔍 該房間總訊息數:', totalMessages);
                
                if (totalMessages && totalMessages > 0) {
                  // 查詢最新訊息，包含 content_json 以檢查訊息類型
                  const { data: latestMessage, error: messageError } = await saasSupabase
                    .from('ai_messages')
                    .select('content, content_json, created_at')
                    .eq('room_id', room.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                  
                  console.log('🔍 查詢結果:', { latestMessage, messageError });
                  
                  if (!messageError && latestMessage) {
                    const content = (latestMessage as any).content || '';
                    
                    // 檢查訊息類型
                    let messageType = 'text';
                    if ((latestMessage as any).content_json) {
                      try {
                        const contentJson = typeof (latestMessage as any).content_json === 'string' 
                          ? JSON.parse((latestMessage as any).content_json) 
                          : (latestMessage as any).content_json;
                        messageType = contentJson.type || 'text';
                      } catch (e) {
                        // JSON 解析失敗，使用內容分析
                        messageType = 'text';
                      }
                    }
                    
                    // 如果 content_json 沒有類型信息，通過內容分析判斷
                    if (messageType === 'text') {
                      // 檢查是否為圖片訊息
                      if (content.includes('image_url') || 
                          content.includes('🎨') || 
                          content.includes('創作完成') ||
                          content.includes('圖片') ||
                          content.match(/https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i)) {
                        messageType = 'image';
                      }
                      // 檢查是否為影片訊息
                      else if (content.includes('video_url') || 
                               content.includes('🎬') ||
                               content.includes('影片') ||
                               content.match(/https?:\/\/.*\.(mp4|avi|mov|wmv|webm)/i)) {
                        messageType = 'video';
                      }
                    }
                    
                    // 根據訊息類型設置顯示文字
                    if (messageType === 'image') {
                      lastMessage = '（圖片）';
                    } else if (messageType === 'video') {
                      lastMessage = '（影片）';
                    } else {
                      // 文字訊息：截取內容（最多50個字符）
                      lastMessage = content.length > 50 
                        ? content.substring(0, 50) + '...' 
                        : content;
                    }
                    
                    console.log('✅ 載入最新訊息:', room.title, '→', lastMessage, `(類型: ${messageType})`);
                  } else {
                    console.log('⚠️ 未找到該房間的訊息:', room.title, messageError?.message);
                  }
                } else {
                  console.log('⚠️ 該房間沒有訊息:', room.title);
                }

                // 查詢訊息總數
                const { count, error: countError } = await saasSupabase
                  .from('ai_messages')
                  .select('*', { count: 'exact', head: true })
                  .eq('room_id', room.id);
                
                if (!countError && count !== null) {
                  messageCount = count;
                  console.log('✅ 載入訊息數量:', room.title, '→', messageCount);
                }
              } catch (error) {
                console.log('⚠️ 載入訊息資料時發生錯誤:', error);
              }

              return {
                id: room.id,
                title: room.title,
                description: room.description || '',
                lastMessage: lastMessage,
                lastActivity: new Date(room.last_message_at),
                memberCount: 1,
                activeRoles,
                messageCount: messageCount,
                status: 'active' as const
              };
            }));

            setRooms(roomsWithStats);
            console.log(`✅ 載入了 ${roomsWithStats.length} 個聊天室`);
          } else {
            console.log('📝 沒有找到用戶相關的聊天室');
            setRooms([]);
          }
        } else {
          console.log('📝 沒有找到任何聊天室');
          setRooms([]);
        }
      }
    } catch (error) {
      console.error('❌ 載入聊天室錯誤:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  // 當用戶登入時載入聊天室
  useEffect(() => {
    if (user?.id) {
      loadUserRooms();
    }
  }, [user?.id]);

  // 點擊外部關閉移動端下拉菜單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileDropdown) {
        setShowMobileDropdown(false);
      }
    };

    if (showMobileDropdown && typeof document !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('click', handleClickOutside);
      }
    };
  }, [showMobileDropdown]);

  // 監聽聊天室更新通知
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rooms_need_refresh') {
        console.log('🔄 檢測到聊天室更新，重新載入...');
        loadUserRooms();
        // 清除標記
        if (typeof window !== 'undefined') {
          localStorage.removeItem('rooms_need_refresh');
        }
      }
    };

    const handleFocus = () => {
      // 當頁面重新獲得焦點時，檢查是否需要刷新
      if (typeof window !== 'undefined' && localStorage.getItem('rooms_need_refresh')) {
        console.log('🔄 頁面重新獲得焦點，檢測到更新通知');
        loadUserRooms();
        localStorage.removeItem('rooms_need_refresh');
      }
    };

    // 定期檢查 sessionStorage 變化（因為 sessionStorage 不會觸發跨頁面事件）
    const intervalId = setInterval(() => {
      if (rooms.length > 0 && typeof window !== 'undefined') {
        // 檢查是否有任何房間的 sessionStorage 資料更新了
        let needsRefresh = false;
        rooms.forEach(room => {
          const sessionKey = `room_${room.id}_roles`;
          const sessionRoles = sessionStorage.getItem(sessionKey);
          if (sessionRoles) {
            try {
              const parsedRoles = JSON.parse(sessionRoles);
              if (parsedRoles.length !== room.activeRoles.length) {
                needsRefresh = true;
              }
            } catch (error) {
              // 忽略解析錯誤
            }
          }
        });
        
        if (needsRefresh) {
          console.log('🔄 檢測到 sessionStorage 變化，重新載入聊天室...');
          loadUserRooms();
        }
      }
    }, 2000); // 每2秒檢查一次

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('focus', handleFocus);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('focus', handleFocus);
      }
      clearInterval(intervalId);
    };
  }, [rooms]);

  const companions: AICompanion[] = [
    {
      id: 'hibi',
      name: 'Hibi',
      nameEn: 'Hibi',
      description: '系統總管狐狸，智慧的協調者和統籌中樞，負責任務分配和團隊協作',
      specialty: '系統總管',
      icon: CpuChipIcon,
      imagePath: '/3d-character-backgrounds/studio/Hibi/Hibi.png',
      personality: '智慧、領導力、協調能力、友善',
      abilities: ['任務統籌', '團隊協調', '智能分析', '流程優化', '決策支援'],
      color: 'from-orange-400 to-red-500',
      status: 'online',
      isManager: true
    },
    {
      id: 'mori',
      name: '墨墨',
      nameEn: 'Mori',
      description: '一隻充滿智慧的貓頭鷹，專精於研究和學習',
      specialty: '研究專用',
      icon: AcademicCapIcon,
      imagePath: '/3d-character-backgrounds/studio/Mori/Mori.png',
      personality: '智慧、沉穩、博學',
      abilities: ['學術研究', '知識解答', '學習指導', '資料分析', '工作協助'],
      color: 'from-amber-400 to-orange-500',
      status: 'online'
    },
    {
      id: 'pico',
      name: '皮可',
      nameEn: 'Pico',
      description: '一隻熱愛繪畫創作的水瀨，專精於藝術創作',
      specialty: '繪圖專用',
      icon: PaintBrushIcon,
      imagePath: '/3d-character-backgrounds/studio/Pico/Pico.png',
      personality: '創意、活潑、藝術',
      abilities: ['繪畫創作', '視覺設計', '創意發想', '藝術指導', '工作設計'],
      color: 'from-blue-400 to-cyan-500',
      status: 'online'
    }
  ];

  const handleStartChat = (companion: AICompanion) => {
    console.log('🚀 開始對話按鈕被點擊:', companion.name);
    
    if (!user?.id) {
      console.error('❌ 用戶未登入，無法開始對話');
      return;
    }

    // 顯示專案資訊填寫模態框
    setSelectedCompanionForProject(companion);
    setShowProjectModal(true);
  };

  const handleCreateChatWithProject = async (projectData: { title: string; description: string }) => {
    if (!selectedCompanionForProject || !user?.id) return;

    const companion = selectedCompanionForProject;
    
    if (creatingChat === companion.id) {
      console.log('⏳ 正在創建聊天室，請稍候...');
      return;
    }

    setCreatingChat(companion.id);
    console.log('✅ 開始創建專案聊天室，專案:', projectData.title);

    try {
      // 在 Supabase 中創建專案聊天室（初始團隊成員：選中的角色）
      const saasSupabase = getSaasSupabaseClient();
      const { data: newRoom, error: roomError } = await (saasSupabase
        .from('ai_rooms') as any)
        .insert({
          title: projectData.title || `${companion.name} 專案`,
          description: projectData.description || `由 ${companion.name} 開始的專案協作空間`,
          room_type: 'project',
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('❌ 創建專案聊天室失敗:', roomError);
        
        // 如果是表格不存在的錯誤，直接跳轉到模擬聊天室
        if (roomError.message?.includes('relation') || roomError.message?.includes('does not exist')) {
          console.log('📝 資料庫表格未創建，使用模擬聊天室');
          const tempRoomId = `temp_${companion.id}_${Date.now()}`;
          router.push(`/aihome/ai-companions/chat/room/${tempRoomId}?companion=${companion.id}`);
        }
        return;
      }

      // 添加用戶為房間成員
      const { error: memberError } = await (saasSupabase
        .from('room_members') as any)
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          role: 'owner',
          user_type: 'hanami_user'
        });

      if (memberError) {
        // 如果是重複鍵錯誤，表示用戶已經存在，這是正常的
        if (memberError.code === '23505') {
          console.log('✅ 用戶已是房間成員（重複鍵錯誤）');
        } else {
          console.error('❌ 添加房間成員失敗:', memberError);
        }
      }

      // 為房間添加指定的 AI 角色
      try {
        console.log('🤖 為房間添加 AI 角色:', companion.id);
        
        // 首先查詢角色實例表，看看是否有對應的角色實例
        const { data: roleInstance, error: roleInstanceError } = await saasSupabase
          .from('role_instances')
          .select('id')
          .eq('ai_role_slug', companion.id)
          .single();
        
        if (roleInstanceError) {
          console.log('⚠️ 未找到角色實例，可能需要先創建:', roleInstanceError);
        } else if (roleInstance) {
          // 插入房間角色關聯
          const { error: roomRoleError } = await (saasSupabase
            .from('room_roles') as any)
            .insert({
              room_id: newRoom.id,
              role_instance_id: (roleInstance as any).id,
              is_active: true
            });
          
          if (roomRoleError) {
            console.error('❌ 添加房間角色失敗:', roomRoleError);
          } else {
            console.log('✅ 成功為房間添加角色:', companion.id);
          }
        }
      } catch (error) {
        console.error('❌ 添加房間角色時發生錯誤:', error);
      }

      // 創建前端顯示的房間物件
      const displayRoom: AIRoom = {
        id: newRoom.id,
        title: projectData.title || `${companion.name} 專案`,
        description: projectData.description || `由 ${companion.name} 開始的專案協作空間`,
        lastMessage: '專案已創建，歡迎開始協作！',
        lastActivity: new Date(),
        memberCount: 1,
        activeRoles: [companion.name],
        messageCount: 0,
        status: 'active'
      };
      
      setRooms(prev => [displayRoom, ...prev]);
      
      console.log('✅ 專案聊天室創建成功:', newRoom.id);
      
      // 直接跳轉到新創建的專案聊天室（初始團隊成員：選中的角色）
      const chatUrl = `/aihome/ai-companions/chat/room/${newRoom.id}?initialRole=${companion.id}`;
      console.log('🔄 準備跳轉到:', chatUrl);
      router.push(chatUrl);
    } catch (error) {
      console.error('❌ 創建專案聊天室錯誤:', error);
    } finally {
      setCreatingChat(null);
      setShowProjectModal(false);
      setSelectedCompanionForProject(null);
    }
  };

  // 快速開始協作 - 顯示角色選擇視窗
  const handleQuickCollaborate = () => {
    if (!user?.id) {
      console.error('❌ 用戶未登入，無法開始協作');
      return;
    }

    // 顯示角色選擇視窗
    setShowRoleSelectionModal(true);
  };

  // 創建團隊協作專案（從角色選擇視窗調用）
  const createTeamCollaborationProject = async (selectedRoles: string[]) => {
    if (!user?.id) {
      console.error('❌ 用戶未登入，無法開始協作');
      return;
    }

    try {
      setCreatingChat('team');
      console.log('✅ 開始創建團隊協作專案...', selectedRoles);

      const saasSupabase = getSaasSupabaseClient();
      
      // 創建團隊協作聊天室
      const { data: newRoom, error: roomError } = await (saasSupabase
        .from('ai_rooms') as any)
        .insert({
          title: '團隊協作專案',
          description: `${selectedRoles.join('、')}的協作空間`,
          room_type: 'project',
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('❌ 創建團隊協作專案失敗:', roomError);
        return;
      }

      // 添加用戶為房間成員
      const { error: memberError } = await (saasSupabase
        .from('room_members') as any)
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          role: 'owner',
          user_type: 'hanami_user'
        });

      if (memberError) {
        // 如果是重複鍵錯誤，表示用戶已經存在，這是正常的
        if (memberError.code === '23505') {
          console.log('✅ 用戶已是房間成員（重複鍵錯誤）');
        } else {
          console.error('❌ 添加房間成員失敗:', memberError);
        }
      }

      // 為每個選中的角色創建 room_roles 和 role_instances
      for (const roleName of selectedRoles) {
        // 將角色名稱映射到對應的 slug
        const roleNameToSlug: { [key: string]: string } = {
          'Hibi': 'hibi-manager',
          '墨墨': 'mori-researcher',
          '皮可': 'pico-artist'
        };
        
        const roleSlug = roleNameToSlug[roleName] || roleName.toLowerCase();
        
        // 首先獲取對應的 AI 角色 ID
        const { data: aiRole, error: aiRoleError } = await (saasSupabase
          .from('ai_roles') as any)
          .select('id, slug')
          .eq('slug', roleSlug)
          .single();

        if (aiRoleError || !aiRole) {
          console.error(`❌ 找不到 AI 角色: ${roleName}`, aiRoleError);
          continue;
        }

        // 先創建 role_instances 記錄
        const { data: roleInstance, error: roleInstanceError } = await (saasSupabase
          .from('role_instances') as any)
          .insert({
            room_id: newRoom.id,
            role_id: aiRole.id,
            is_active: true
          })
          .select()
          .single();

        if (roleInstanceError) {
          console.error(`❌ 創建 role_instances 失敗: ${roleName}`, roleInstanceError);
          continue;
        }

        // 創建 room_roles 記錄
        const { error: roomRoleError } = await (saasSupabase
          .from('room_roles') as any)
          .insert({
            room_id: newRoom.id,
            role_instance_id: roleInstance.id,
            is_active: true
          });

        if (roomRoleError) {
          console.error(`❌ 創建 room_roles 失敗: ${roleName}`, roomRoleError);
        } else {
          console.log(`✅ 成功添加角色到房間: ${roleName}`);
        }
      }

      // 創建前端顯示的房間物件
      const displayRoom: AIRoom = {
        id: newRoom.id,
        title: '團隊協作專案',
        description: `${selectedRoles.join('、')}的協作空間`,
        lastMessage: '團隊協作專案已創建，歡迎開始！',
        lastActivity: new Date(),
        memberCount: 1,
        activeRoles: selectedRoles,
        messageCount: 0,
        status: 'active'
      };
      
      setRooms(prev => [displayRoom, ...prev]);
      
      console.log('✅ 團隊協作專案創建成功:', newRoom.id);
      
      // 直接跳轉到新創建的聊天室
      const chatUrl = `/aihome/ai-companions/chat/room/${newRoom.id}`;
      console.log('🔄 準備跳轉到團隊協作專案:', chatUrl);
      router.push(chatUrl);
    } catch (error) {
      console.error('❌ 創建團隊協作專案錯誤:', error);
    } finally {
      setCreatingChat(null);
      setShowRoleSelectionModal(false);
    }
  };

  const handleCreateProjectRoom = async (roomData: { title: string; description: string; selectedRoles: string[] }) => {
    if (!user?.id) {
      console.error('❌ 用戶未登入，無法創建聊天室');
      return;
    }

    try {
      const saasSupabase = getSaasSupabaseClient();
      
      // 在 Supabase 中創建聊天室
      const { data: newRoom, error: roomError } = await (saasSupabase
        .from('ai_rooms') as any)
        .insert({
          title: roomData.title,
          description: roomData.description,
          room_type: 'project',
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('❌ 創建聊天室失敗:', roomError);
        
        // 如果是表格不存在的錯誤，直接跳轉到模擬聊天室
        if (roomError.message?.includes('relation') || roomError.message?.includes('does not exist')) {
          console.log('📝 資料庫表格未創建，使用模擬聊天室');
          const tempRoomId = `temp_project_${Date.now()}`;
          router.push(`/aihome/ai-companions/chat/room/${tempRoomId}`);
        }
        return;
      }

      // 添加用戶為房間成員
      const { error: memberError } = await (saasSupabase
        .from('room_members') as any)
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          role: 'owner',
          user_type: 'hanami_user'
        });

      if (memberError) {
        // 如果是重複鍵錯誤，表示用戶已經存在，這是正常的
        if (memberError.code === '23505') {
          console.log('✅ 用戶已是房間成員（重複鍵錯誤）');
        } else {
          console.error('❌ 添加房間成員失敗:', memberError);
        }
      }

      // 創建前端顯示的房間物件
      const displayRoom: AIRoom = {
        id: newRoom.id,
        title: roomData.title,
        description: roomData.description,
        lastMessage: '專案已創建，歡迎開始協作！',
        lastActivity: new Date(),
        memberCount: 1,
        activeRoles: roomData.selectedRoles,
        messageCount: 0,
        status: 'active'
      };
      
      setRooms(prev => [displayRoom, ...prev]);
      setSelectedRoom(displayRoom);
      setShowCreateRoom(false);
      
      console.log('✅ 聊天室創建成功:', newRoom.id);
      
      // 直接跳轉到新創建的專案協作室
      router.push(`/aihome/ai-companions/chat/room/${newRoom.id}`);
    } catch (error) {
      console.error('❌ 創建聊天室錯誤:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC]">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              {/* 選單按鈕 */}
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40 flex-shrink-0"
                title={sidebarOpen ? "關閉選單" : "開啟選單"}
              >
                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
              </motion.button>
              
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0">
                <Image
                  src="/@hanami.png"
                  alt="HanamiEcho Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="min-w-0 flex-1">
                {/* 桌面版：顯示完整標題 */}
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                  <p className="text-sm text-[#2B3A3B]">您的AI工作和學習夥伴</p>
                </div>
                
                {/* 移動端：只顯示 "AI 伙伴" */}
                <div className="block sm:hidden">
                  <h1 className="text-lg font-bold text-[#4B4036]">
                    AI 伙伴
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 桌面版：顯示完整的視圖切換和創建按鈕 */}
              <div className="hidden md:flex items-center space-x-4">
                {/* 視圖切換 */}
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-xl p-1">
                  {[
                    { id: 'chat', label: '聊天室', icon: ChatBubbleLeftRightIcon },
                    { id: 'roles', label: '角色', icon: CpuChipIcon },
                    { id: 'memory', label: '記憶', icon: SparklesIcon },
                    { id: 'stats', label: '統計', icon: ChartBarIcon }
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveView(tab.id as any)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                        activeView === tab.id 
                          ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg' 
                          : 'text-[#4B4036] hover:bg-[#FFD59A]/20'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* 快速創建專案按鈕 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const quickRoom = {
                      title: `AI 協作 ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`,
                      description: '與 Hibi、墨墨和皮可的全能協作空間',
                      selectedRoles: ['Hibi', '墨墨', '皮可']
                    };
                    handleCreateProjectRoom(quickRoom);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  title="快速開始 AI 協作"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>開始協作</span>
                </motion.button>
              </div>

              {/* 移動端/平板：合併按鈕 + 下拉菜單 */}
              <div className="flex md:hidden items-center space-x-2 relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMobileDropdown(!showMobileDropdown)}
                  className="relative flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  {/* 圖案 */}
                  <motion.div
                    animate={{ 
                      rotate: showMobileDropdown ? 180 : 0
                    }}
                    transition={{ 
                      duration: 0.3,
                      ease: "easeInOut"
                    }}
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                  </motion.div>
                  
                  {/* 兩個字的中文名稱 */}
                  <span className="text-sm font-medium">選單</span>
                </motion.button>

                {/* 下拉菜單 */}
                <AnimatePresence>
                  {showMobileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute top-12 right-0 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-[#EADBC8]/20 p-2 min-w-[200px] z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 視圖切換選項 */}
                      <div className="space-y-1 mb-2">
                        <div className="text-xs font-medium text-[#2B3A3B] px-3 py-1">切換視圖</div>
                        {[
                          { id: 'chat', label: '聊天室', icon: ChatBubbleLeftRightIcon },
                          { id: 'roles', label: '角色', icon: CpuChipIcon },
                          { id: 'memory', label: '記憶', icon: SparklesIcon },
                          { id: 'stats', label: '統計', icon: ChartBarIcon }
                        ].map((tab) => (
                          <motion.button
                            key={tab.id}
                            whileHover={{ backgroundColor: "#FFF9F2" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setActiveView(tab.id as any);
                              setShowMobileDropdown(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                              activeView === tab.id 
                                ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white' 
                                : 'text-[#4B4036] hover:bg-[#FFD59A]/20'
                            }`}
                          >
                            <tab.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{tab.label}</span>
                          </motion.button>
                        ))}
                      </div>

                      {/* 分隔線 */}
                      <div className="border-t border-[#EADBC8]/30 my-2"></div>

                      {/* 快速創建選項 */}
                      <motion.button
                        whileHover={{ backgroundColor: "#FFF9F2" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const quickRoom = {
                            title: `AI 協作 ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`,
                            description: '與 Hibi、墨墨和皮可的全能協作空間',
                            selectedRoles: ['Hibi', '墨墨', '皮可']
                          };
                          handleCreateProjectRoom(quickRoom);
                          setShowMobileDropdown(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all text-[#4B4036] hover:bg-green-50"
                      >
                        <PlusIcon className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">開始協作</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 側邊欄 */}
      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        currentPath="/aihome/ai-companions"
      />

      {/* 主要內容 */}
      <main className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {/* 聊天室視圖 */}
            {activeView === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <div className="flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-[#4B4036]">AI 協作聊天室</h1>
                  </div>
                  <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                    與 Hibi、墨墨和皮可三位 AI 助手協作，透過對話完成各種任務和專案
                  </p>
                  
                  {/* 刷新按鈕 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadUserRooms}
                    disabled={loadingRooms}
                    className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-[#EADBC8] rounded-xl text-[#4B4036] hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    <motion.div
                      animate={loadingRooms ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: loadingRooms ? Infinity : 0, ease: "linear" }}
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </motion.div>
                    <span>{loadingRooms ? '載入中...' : '重新載入'}</span>
                  </motion.button>
                </motion.div>

                {/* AI 伙伴歡迎區域 - 始終顯示，使用原始動態設計 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="flex justify-center space-x-3 mb-6">
                    {/* Hibi - 系統總管 */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                      className="relative"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full p-1 shadow-lg">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          <Image
                            src="/3d-character-backgrounds/studio/lulu(front).png"
                            alt="Hibi"
                            width={72}
                            height={72}
                            className="w-18 h-18 object-cover"
                          />
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-lg"
                      >
                        <CpuChipIcon className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>

                    {/* Mori - 研究員 */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-1 shadow-lg"
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Image
                          src="/3d-character-backgrounds/studio/Mori/Mori.png"
                          alt="墨墨"
                          width={72}
                          height={72}
                          className="w-18 h-18 object-cover"
                        />
                      </div>
                    </motion.div>

                    {/* Pico - 創作者 */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full p-1 shadow-lg"
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Image
                          src="/3d-character-backgrounds/studio/Pico/Pico.png"
                          alt="皮可"
                          width={72}
                          height={72}
                          className="w-18 h-18 object-cover"
                        />
                      </div>
                    </motion.div>
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-[#4B4036] mb-3">歡迎來到 AI 伙伴系統！</h3>
                  <p className="text-[#2B3A3B] mb-6 max-w-md mx-auto">
                    Hibi 系統總管和專業助手墨墨、皮可正在等待與您協作。創建專案開始智能對話，讓 AI 團隊幫您完成各種任務。
                  </p>
                  
                  {/* 快速開始按鈕 */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: creatingChat === 'team' ? 1 : 1.05 }}
                      whileTap={{ scale: creatingChat === 'team' ? 1 : 0.95 }}
                      onClick={handleQuickCollaborate}
                      disabled={creatingChat === 'team'}
                      className={`px-8 py-4 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ${
                        creatingChat === 'team' ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {creatingChat === 'team' ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>創建中...</span>
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="w-5 h-5" />
                            <span>立即開始協作</span>
                          </>
                        )}
                      </div>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateRoom(true)}
                      className="px-8 py-4 bg-white/70 backdrop-blur-sm border border-[#EADBC8] text-[#4B4036] rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <PlusIcon className="w-5 h-5" />
                        <span>自訂專案</span>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>

                {/* 聊天室列表 */}
                <div className="grid gap-6">
                  {/* 載入狀態 */}
                  {loadingRooms ? (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-[#FFD59A] border-t-transparent rounded-full mx-auto mb-4"
                      />
                      <p className="text-[#2B3A3B]">正在載入聊天室記錄...</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {rooms.map((room, index) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -15 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, y: -30, scale: 0.9 }}
                        transition={{ 
                          duration: 0.6, 
                          delay: index * 0.15,
                          type: "spring",
                          damping: 20,
                          stiffness: 300
                        }}
                        whileHover={{ 
                          y: -8, 
                          scale: 1.03,
                          rotateX: 2,
                          boxShadow: "0 25px 50px rgba(255, 182, 193, 0.2)"
                        }}
                        className="relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-[#EADBC8] cursor-pointer overflow-hidden group"
                        onClick={() => {
                          // 如果是個人對話，添加 companion 參數
                          const isPersonalChat = room.title.includes('與') && room.title.includes('的對話');
                          if (isPersonalChat) {
                            // 從標題中識別角色
                            let companionId = '';
                            if (room.title.includes('Hibi')) companionId = 'hibi';
                            else if (room.title.includes('墨墨')) companionId = 'mori';
                            else if (room.title.includes('皮可')) companionId = 'pico';
                            
                            router.push(`/aihome/ai-companions/chat/room/${room.id}${companionId ? `?companion=${companionId}` : ''}`);
                          } else {
                            router.push(`/aihome/ai-companions/chat/room/${room.id}`);
                          }
                        }}
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
                            <div className="flex-1">
                              {/* 標題區域 */}
                              <div className="flex items-center space-x-3 mb-3">
                                <motion.div
                                  animate={{ rotate: [0, 360] }}
                                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                  className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-md"
                                >
                                  <SparklesIcon className="w-4 h-4 text-white" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-[#4B4036] group-hover:text-[#FFB6C1] transition-colors">
                                  {room.title}
                                </h3>
                                <motion.div
                                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="w-3 h-3 bg-green-400 rounded-full shadow-sm"
                                />
                              </div>
                              
                              {/* 描述 */}
                              <p className="text-[#2B3A3B] mb-4 leading-relaxed">{room.description}</p>
                              
                              {/* 統計資訊 */}
                              <div className="flex items-center space-x-4 text-sm text-[#2B3A3B] mb-4">
                                <motion.div 
                                  whileHover={{ scale: 1.1 }}
                                  className="flex items-center space-x-1"
                                >
                                  <UserIcon className="w-4 h-4 text-[#FFB6C1]" />
                                  <span>{room.memberCount} 成員</span>
                                </motion.div>
                                <motion.div 
                                  whileHover={{ scale: 1.1 }}
                                  className="flex items-center space-x-1"
                                >
                                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-[#FFD59A]" />
                                  <span>{room.messageCount} 訊息</span>
                                </motion.div>
                                <motion.div 
                                  whileHover={{ scale: 1.1 }}
                                  className="flex items-center space-x-1"
                                >
                                  <CpuChipIcon className="w-4 h-4 text-[#EBC9A4]" />
                                  <span>{room.activeRoles.length} 角色</span>
                                </motion.div>
                              </div>
                              
                              {/* 專案類型標籤 */}
                              <div className="mb-4">
                                <motion.span 
                                  whileHover={{ scale: 1.05 }}
                                  className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                                    room.title.includes('與') && room.title.includes('的對話')
                                      ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200'
                                      : 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200'
                                  }`}
                                >
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                  >
                                    {room.title.includes('與') && room.title.includes('的對話') 
                                      ? <UserIcon className="w-3 h-3" />
                                      : <SparklesIcon className="w-3 h-3" />
                                    }
                                  </motion.div>
                                  <span>{room.title.includes('與') && room.title.includes('的對話') ? '個人專案' : '團隊專案'}</span>
                                </motion.span>
                              </div>
                            </div>

                            {/* 刪除專案按鈕 */}
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                
                                // 確認對話框
                                const isConfirmed = typeof window !== 'undefined' && window.confirm(
                                  `⚠️ 確定要刪除專案嗎？\n\n專案名稱: ${room.title}\n專案描述: ${room.description}\n\n此操作無法復原！`
                                );
                                
                                if (!isConfirmed) return;
                                
                                console.log('🗑️ 刪除專案:', room.id, room.title);
                                try {
                                  const response = await fetch('/api/delete-room', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ roomId: room.id })
                                  });
                                  const result = await safeJsonParse(response, '刪除專案 API');
                                  console.log('🗑️ 刪除結果:', result);
                                  
                                  if (result.success) {
                                    alert(`✅ 專案已成功刪除: ${room.title}`);
                                    // 重新載入聊天室列表
                                    loadUserRooms();
                                  } else {
                                    alert(`❌ 刪除失敗: ${result.error}`);
                                  }
                                } catch (error) {
                                  console.error('刪除失敗:', error);
                                  alert('刪除失敗，請查看控制台');
                                }
                              }}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-md"
                              title="刪除專案"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </motion.button>
                          </div>

                          {/* 活躍 AI 角色 */}
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-5 h-5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-sm"
                              >
                                <CpuChipIcon className="w-3 h-3 text-white" />
                              </motion.div>
                              <span className="text-sm font-bold text-[#4B4036]">AI 角色:</span>
                            </div>
                            <div className="flex space-x-1">
                              {room.activeRoles
                                .filter(roleName => roleName !== 'AI 助手') // 過濾掉無效的角色名稱
                                .map((roleName, roleIndex) => {
                                // 根據角色名稱找到對應的 AI companion
                                let companion = null;
                                if (roleName === 'Hibi') companion = companions.find(c => c.id === 'hibi');
                                else if (roleName === '墨墨') companion = companions.find(c => c.id === 'mori');
                                else if (roleName === '皮可') companion = companions.find(c => c.id === 'pico');
                                
                                if (companion) {
                                  return (
                                    <motion.div
                                      key={roleIndex}
                                      initial={{ scale: 0, rotate: -180, opacity: 0 }}
                                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                      transition={{ 
                                        delay: 0.3 + roleIndex * 0.1, 
                                        type: "spring", 
                                        damping: 15,
                                        stiffness: 400
                                      }}
                                      whileHover={{ scale: 1.3, y: -3, rotate: 5 }}
                                      className="relative group/role"
                                    >
                                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${companion.color} p-0.5 shadow-lg group-hover/role:shadow-xl transition-shadow`}>
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                          <Image
                                            src={companion.imagePath}
                                            alt={companion.name}
                                            width={28}
                                            height={28}
                                            className="w-7 h-7 object-cover"
                                          />
                                        </div>
                                      </div>
                                      
                                      {/* 角色專業圖標 */}
                                      <motion.div
                                        animate={{ 
                                          rotate: companion.id === 'hibi' ? 360 : 0,
                                          scale: [1, 1.1, 1]
                                        }}
                                        transition={{ 
                                          rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                                          scale: { duration: 2, repeat: Infinity }
                                        }}
                                        className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-md border border-white"
                                      >
                                        <companion.icon className="w-2.5 h-2.5 text-white" />
                                      </motion.div>
                                      
                                      {/* 角色名稱提示 */}
                                      <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        whileHover={{ opacity: 1, y: 0 }}
                                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-20"
                                      >
                                        {companion.name}
                                      </motion.div>
                                    </motion.div>
                                  );
                                }
                                
                                // 如果沒有匹配的 companion，顯示美化的文字標籤
                                return (
                                  <motion.div
                                    key={roleIndex}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.3 + roleIndex * 0.1 }}
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    className="px-3 py-1.5 bg-gradient-to-r from-[#FFD59A]/30 to-[#EBC9A4]/30 text-[#4B4036] rounded-full text-xs font-medium border border-[#EADBC8] shadow-sm"
                                  >
                                    {roleName}
                                  </motion.div>
                                );
                              })}
                          </div>
                        </div>

                        {/* 最後訊息 */}
                        <div className="bg-[#F8F5EC] rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center"
                              >
                                <ClockIcon className="w-2.5 h-2.5 text-white" />
                              </motion.div>
                              <span className="text-sm font-medium text-[#2B3A3B]">最新訊息</span>
                            </div>
                            <motion.span 
                              whileHover={{ scale: 1.1 }}
                              className="text-xs text-[#2B3A3B] bg-white/60 px-2 py-1 rounded-full"
                            >
                              {(() => {
                                const now = new Date();
                                const diff = now.getTime() - room.lastActivity.getTime();
                                const minutes = Math.floor(diff / 60000);
                                const hours = Math.floor(minutes / 60);
                                const days = Math.floor(hours / 24);
                                
                                if (days > 0) return `${days} 天前`;
                                if (hours > 0) return `${hours} 小時前`;
                                if (minutes > 0) return `${minutes} 分鐘前`;
                                return '剛剛';
                              })()}
                            </motion.span>
                          </div>
                          <p className="text-[#4B4036] text-sm line-clamp-2 leading-relaxed">
                            {room.lastMessage.length > 50 
                              ? `${room.lastMessage.slice(0, 50)}...` 
                              : room.lastMessage
                            }
                          </p>
                          </div>
                        </div>
                      </motion.div>
                      ))}
                    </AnimatePresence>
                  )}

                </div>
              </motion.div>
            )}

            {/* 角色管理視圖 */}
            {activeView === 'roles' && (
              <motion.div
                key="roles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <div className="flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <CpuChipIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-[#4B4036]">AI 角色夥伴</h1>
                  </div>
                  <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                    認識我們的 AI 角色夥伴，每個成員都有獨特的專長和個性
                  </p>
                  <div className="mt-4 inline-flex items-center px-4 py-2 bg-[#FFD59A]/20 border border-[#FFD59A] rounded-full text-sm text-[#4B4036]">
                    <CpuChipIcon className="w-4 h-4 mr-2" />
                    系統總管 Hibi + 專業助手墨墨、皮可
                  </div>
                </motion.div>

                {/* AI 角色卡片 */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {companions.map((companion, index) => (
                    <motion.div
                      key={companion.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="relative"
                    >
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-[#EADBC8] overflow-hidden">
                        {/* 狀態指示器 */}
                        <div className="absolute top-4 right-4 flex items-center space-x-2">
                          {companion.isManager && (
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 3, repeat: Infinity }}
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1.5 shadow-lg"
                            >
                              <CpuChipIcon className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-3 h-3 bg-green-400 rounded-full"
                          />
                        </div>

                        {/* 角色圖片 */}
                        <div className="flex justify-center mb-6">
                          <motion.div 
                            whileHover={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                          >
                            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${companion.color} p-1 shadow-lg`}>
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <Image
                                  src={companion.imagePath}
                                  alt={companion.name}
                                  width={120}
                                  height={120}
                                  className="w-30 h-30 object-cover"
                                />
                              </div>
                            </div>
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                              className="absolute -top-2 -right-2 bg-[#FFB6C1] rounded-full p-2 shadow-lg"
                            >
                              <companion.icon className="w-6 h-6 text-white" />
                            </motion.div>
                          </motion.div>
                        </div>

                        {/* 角色資訊 */}
                        <div className="text-center mb-6">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <h3 className="text-2xl font-bold text-[#4B4036]">
                            {companion.name} ({companion.nameEn})
                          </h3>
                            {companion.isManager && (
                              <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1"
                              >
                                <CpuChipIcon className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-[#2B3A3B] mb-3">{companion.description}</p>
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className={`inline-block px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${companion.color} text-white shadow-lg ${
                              companion.isManager ? 'ring-2 ring-yellow-300 ring-offset-2' : ''
                            }`}
                          >
                            {companion.specialty}
                          </motion.span>
                        </div>

                        {/* 狀態顯示 */}
                        <div className="flex items-center justify-center mb-6">
                          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span>線上</span>
                          </div>
                        </div>

                        {/* 能力標籤 */}
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2 justify-center">
                            {companion.abilities.slice(0, 3).map((ability, abilityIndex) => (
                              <motion.span
                                key={abilityIndex}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + abilityIndex * 0.1 }}
                                whileHover={{ scale: 1.1 }}
                                className="px-3 py-1 bg-[#F8F5EC] text-[#4B4036] rounded-full text-sm border border-[#EADBC8] shadow-sm"
                              >
                                {ability}
                              </motion.span>
                            ))}
                          </div>
                        </div>

                        {/* 互動按鈕 */}
                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCompanion(companion)}
                            className="flex-1 px-4 py-3 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                          >
                            了解更多
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: creatingChat === companion.id ? 1 : 1.05 }}
                            whileTap={{ scale: creatingChat === companion.id ? 1 : 0.95 }}
                            onClick={() => handleStartChat(companion)}
                            disabled={creatingChat === companion.id}
                            className={`flex-1 px-4 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl ${
                              creatingChat === companion.id ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                          >
                            {creatingChat === companion.id ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>創建中...</span>
                              </div>
                            ) : (
                              '開始專案'
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 記憶庫視圖 */}
            {activeView === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <div className="flex items-center justify-center mb-4">
                  <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <SparklesIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
                  </motion.div>
                    <h1 className="text-4xl font-bold text-[#4B4036]">AI 記憶庫</h1>
                </div>
                  <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                    AI 會自動學習和記住重要資訊，提供更個性化的智能服務
                  </p>
                </motion.div>

                {/* 記憶系統介紹 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { 
                      title: '智能學習', 
                      description: 'AI 會自動從對話中學習重要資訊', 
                      color: 'from-purple-400 to-purple-600', 
                      icon: SparklesIcon 
                    },
                    { 
                      title: '個性化記憶', 
                      description: '記住您的偏好和使用習慣', 
                      color: 'from-pink-400 to-pink-600', 
                      icon: HeartIcon 
                    },
                    { 
                      title: '上下文理解', 
                      description: '保持對話的連貫性和相關性', 
                      color: 'from-blue-400 to-blue-600', 
                      icon: ChatBubbleLeftRightIcon 
                    }
                  ].map((feature, index) => (
                        <motion.div
                      key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-[#EADBC8]"
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                          <feature.icon className="w-8 h-8 text-white" />
                                </div>
                        <h3 className="text-lg font-bold text-[#4B4036] mb-2">{feature.title}</h3>
                        <p className="text-sm text-[#2B3A3B]">{feature.description}</p>
                              </div>
                            </motion.div>
                  ))}
                          </div>
              </motion.div>
            )}

            {/* 統計視圖 */}
            {activeView === 'stats' && (
                              <motion.div 
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                              <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <div className="flex items-center justify-center mb-4">
                              <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                              >
                      <ChartBarIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
                              </motion.div>
                    <h1 className="text-4xl font-bold text-[#4B4036]">使用統計</h1>
                            </div>
                  <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                    追蹤 AI 使用情況，監控效能和優化體驗
                  </p>
                        </motion.div>

                {/* AI 使用統計組件 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-8"
                >
                  <UsageStatsDisplay 
                    userId={user?.id}
                    className="shadow-xl"
                  />
                </motion.div>

                {/* 系統功能說明 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-[#EADBC8]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <ChartBarIcon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-[#4B4036]">使用統計追蹤</h3>
                      </div>
                      <p className="text-sm text-[#2B3A3B] mb-3">
                        自動記錄 AI 請求次數、Token 使用量和成本，幫助您優化使用策略
                      </p>
                      <div className="space-y-1">
                        {['請求次數統計', 'Token 用量分析', '成本追蹤', '效率監控'].map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <span className="text-xs text-[#2B3A3B]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                          <ClockIcon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-[#4B4036]">效能監控分析</h3>
                      </div>
                      <p className="text-sm text-[#2B3A3B] mb-3">
                        監控 AI 模型回應時間和效能，優化使用體驗和系統效率
                      </p>
                      <div className="space-y-1">
                        {['回應時間監控', '模型效能分析', '使用趨勢統計', '系統優化建議'].map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span className="text-xs text-[#2B3A3B]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 角色詳情模態框 */}
      <AnimatePresence>
        {selectedCompanion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCompanion(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#4B4036]">
                  {selectedCompanion.name} 詳細介紹
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedCompanion(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <motion.div 
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    className="relative inline-block mb-4"
                  >
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${selectedCompanion.color} p-1`}>
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Image
                          src={selectedCompanion.imagePath}
                          alt={selectedCompanion.name}
                          width={120}
                          height={120}
                          className="w-30 h-30 object-cover"
                        />
                      </div>
                    </div>
                  </motion.div>
                  <p className="text-[#2B3A3B] text-lg">{selectedCompanion.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-3">個性特徵</h3>
                  <p className="text-[#2B3A3B]">{selectedCompanion.personality}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-3">專長能力</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCompanion.abilities.map((ability, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        className="px-3 py-2 bg-[#F8F5EC] text-[#4B4036] rounded-lg text-sm border border-[#EADBC8]"
                      >
                        {ability}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCompanion(null);
                      handleStartChat(selectedCompanion);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white rounded-xl font-medium transition-all shadow-lg"
                  >
                    開始對話
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCompanion(null)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
                  >
                    關閉
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 創建專案模態框 */}
      <AnimatePresence>
        {/* 專案資訊填寫模態框 */}
        {showProjectModal && selectedCompanionForProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowProjectModal(false);
              setSelectedCompanionForProject(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#4B4036]">開始新專案</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowProjectModal(false);
                    setSelectedCompanionForProject(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                </motion.button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#F8F5EC] rounded-xl">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${selectedCompanionForProject.color} p-0.5`}>
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      <Image
                        src={selectedCompanionForProject.imagePath}
                        alt={selectedCompanionForProject.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#4B4036]">
                      與 {selectedCompanionForProject.name} 協作
                    </h3>
                    <p className="text-sm text-[#2B3A3B]">
                      {selectedCompanionForProject.description}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const projectData = {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string
                };
                handleCreateChatWithProject(projectData);
              }}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-[#4B4036] mb-2">
                      本次專案 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      placeholder="請輸入專案名稱，例如：網站設計專案"
                      className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-[#4B4036] mb-2">
                      專案內容 <span className="text-gray-400">(選填)</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      placeholder="請描述專案的具體內容和目標..."
                      className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowProjectModal(false);
                      setSelectedCompanionForProject(null);
                    }}
                    className="flex-1 px-6 py-3 border border-[#EADBC8] text-[#4B4036] rounded-xl font-medium hover:bg-[#F8F5EC] transition-all"
                  >
                    取消
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={creatingChat === selectedCompanionForProject.id}
                    className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ${
                      creatingChat === selectedCompanionForProject.id ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {creatingChat === selectedCompanionForProject.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>創建中...</span>
                      </div>
                    ) : (
                      '開始協作'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showCreateRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateRoom(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#4B4036]">創建新專案</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCreateRoom(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </motion.button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const selectedRoles = Array.from(formData.getAll('roles')) as string[];
                handleCreateProjectRoom({
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  selectedRoles
                });
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">本次專案</label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all bg-white text-[#4B4036]"
                      placeholder="例：網站重新設計專案"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">專案內容</label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all bg-white text-[#4B4036]"
                      placeholder="簡短描述這個專案的內容和目標..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-4">選擇 AI 角色成員</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {companions.map((companion) => (
                        <motion.label
                          key={companion.id}
                          whileHover={{ scale: 1.02 }}
                          className="relative cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            name="roles"
                            value={companion.name}
                            defaultChecked
                            className="sr-only peer"
                          />
                          <div className="bg-white border-2 border-[#EADBC8] rounded-xl p-4 hover:border-[#FFD59A] transition-colors peer-checked:border-[#FFB6C1] peer-checked:bg-[#FFB6C1]/10">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${companion.color} p-0.5`}>
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                  <Image
                                    src={companion.imagePath}
                                    alt={companion.name}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 object-cover"
                                  />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#4B4036]">{companion.name}</p>
                                <p className="text-sm text-[#2B3A3B] truncate">{companion.specialty}</p>
                              </div>
                            </div>
                          </div>
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      創建專案
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateRoom(false)}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
                    >
                      取消
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 角色選擇視窗 */}
      <AnimatePresence>
        {showRoleSelectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-[radial-gradient(ellipse_at_top,rgba(255,214,165,0.25),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(255,182,193,0.25),transparent_60%)] backdrop-blur-sm sm:backdrop-blur-md"
            onClick={() => setShowRoleSelectionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-[0_10px_40px_rgba(255,182,193,0.35)] ring-1 ring-[#EADBC8]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A]">選擇 AI 角色</h2>
                <button
                  onClick={() => setShowRoleSelectionModal(false)}
                  className="p-2 hover:bg-[#FFF9F2] rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <p className="text-[#2B3A3B] mb-6">
                請選擇要加入協作聊天室的 AI 角色：
              </p>

              <RoleSelectionGrid 
                companions={companions}
                onConfirm={(selectedRoles) => {
                  if (selectedRoles.length > 0) {
                    createTeamCollaborationProject(selectedRoles);
                  }
                }}
                onCancel={() => setShowRoleSelectionModal(false)}
              />

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 角色選擇網格組件
function RoleSelectionGrid({ 
  companions, 
  onConfirm,
  onCancel
}: { 
  companions: AICompanion[]; 
  onConfirm: (selectedRoles: string[]) => void;
  onCancel: () => void;
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // 動畫變體：容器與子項目進場漸進
  const listVariants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 320, damping: 24 }
    }
  } as const;

  const toggleRole = (roleName: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleName) 
        ? prev.filter(role => role !== roleName)
        : [...prev, roleName]
    );
  };

  const selectAll = () => {
    setSelectedRoles(companions.map(c => c.name));
  };

  const clearAll = () => {
    setSelectedRoles([]);
  };

  const handleConfirm = () => {
    if (selectedRoles.length > 0) {
      onConfirm(selectedRoles);
    }
  };

  return (
    <div className="space-y-4">
      <motion.div className="space-y-3" variants={listVariants} initial="hidden" animate="show">
        {companions.map((companion) => (
          <motion.div
            variants={itemVariants}
            key={companion.id}
            whileHover={{ scale: 1.015, translateY: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => toggleRole(companion.name)}
            className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
              selectedRoles.includes(companion.name)
                ? 'ring-2 ring-offset-2 ring-[#FFB6C1] bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] shadow-[0_8px_24px_rgba(255,182,193,0.25)]' 
                : 'border border-gray-200 hover:border-[#EADBC8] bg-white hover:shadow-md'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <Image
                    src={companion.imagePath}
                    alt={companion.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover shadow-sm"
                  />
                </motion.div>
                {selectedRoles.includes(companion.name) && (
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB6C1] rounded-full flex items-center justify-center shadow"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#4B4036]">{companion.name}</h3>
                <p className="text-sm text-[#2B3A3B]">{companion.specialty}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex space-x-2 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={selectAll}
          className="px-3 py-2 text-sm rounded-lg font-medium transition-colors bg-gradient-to-br from-[#DDEBFF] to-[#EAF3FF] text-[#2B3A3B] hover:shadow"
        >
          全選
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearAll}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          清空
        </motion.button>
      </div>

      <div className="flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          disabled={selectedRoles.length === 0}
          className={`flex-1 px-4 py-3 rounded-xl font-medium shadow-lg transition-all ${
            selectedRoles.length > 0
              ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white hover:shadow-xl'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          確認選擇 ({selectedRoles.length})
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
        >
          取消
        </motion.button>
      </div>
    </div>
  );
}
