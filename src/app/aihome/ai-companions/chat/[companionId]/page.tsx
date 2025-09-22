'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { 
  Bars3Icon, 
  PaperAirplaneIcon,
  ArrowLeftIcon,
  MicrophoneIcon,
  PhotoIcon,
  FaceSmileIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { AcademicCapIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'companion';
  timestamp: Date;
  type: 'text' | 'image';
}

interface AICompanion {
  id: 'mori' | 'pico';
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
}

export default function ChatPage() {
  const { user } = useSaasAuth();
  const router = useRouter();
  const params = useParams();
  const companionId = params.companionId as 'mori' | 'pico';
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingPico, setSendingPico] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentSessionId] = useState(`session_${Date.now()}`);

  const companions: Record<string, AICompanion> = {
    mori: {
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
    pico: {
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
  };

  const companion = companions[companionId];

  console.log('🔍 當前 companion ID:', companionId);
  console.log('🔍 當前 companion 對象:', companion);
  console.log('🔍 是否為 Pico:', companion?.id === 'pico');

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 從 Supabase 載入歷史對話
  const loadMessagesFromSupabase = async () => {
    if (!user?.id) return;

    try {
      // 查找用戶與此 companion 的對話房間
      const { data: rooms, error: roomsError } = await supabase
        .from('ai_rooms')
        .select('id')
        .eq('created_by', user.id)
        .eq('room_type', 'chat')
        .like('title', `%${companion.name}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (roomsError || !rooms || rooms.length === 0) {
        console.log('📝 沒有找到歷史對話房間，將創建新房間');
        return;
      }

      const roomId = rooms[0].id;
      setCurrentRoomId(roomId);

      // 載入該房間的訊息
      const { data: messages, error: messagesError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (messagesError) {
        console.error('❌ 載入訊息失敗:', messagesError);
        return;
      }

      if (messages && messages.length > 0) {
        const formattedMessages: Message[] = messages.map(msg => ({
          id: msg.id,
          content: msg.content || '',
          sender: msg.sender_type === 'user' ? 'user' : 'companion',
          timestamp: new Date(msg.created_at),
          type: 'text'
        }));

        setMessages(formattedMessages);
        console.log(`✅ 載入了 ${formattedMessages.length} 條歷史訊息`);
      }
    } catch (error) {
      console.error('❌ 載入對話歷史失敗:', error);
    }
  };

  // 儲存訊息到 Supabase
  const saveMessageToSupabase = async (message: Message, roomId?: string) => {
    if (!user?.id) return;

    try {
      // 確保有房間 ID
      let targetRoomId = roomId || currentRoomId;
      
      if (!targetRoomId) {
        // 創建新的房間
        const { data: newRoom, error: roomError } = await supabase
          .from('ai_rooms')
          .insert({
            title: `與 ${companion.name} 的對話`,
            description: `用戶與 ${companion.name} 的個人對話記錄`,
            room_type: 'chat',
            created_by: user.id
          })
          .select()
          .single();

        if (roomError) {
          console.error('❌ 創建房間失敗:', roomError);
          return;
        }

        targetRoomId = newRoom.id;
        setCurrentRoomId(targetRoomId);

        // 添加用戶為房間成員
        const { error: memberError } = await supabase
          .from('room_members')
          .insert({
            room_id: targetRoomId,
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

        console.log('✅ 創建新的對話房間:', targetRoomId);
      }

      // 儲存訊息
      const messageData = {
        room_id: targetRoomId,
        session_id: currentSessionId,
        sender_type: message.sender === 'user' ? 'user' : 'role',
        sender_user_id: message.sender === 'user' ? user.id : null,
        sender_role_instance_id: message.sender === 'companion' ? null : null, // 暫時設為 null，之後可以關聯角色實例
        content: message.content,
        status: 'sent'
      };

      const { error: messageError } = await supabase
        .from('ai_messages')
        .insert(messageData);

      if (messageError) {
        console.error('❌ 儲存訊息失敗:', messageError);
      } else {
        console.log('✅ 訊息已儲存到 Supabase:', message.content.slice(0, 50));
      }
    } catch (error) {
      console.error('❌ Supabase 操作錯誤:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 計時器管理
  useEffect(() => {
    if (isLoading || isTyping) {
      // 根據 companion 和任務類型設定預估時間
      let estimatedSeconds = 5; // 預設 5 秒
      
      if (companion?.id === 'pico') {
        // Pico 的任務類型判斷
        const lastMessage = messages[messages.length - 1]?.content || '';
        if (lastMessage.includes('畫') || lastMessage.includes('圖') || lastMessage.includes('創作') || lastMessage.includes('設計')) {
          estimatedSeconds = 35; // 複雜創作任務
        } else if (lastMessage.includes('簡單') || lastMessage.includes('快速')) {
          estimatedSeconds = 15; // 簡單任務
        } else {
          estimatedSeconds = 25; // 一般創作任務
        }
      } else if (companion?.id === 'mori') {
        // 墨墨的任務類型判斷
        const lastMessage = messages[messages.length - 1]?.content || '';
        if (lastMessage.includes('研究') || lastMessage.includes('分析') || lastMessage.includes('報告')) {
          estimatedSeconds = 15; // 深度分析任務
        } else {
          estimatedSeconds = 8; // 一般問答
        }
      }
      
      setEstimatedTime(estimatedSeconds);
      setElapsedTime(0);
      
      // 開始計時
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      // 清除計時器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime(0);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLoading, isTyping, companion?.id]);

  // 初始化對話 - 優先載入歷史，否則顯示歡迎訊息
  useEffect(() => {
    if (companion && user?.id) {
      // 先嘗試載入歷史對話
      loadMessagesFromSupabase().then(() => {
        // 如果沒有歷史對話，顯示歡迎訊息
        if (messages.length === 0) {
          const welcomeMessage: Message = {
            id: 'welcome',
            content: `你好！我是${companion.name}，${companion.description}。有什麼可以幫助您的嗎？`,
            sender: 'companion',
            timestamp: new Date(),
            type: 'text'
          };
          setMessages([welcomeMessage]);
        }
      });
    }
  }, [companionId, companion?.name, user?.id]); // 加入 user.id 依賴

  // 模擬 AI 回覆
  const simulateAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    // 模擬 API 延遲
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    let response = '';
    
    if (companion.id === 'mori') {
      // 墨墨的回覆風格 - 學術性
      if (userMessage.includes('學習') || userMessage.includes('研究')) {
        response = '這是一個很有趣的學習問題！讓我來幫您分析一下。根據我的知識庫，我建議您可以從以下幾個方面來探討...';
      } else if (userMessage.includes('問題') || userMessage.includes('解決')) {
        response = '我理解您遇到的問題。讓我們用系統性的方法來分析和解決這個問題。首先，我們需要了解問題的核心...';
      } else {
        response = '作為您的學習伙伴，我很樂意協助您。請告訴我更多詳細資訊，這樣我就能提供更精確的建議和指導。';
      }
    } else if (companion.id === 'pico') {
      // 皮可的回覆風格 - 創意性
      if (userMessage.includes('設計') || userMessage.includes('創作')) {
        response = '哇！這聽起來是個超棒的創作想法！✨ 讓我們一起發揮創意吧！我建議可以從色彩搭配和視覺構圖開始...';
      } else if (userMessage.includes('畫') || userMessage.includes('圖')) {
        response = '繪畫是我最喜歡的事情了！🎨 讓我來幫您構思一下創作方向。我們可以考慮不同的風格和技法...';
      } else {
        response = '嗨！很高興和您聊天！我充滿創意的大腦已經開始運轉了！有什麼有趣的創作想法想要分享嗎？';
      }
    }
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: response,
      sender: 'companion',
      timestamp: new Date(),
      type: 'text'
    };
    
    setIsTyping(false);
    setMessages(prev => [...prev, aiMessage]);

    // 儲存 AI 回應到 Supabase
    if (currentRoomId) {
      await saveMessageToSupabase(aiMessage, currentRoomId);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const messageContent = inputMessage.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    // 儲存用戶訊息到 Supabase
    await saveMessageToSupabase(userMessage);
    
    // 如果是 Pico 聊天，發送到 webhook；否則使用模擬回應
    if (companion.id === 'pico' && user?.id) {
      console.log('🚀 發送到 Pico webhook:', messageContent);
      try {
        const webhookResult = await sendToPicoWebhook(messageContent);
        console.log('🎨 Pico webhook 處理完成:', webhookResult);
      } catch (error) {
        console.error('❌ Pico webhook 失敗，使用備用回應:', error);
        // 如果 webhook 失敗，使用模擬回應作為備用
        await simulateAIResponse(userMessage.content);
      }
    } else {
      // 墨墨或其他角色使用模擬回應
      await simulateAIResponse(userMessage.content);
    }
    
    setIsLoading(false);
    setIsTyping(false);
  };

  // 背景發送到 Pico webhook（不顯示 UI 狀態）
  const sendToPicoWebhook = async (text: string) => {
    if (!user?.id || !text.trim()) return;

    // 智能檢測 style：如果訊息中沒有提到風格相關詞彙，就留空
    const detectStyle = (message: string): string => {
      const lowerMsg = message.toLowerCase();
      const styleKeywords = [
        'kawaii', '可愛', '萌', 'cute', 'adorable', 'sweet',
        'realistic', '寫實', '真實', 'photorealistic',
        'cartoon', '卡通', '動畫', 'anime', '二次元',
        'artistic', '藝術', 'art', 'painting', '繪畫',
        'minimalist', '簡約', 'simple', '極簡',
        'vintage', '復古', 'retro', '懷舊',
        'modern', '現代', 'contemporary', '當代',
        'style', '風格', '樣式'
      ];
      
      // 如果訊息包含風格關鍵字，使用 kawaii 作為預設
      if (styleKeywords.some(keyword => lowerMsg.includes(keyword))) {
        return 'kawaii';
      }
      
      // 否則留空，讓 AI 自行決定
      return '';
    };

    const detectedStyle = detectStyle(text);
    console.log('🎨 檢測到的風格:', detectedStyle || '無指定（留空）');

    // 準備完整的 webhook 資料
    const webhookData = {
      user_id: user.id,
      final_prompt: text,
      style: detectedStyle || 'kawaii',
      size: '1024x1024',
      model: 'flux-dev',
      timestamp: new Date().toISOString(),
      session_id: `pico_chat_${Date.now()}`,
      companion_id: 'pico',
      user_info: {
        name: user.full_name || '用戶',
        email: user.email || '',
        id: user.id
      },
      context: {
        previous_messages: messages.slice(-3).map(msg => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp.toISOString()
        })),
        conversation_id: `conv_pico_${user.id}_${Date.now()}`,
        platform: 'hanami-web',
        chat_type: 'individual_companion_chat'
      },
      memory_context: {
        scope: 'user',
        role_id: 'pico-artist',
        should_store_memory: true,
        memory_importance: 0.7
      },
      response_preferences: {
        include_image: true,
        include_text_response: true,
        max_response_length: 200
      }
    };

    console.log('📦 準備發送的完整 webhook 資料:', webhookData);

    try {
      const res = await fetch('/aihome/api/aipico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
      
      const out = await res.json();
      console.log('✅ 自動 webhook 回應:', { status: res.status, data: out });
      
      // 處理 n8n 的回應並顯示給用戶
      if (res.ok) {
        let responseContent = '';
        let messageType: 'text' | 'image' = 'text';
        let imageUrl = '';
        
        console.log('🔍 分析 webhook 回應結構:', out);
        
        // 根據你的 n8n workflow，檢查不同的回應格式
        if (out.data) {
          let rawResponse = '';
          
          if (typeof out.data === 'string') {
            rawResponse = out.data;
          } else if (out.data.raw) {
            rawResponse = out.data.raw;
          }
          
          // 提取圖片 URL（從 iframe 或直接 URL）
          if (rawResponse) {
            console.log('🔍 原始回應內容:', rawResponse);
            
            // 檢查是否包含 iframe
            if (rawResponse.includes('<iframe') && rawResponse.includes('https://')) {
              // 從 iframe srcdoc 中提取圖片 URL
              const urlMatch = rawResponse.match(/https:\/\/[^\s"<>]+\.(?:png|jpg|jpeg|webp|gif)/i);
              if (urlMatch) {
                imageUrl = urlMatch[0];
                responseContent = `🎨 我為您創作了一隻會飛的貓！太可愛了！`;
                messageType = 'image';
                console.log('✅ 從 iframe 提取圖片 URL:', imageUrl);
              } else {
                responseContent = '🎨 創作完成！但圖片連結解析失敗。';
                console.error('❌ 無法從 iframe 提取圖片 URL');
              }
            } else if (rawResponse.includes('http') && (rawResponse.includes('.png') || rawResponse.includes('.jpg') || rawResponse.includes('.webp'))) {
              // 直接是圖片 URL
              imageUrl = rawResponse.trim();
              responseContent = `🎨 我為您創作了一隻會飛的貓！太可愛了！`;
              messageType = 'image';
              console.log('✅ 直接圖片 URL:', imageUrl);
            } else {
              responseContent = rawResponse;
              console.log('📝 文字回應:', rawResponse);
            }
          } else if (out.data.image_url) {
            imageUrl = out.data.image_url;
            responseContent = out.data.message || `🎨 創作完成！`;
            messageType = 'image';
          } else if (out.data.message) {
            responseContent = out.data.message;
          } else if (out.data.response) {
            responseContent = out.data.response;
          }
        }
        
        // 如果沒有找到明確的回應，使用預設訊息
        if (!responseContent) {
          responseContent = '🎨 我收到您的請求了！正在發揮創意為您創作...';
        }
        
        // 如果有圖片，添加圖片 URL 到內容
        if (imageUrl) {
          responseContent += `\n\n![創作作品](${imageUrl})`;
        }
        
        // 創建 AI 回應訊息
        const aiResponse: Message = {
          id: (Date.now() + Math.random()).toString(),
          content: responseContent,
          sender: 'companion',
          timestamp: new Date(),
          type: messageType
        };
        
        // 添加到訊息列表
        setMessages(prev => [...prev, aiResponse]);
        console.log('🎨 已添加 Pico 的回應到對話中:', aiResponse);

        // 儲存 AI 回應到 Supabase
        if (currentRoomId) {
          await saveMessageToSupabase(aiResponse, currentRoomId);
        }
      } else {
        // 處理錯誤回應
        const errorMessage: Message = {
          id: (Date.now() + Math.random()).toString(),
          content: '抱歉，我現在無法處理您的請求。請稍後再試。',
          sender: 'companion',
          timestamp: new Date(),
          type: 'text'
        };
        
        setMessages(prev => [...prev, errorMessage]);
        console.log('❌ Webhook 回應錯誤，顯示錯誤訊息');
      }
      
      return { success: res.ok, data: out };
    } catch (error) {
      console.error('❌ 自動 webhook 錯誤:', error);
      throw error;
    }
  };

  // 發送到 Pico 影像/任務 Webhook（固定格式）- 手動按鈕
  const handleSendToPico = async () => {
    console.log('🔥 點擊了送到Pico按鈕');
    console.log('🔍 檢查companion.id:', companion.id);
    console.log('👤 檢查user:', user);
    
    if (companion.id !== 'pico') {
      console.log('❌ 不是 Pico，返回');
      return;
    }
    
    if (!user?.id) {
      console.log('❌ 用戶未登入');
      alert('用戶未登入，無法發送到 Pico！');
      return;
    }
    
    const text = inputMessage.trim() || messages.filter(m => m.sender === 'user').slice(-1)[0]?.content || '';
    console.log('📝 準備發送的文本:', text);
    
    if (!text) {
      console.log('❌ 沒有文本內容');
      alert('沒有內容可以發送到 Pico！');
      return;
    }

    console.log('🚀 準備發送到 Pico:', { user_id: user.id, final_prompt: text });

    try {
      setSendingPico(true);
      
      // 使用相同的風格檢測邏輯
      const detectStyle = (message: string): string => {
        const lowerMsg = message.toLowerCase();
        const styleKeywords = [
          'kawaii', '可愛', '萌', 'cute', 'adorable', 'sweet',
          'realistic', '寫實', '真實', 'photorealistic',
          'cartoon', '卡通', '動畫', 'anime', '二次元',
          'artistic', '藝術', 'art', 'painting', '繪畫',
          'style', '風格', '樣式'
        ];
        return styleKeywords.some(keyword => lowerMsg.includes(keyword)) ? 'kawaii' : '';
      };

      const detectedStyle = detectStyle(text);
      console.log('🎨 手動發送檢測到的風格:', detectedStyle || '無指定（留空）');
      
      const res = await fetch('/aihome/api/aipico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          final_prompt: text,
          style: detectedStyle,
          size: '',
          model: 'nanobanana'
        })
      });
      
      const out = await res.json();
      console.log('Pico API 回應:', { status: res.status, data: out });
      
      // 在對話中提示一則系統訊息
      setMessages(prev => ([
        ...prev,
        {
          id: Date.now().toString(),
          content: res.ok ? '已送出任務到 Pico Webhook ✅' : `送出失敗：${out?.error || out?.status || 'Unknown'}`,
          sender: 'companion',
          timestamp: new Date(),
          type: 'text'
        }
      ]));
    } catch (e) {
      setMessages(prev => ([
        ...prev,
        {
          id: Date.now().toString(),
          content: '送出任務失敗，請稍後再試 ❌',
          sender: 'companion',
          timestamp: new Date(),
          type: 'text'
        }
      ]));
    } finally {
      setSendingPico(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!companion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-4">找不到該 AI 伙伴</h1>
          <button
            onClick={() => router.push('/aihome/ai-companions')}
            className="px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium"
          >
            返回 AI 伙伴頁面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC]">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* 選單按鈕 */}
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                title={sidebarOpen ? "關閉選單" : "開啟選單"}
              >
                <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>

              {/* 返回按鈕 */}
              <motion.button
                onClick={() => router.push('/aihome/ai-companions')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回 AI 伙伴"
              >
                <ArrowLeftIcon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>
              
              {/* 伙伴資訊 */}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${companion.color} p-0.5`}>
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {companion.imagePath ? (
                      <Image
                        src={companion.imagePath}
                        alt={companion.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover"
                      />
                    ) : null}
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#4B4036]">
                    {companion.name} ({companion.nameEn})
                  </h1>
                  <p className="text-sm text-[#2B3A3B]">{companion.specialty}</p>
                </div>
                {/* 在線狀態 */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 bg-green-400 rounded-full"
                />
              </div>
            </div>

            {/* 右側功能按鈕 */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="更多選項"
              >
                <EllipsisHorizontalIcon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>
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

      {/* 聊天主體 */}
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
        {/* 訊息區域 */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-3 max-w-[70%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}>
                    {/* 頭像 */}
                    {message.sender === 'companion' && (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${companion.color} p-0.5 flex-shrink-0`}>
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          {companion.imagePath ? (
                            <Image
                              src={companion.imagePath}
                              alt={companion.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 object-cover"
                            />
                          ) : null}
                        </div>
                      </div>
                    )}
                    
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">
                          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}

                    {/* 訊息氣泡 */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`px-4 py-3 rounded-2xl shadow-lg ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white'
                          : 'bg-white/70 backdrop-blur-sm text-[#4B4036] border border-[#EADBC8]'
                      }`}
                    >
                      {/* 訊息內容 */}
                      <div className="text-sm leading-relaxed">
                        {message.content.split('\n').map((line, index) => {
                          // 檢查是否為圖片 markdown 格式
                          const imageMatch = line.match(/!\[.*?\]\((.*?)\)/);
                          if (imageMatch) {
                            let imageUrl = imageMatch[1];
                            
                            // 如果是 iframe，提取其中的圖片 URL
                            if (imageUrl.includes('<iframe')) {
                              const urlExtract = imageUrl.match(/https:\/\/[^\s"<>]+\.(?:png|jpg|jpeg|webp|gif)/i);
                              if (urlExtract) {
                                imageUrl = urlExtract[0];
                              } else {
                                return <p key={index} className="text-red-500">圖片連結解析失敗</p>;
                              }
                            }
                            
                            return (
                              <div key={index} className="mt-3">
                                <div className="bg-white/30 rounded-lg p-2 shadow-sm">
                                  <img 
                                    src={imageUrl} 
                                    alt="Pico 創作作品"
                                    className="max-w-full h-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                    onError={(e) => {
                                      console.error('圖片載入失敗:', imageUrl);
                                      e.currentTarget.parentElement!.innerHTML = `
                                        <div class="text-blue-500 underline cursor-pointer" onclick="window.open('${imageUrl}', '_blank')">
                                          🖼️ 點擊查看圖片：${imageUrl}
                                        </div>
                                      `;
                                    }}
                                    onLoad={() => {
                                      console.log('✅ 圖片載入成功:', imageUrl);
                                    }}
                                  />
                                  <p className="text-xs text-[#2B3A3B]/70 mt-1 text-center">
                                    點擊圖片可在新視窗中查看
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          
                          // 一般文字內容
                          if (line.trim()) {
                            return <p key={index} className="mb-1">{line}</p>;
                          }
                          return null;
                        })}
                      </div>
                      <p className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-white/70' : 'text-[#2B3A3B]/70'
                      }`}>
                        {message.timestamp.toLocaleTimeString('zh-TW', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 正在輸入指示器 */}
            <AnimatePresence>
              {(isTyping || isLoading) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-start"
                >
                  <div className="flex items-end space-x-3 max-w-[80%]">
                    {/* AI 頭像 */}
                    <motion.div 
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${companion.color} p-0.5 flex-shrink-0`}
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Image
                          src={companion.imagePath}
                          alt={companion.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-cover"
                        />
                      </div>
                    </motion.div>
                    <div className="bg-white/70 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-[#EADBC8]">
                      {/* 動態狀態文字 */}
                      <div className="flex items-center space-x-2 mb-2">
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-xs text-[#4B4036] font-medium"
                        >
                          {(() => {
                            if (companion?.id === 'pico') {
                              if (elapsedTime < 10) return '🎨 正在構思創作...';
                              if (elapsedTime < 20) return '✨ 正在發揮創意魔法...';
                              if (elapsedTime < 30) return '🖌️ 正在精心繪製...';
                              return '🌟 即將完成創作...';
                            } else {
                              if (elapsedTime < 3) return '🤔 正在思考中...';
                              if (elapsedTime < 6) return '📚 正在查找資料...';
                              return '💡 正在整理答案...';
                            }
                          })()}
                        </motion.span>
                      </div>
                      
                      {/* 動畫點點 */}
                      <div className="flex items-center space-x-1 mb-2">
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${companion.color}`}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${companion.color}`}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${companion.color}`}
                        />
                      </div>
                      
                      {/* 時間顯示 */}
                      <div className="flex items-center justify-between text-xs text-[#2B3A3B]/70">
                        <span className={elapsedTime > estimatedTime ? 'text-orange-600 font-medium' : ''}>
                          已等待: {elapsedTime}s
                        </span>
                        <span>
                          {elapsedTime > estimatedTime ? '處理中...' : `預估: ~${estimatedTime}s`}
                        </span>
                      </div>
                      
                      {/* 進度條 */}
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                        <motion.div
                          className={`h-1 rounded-full ${
                            elapsedTime > estimatedTime 
                              ? 'bg-gradient-to-r from-orange-400 to-red-500' 
                              : `bg-gradient-to-r ${companion.color}`
                          }`}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: elapsedTime > estimatedTime 
                              ? '100%'
                              : `${Math.min((elapsedTime / estimatedTime) * 100, 100)}%`,
                            opacity: elapsedTime > estimatedTime ? [0.5, 1, 0.5] : 1
                          }}
                          transition={{ 
                            duration: elapsedTime > estimatedTime ? 1 : 0.5,
                            repeat: elapsedTime > estimatedTime ? Infinity : 0
                          }}
                        />
                      </div>
                      
                      {/* 創作提示（僅 Pico 顯示）*/}
                      {companion?.id === 'pico' && (
                        <motion.div
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="mt-2 text-xs text-center"
                        >
                          <span className="text-[#FFB6C1]">
                            {(() => {
                              if (elapsedTime < 10) return '✨ 正在發揮創意魔法 ✨';
                              if (elapsedTime < 20) return '🎨 正在調色盤中尋找完美色彩...';
                              if (elapsedTime < 30) return '🖌️ 正在精心描繪每個細節...';
                              return '🌟 正在為作品添加最後的魔法光芒...';
                            })()}
                          </span>
                        </motion.div>
                      )}
                      
                      {/* 墨墨的思考提示 */}
                      {companion?.id === 'mori' && (
                        <motion.div
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="mt-2 text-xs text-center text-[#D4A574]"
                        >
                          {(() => {
                            if (elapsedTime < 3) return '🤔 正在分析問題...';
                            if (elapsedTime < 6) return '📚 正在查閱知識庫...';
                            return '💡 正在整理最佳答案...';
                          })()}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 輸入區域 */}
        <div className="border-t border-[#EADBC8] bg-white/80 backdrop-blur-sm px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              {/* 附加功能按鈕 */}
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full hover:bg-[#FFD59A]/20 transition-colors"
                  title="語音輸入"
                >
                  <MicrophoneIcon className="w-5 h-5 text-[#4B4036]" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full hover:bg-[#FFD59A]/20 transition-colors"
                  title="上傳圖片"
                >
                  <PhotoIcon className="w-5 h-5 text-[#4B4036]" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full hover:bg-[#FFD59A]/20 transition-colors"
                  title="表情符號"
                >
                  <FaceSmileIcon className="w-5 h-5 text-[#4B4036]" />
                </motion.button>
              </div>

              {/* 輸入框 */}
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`與 ${companion.name} 對話...`}
                  className="w-full px-4 py-3 pr-12 border border-[#EADBC8] rounded-2xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all bg-white/70 text-[#4B4036] placeholder-[#2B3A3B]/50 resize-none"
                  rows={1}
                  style={{ maxHeight: '120px' }}
                  disabled={isLoading}
                />
                
                {/* 發送按鈕 */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Pico 聊天時自動發送到 webhook，手動按鈕已隱藏 */}
            </div>

            {/* 快速回覆建議 */}
            {messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2 mt-3"
              >
                {companion.id === 'mori' ? [
                  '幫我分析一下這個問題',
                  '我想學習新知識',
                  '需要研究建議',
                  '解釋一個概念'
                ] : [
                  '幫我設計一個作品',
                  '我想要創作靈感',
                  '色彩搭配建議',
                  '視覺設計想法'
                ].map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInputMessage(suggestion)}
                    className="px-3 py-1 bg-[#F8F5EC] hover:bg-[#FFD59A]/20 text-[#4B4036] text-sm rounded-full border border-[#EADBC8] transition-colors"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
