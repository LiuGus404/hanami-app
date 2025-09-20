'use client';

import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

import AIControlPanel from '@/components/AIControlPanel';
import { PopupSelect } from '@/components/ui/PopupSelect';

type MessageType = {
  sender: 'user' | 'ai';
  text: string;
  model: string;
}

export default function AIHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultModel = 'Hibi';
  const [model, setModel] = useState(searchParams.get('model') || defaultModel);
  const [pendingModel, setPendingModel] = useState(model);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [popupOpen, setPopupOpen] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  // 拍照相關狀態
  const [showCamera, setShowCamera] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // 啟動/關閉相機
  useEffect(() => {
    let stream: MediaStream;
    if (showCamera && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
          }
        }).catch(console.error);
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [showCamera]);

  const assistantOptions = [
    { value: 'llama3-custom', label: '希希 Hibi', image: '/owlui.png' },
    { value: 'gemma-2b', label: '語語 Lulu', image: '/foxcat.png' },
    { value: 'deepseek-r1-8b', label: '策策 Taku', image: '/polarbear.png' },
    { value: 'llava-v1.6-7b', label: '米米 Mimi', image: '/rabbit.png' },
  ];

  useEffect(() => {
    const assistant = assistantOptions.find(opt => opt.value === model);
    if (assistant && !hasGreeted) {
      const greetingMap: Record<string, string> = {
        'llama3-custom': '你好，我是希希，擅長幫你處理日常事務與分配工作，有甚麼可以幫到你？',
        'gemma-2b': '你好，我是語語，擅長文字潤色與語言轉換，有甚麼可以幫你寫？',
        'deepseek-r1-8b': '你好，我是策策，專長是數據分析與邏輯規劃，有什麼資料要幫你解讀？',
        'llava-v1.6-7b': '你好，我是米米，擅長圖片理解與多模態分析，請給我圖片或任務吧！',
      };
      setMessages([{ sender: 'ai' as const, text: greetingMap[model] || '你好，有什麼可以幫你？', model }]);
      setHasGreeted(true);
    }
  }, [model, hasGreeted, assistantOptions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6 font-quicksand max-w-2xl mx-auto">
      {/* 左側：對話面板 */}
      <div className="bg-white rounded-xl shadow-md p-4 flex flex-col h-[90vh]">
        <div className="mb-4">
          {/* Assistant selector */}
          <div className="mb-4">
            <button
              className="px-3 py-1 rounded-full bg-[#FFF8E6] border border-[#DDD2BA] text-[#2B3A3B] text-sm font-semibold"
              onClick={() => setPopupOpen(true)}
            >
              選擇助理：{assistantOptions.find(opt => opt.value === model)?.label || '希希 Hibi'}
            </button>
            {popupOpen && (
              <PopupSelect
                mode="single"
                options={assistantOptions.map(opt => ({
                  label: opt.label,
                  value: opt.value,
                }))}
                selected={pendingModel}
                title="選擇 AI 助理"
                onCancel={() => {
                  setPendingModel(model);
                  setPopupOpen(false);
                }}
                onChange={(val) => setPendingModel(val as string)}
                onConfirm={() => {
                  setModel(pendingModel);
                  const greetingMap: Record<string, string> = {
                    'llama3-custom': '你好，我是希希，擅長幫你處理日常事務與分配工作，有甚麼可以幫到你？',
                    'gemma-2b': '你好，我是語語，擅長文字潤色與語言轉換，有甚麼可以幫你寫？',
                    'deepseek-r1-8b': '你好，我是策策，專長是數據分析與邏輯規劃，有什麼資料要幫你解讀？',
                    'llava-v1.6-7b': '你好，我是米米，擅長圖片理解與多模態分析，請給我圖片或任務吧！',
                  };
                  setMessages(prev => [
                    ...prev,
                    { sender: 'ai' as const, text: greetingMap[pendingModel] || '你好，有什麼可以幫你？', model: pendingModel },
                  ]);
                  setPopupOpen(false);
                }}
              />
            )}
          </div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#2B3A3B] flex items-center gap-2">
              <Image
                alt="avatar"
                className="rounded-full"
                height={32}
                src={assistantOptions.find(opt => opt.value === model)?.image || '/owlui.png'}
                width={32}
              />
              {assistantOptions.find(opt => opt.value === model)?.label || '希希 Hibi'}
            </h2>
            <button
              className="px-3 py-1 rounded-full bg-[#FFF8E6] border border-[#DDD2BA] text-[#2B3A3B] text-sm font-semibold flex items-center gap-2"
              onClick={() => window.location.assign('/admin/control')}
            >
              <Image alt="任務列表" height={20} src="/owlui.png" width={20} />
              任務列表
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#FFF8E6] rounded-lg p-3 text-[#2B3A3B] text-sm space-y-3 min-h-[300px]">
          {messages.map((msg, idx) => {
            const senderImage = assistantOptions.find(opt => opt.value === msg.model)?.image || '';
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 max-w-[80%] ${
                  msg.sender === 'user' ? 'self-start' : 'self-end ml-auto flex-row-reverse'
                }`}
              >
                {msg.sender === 'ai' && (
                  <Image
                    alt="assistant"
                    className="rounded-full mt-1"
                    height={28}
                    src={senderImage}
                    width={28}
                  />
                )}
                {/* 訊息氣泡與複製按鈕包裹 */}
                <div className="relative group">
                  <div
                    className={`rounded-xl px-4 py-2 ${
                      msg.sender === 'user' ? 'bg-[#FFF1DB]' : 'bg-[#F5DAB5]'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <button
                    className="absolute -top-2 -right-2 w-7 h-7 sm:w-6 sm:h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] hover:from-[#FF9BB3] hover:to-[#FFCC7A] text-white rounded-full shadow-lg transition-all flex items-center justify-center
                               opacity-0 group-hover:opacity-100 sm:opacity-100 touch-manipulation"
                    title="複製訊息內容"
                    onClick={() => {
                      navigator.clipboard.writeText(msg.text).then(() => {
                        console.log('已複製訊息：', msg.text);
                        // 可以添加 toast 通知
                      }).catch((error) => {
                        console.error('複製失敗:', error);
                        // 備用方案
                        try {
                          const textArea = document.createElement('textarea');
                          textArea.value = msg.text;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          console.log('已複製訊息（備用方案）：', msg.text);
                        } catch (fallbackError) {
                          console.error('備用複製方案也失敗:', fallbackError);
                        }
                      });
                    }}
                  >
                    <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 策策（Taku, deepseek-r1-8b）專用 WhatsApp 風格輸入欄，支援文字檔上傳 */}
        {model === 'deepseek-r1-8b' && (
          <div className="flex mt-4 items-center bg-[#FFFDF5] rounded-lg border border-[#DDD2BA] px-2 py-1">
            {/* 上傳文字檔案按鈕 */}
            <label className="text-3xl text-[#2B3A3B] cursor-pointer select-none mr-2" htmlFor="upload-text">＋</label>
            <input
              accept=".txt,.md,.csv"
              className="hidden"
              id="upload-text"
              type="file"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                setInput(text.slice(0, 3000)); // 限制長度避免超過 token
              }}
            />
            {/* 輸入框 */}
            <input
              className="flex-1 px-2 py-2 bg-transparent outline-none text-sm"
              placeholder="輸入訊息..."
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-[#EBC9A4] text-[#2B3A3B] font-semibold rounded-lg ml-2"
              onClick={() => {
                if (!input.trim()) return;
                const newMessages = [...messages, { sender: 'user' as const, text: input, model }];
                setMessages(newMessages);
                setInput('');
                const assistantLabel = assistantOptions.find(opt => opt.value === model)?.label || '';
                setMessages(prev => [...prev, { sender: 'ai' as const, text: `${assistantLabel} 正在思考中...`, model }]);
                const webhookMap: Record<string, string> = {
                  'llama3-custom': 'http://10.147.19.122:5678/webhook/d5c7aec9-194c-4f70-812e-d62ae4984e95',
                  'deepseek-r1-8b': 'http://10.147.19.122:5678/webhook/895a02fe-e4e3-4b95-b362-778ab66a82b3',
                  'llava-v1.6-7b': 'http://10.147.19.122:5678/webhook/a94f62fe-81df-4139-bde9-4538a8dcc5ed',
                  'gemma-2b': 'http://10.147.19.122:5678/webhook/e88057ab-a96c-4e7e-880d-1ad17cd9169e',
                };
                const webhookURL = webhookMap[model];
                if (webhookURL) {
                  fetch(webhookURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: input }),
                  })
                    .then(res => res.json())
                    .then(data => {
                      const replyText = data.reply || data.output || data.message || JSON.stringify(data);
                      setMessages(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (
                          lastIndex >= 0 &&
                        updated[lastIndex].sender === 'ai' &&
                        updated[lastIndex].text.includes('正在思考中')
                        ) {
                          updated[lastIndex] = { ...updated[lastIndex], text: replyText };
                        } else {
                          updated.push({ sender: 'ai' as const, text: replyText, model });
                        }
                        return updated;
                      });
                    })
                    .catch(() => {
                      setMessages(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (
                          lastIndex >= 0 &&
                        updated[lastIndex].sender === 'ai' &&
                        updated[lastIndex].text.includes('正在思考中')
                        ) {
                          updated[lastIndex] = { ...updated[lastIndex], text: '出現錯誤，請稍後再試' };
                        } else {
                          updated.push({ sender: 'ai' as const, text: '出現錯誤，請稍後再試', model });
                        }
                        return updated;
                      });
                    });
                }
              }}
            >
              Send
            </button>
          </div>
        )}
        {/* 輸入欄區塊：一般模式（非 llava-v1.6-7b、deepseek-r1-8b） */}
        {model !== 'llava-v1.6-7b' && model !== 'deepseek-r1-8b' && (
          <div className="flex mt-4">
            <input
              className="flex-1 px-4 py-2 rounded-l-lg border-t border-l border-b border-[#DDD2BA] bg-[#FFFDF5] text-sm"
              placeholder="Message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-[#EBC9A4] text-[#2B3A3B] font-semibold rounded-r-lg"
              onClick={() => {
                if (!input.trim()) return;
                const newMessages = [...messages, { sender: 'user' as const, text: input, model }];
                setMessages(newMessages);
                setInput('');

                const assistantLabel = assistantOptions.find(opt => opt.value === model)?.label || '';
                setMessages(prev => [...prev, { sender: 'ai' as const, text: `${assistantLabel} 正在思考中...`, model }]);

                const webhookMap: Record<string, string> = {
                  'llama3-custom': 'http://10.147.19.122:5678/webhook/d5c7aec9-194c-4f70-812e-d62ae4984e95',
                  'deepseek-r1-8b': 'http://10.147.19.122:5678/webhook/895a02fe-e4e3-4b95-b362-778ab66a82b3',
                  'llava-v1.6-7b': 'http://10.147.19.122:5678/webhook/a94f62fe-81df-4139-bde9-4538a8dcc5ed',
                  'gemma-2b': 'http://10.147.19.122:5678/webhook/e88057ab-a96c-4e7e-880d-1ad17cd9169e',
                };

                const webhookURL = webhookMap[model];

                if (webhookURL) {
                  fetch(webhookURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: input }),
                  })
                    .then(res => {
                      const ct = res.headers.get('content-type') || '';
                      return ct.includes('application/json') ? res.json() : res.text().then(text => ({ response: text }));
                    })
                    .then(data => {
                      const raw = data;
                      console.log('Webhook actual reply:', raw);
                      let replyText = '';
                      if (raw && raw.code === 0) {
                        replyText = `抱歉，${assistantLabel}的大腦當機了，請稍後再試`;
                      } else if (typeof raw === 'string') {
                        replyText = raw;
                      } else if (raw.output) {
                        replyText = raw.output;
                      } else if (raw.response) {
                        replyText = raw.response;
                      } else if (raw.message) {
                        replyText = raw.message;
                      } else if (raw.text) {
                        replyText = raw.text;
                      } else {
                        replyText = JSON.stringify(raw);
                      }
                      // Remove <|end_of_text|> string if present
                      replyText = replyText.replace(/<\|end_of_text\|>/g, '');
                      setMessages(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (
                          lastIndex >= 0 &&
                        updated[lastIndex].sender === 'ai' &&
                        updated[lastIndex].text.includes('正在思考中')
                        ) {
                          updated[lastIndex] = { ...updated[lastIndex], text: replyText };
                        } else {
                          updated.push({ sender: 'ai' as const, text: replyText, model });
                        }
                        return updated;
                      });
                    })
                    .catch(err => {
                      console.error('Webhook error:', err);
                      setMessages(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (
                          lastIndex >= 0 &&
                        updated[lastIndex].sender === 'ai' &&
                        updated[lastIndex].text.includes('正在思考中')
                        ) {
                          updated[lastIndex] = { ...updated[lastIndex], text: '抱歉，他的大腦當機了，請稍後再試' };
                        } else {
                          updated.push({ sender: 'ai' as const, text: '抱歉，他的大腦當機了，請稍後再試', model });
                        }
                        return updated;
                      });
                    });
                } else {
                  // simulate AI response for other models
                  setTimeout(() => {
                    setMessages((msgs) => [
                      ...msgs,
                      { sender: 'ai' as const, text: '抱歉，他正在忙碌中...，請稍後再試', model },
                    ]);
                  }, 1000);
                }
              }}
            >
              Send
            </button>
          </div>
        )}

        {/* 輸入欄區塊：Mimi 模式（WhatsApp 風格） */}
        {model === 'llava-v1.6-7b' && (
          <div className="flex mt-4 items-center bg-[#FFFDF5] rounded-lg border border-[#DDD2BA] px-2 py-1">
            {/* 上傳圖示 */}
            <label className="text-3xl text-[#2B3A3B] cursor-pointer select-none mr-2" htmlFor="upload-photo">＋</label>
            <input accept="image/*" className="hidden" id="upload-photo" type="file" onChange={() => alert('🖼️ 圖片上傳尚未實作')} />
            {/* 拍照圖示 */}
            <button className="w-6 h-6 mr-2 flex items-center justify-center" onClick={() => setShowCamera(true)}>
              <Image alt="camera" height={24} src="/camera.png" width={24} />
            </button>
            <input
              className="flex-1 px-2 py-2 bg-transparent outline-none text-sm"
              placeholder="Message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-[#EBC9A4] text-[#2B3A3B] font-semibold rounded-lg ml-2"
              onClick={() => {
                if (!input.trim()) return;
                const newMessages = [...messages, { sender: 'user' as const, text: input, model }];
                setMessages(newMessages);
                setInput('');

                const assistantLabel = assistantOptions.find(opt => opt.value === model)?.label || '';
                setMessages(prev => [...prev, { sender: 'ai' as const, text: `${assistantLabel} 正在思考中...`, model }]);

                const webhookMap: Record<string, string> = {
                  'llama3-custom': 'http://10.147.19.122:5678/webhook/d5c7aec9-194c-4f70-812e-d62ae4984e95',
                  'deepseek-r1-8b': 'http://10.147.19.122:5678/webhook/895a02fe-e4e3-4b95-b362-778ab66a82b3',
                  'llava-v1.6-7b': 'http://10.147.19.122:5678/webhook/a94f62fe-81df-4139-bde9-4538a8dcc5ed',
                  'gemma-2b': 'http://10.147.19.122:5678/webhook/e88057ab-a96c-4e7e-880d-1ad17cd9169e',
                };

                const webhookURL = webhookMap[model];

                if (webhookURL) {
                  fetch(webhookURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: input }),
                  })
                    .then(res => {
                      const ct = res.headers.get('content-type') || '';
                      return ct.includes('application/json') ? res.json() : res.text().then(text => ({ response: text }));
                    })
                    .then(data => {
                      const raw = data;
                      console.log('Webhook actual reply:', raw);
                      let replyText = '';
                      if (raw && raw.code === 0) {
                        replyText = `抱歉，${assistantLabel}的大腦當機了，請稍後再試`;
                      } else if (typeof raw === 'string') {
                        replyText = raw;
                      } else if (raw.output) {
                        replyText = raw.output;
                      } else if (raw.response) {
                        replyText = raw.response;
                      } else if (raw.message) {
                        replyText = raw.message;
                      } else if (raw.text) {
                        replyText = raw.text;
                      } else {
                        replyText = JSON.stringify(raw);
                      }
                      // Remove <|end_of_text|> string if present
                      replyText = replyText.replace(/<\|end_of_text\|>/g, '');
                      setMessages(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (
                          lastIndex >= 0 &&
                        updated[lastIndex].sender === 'ai' &&
                        updated[lastIndex].text.includes('正在思考中')
                        ) {
                          updated[lastIndex] = { ...updated[lastIndex], text: replyText };
                        } else {
                          updated.push({ sender: 'ai' as const, text: replyText, model });
                        }
                        return updated;
                      });
                    })
                    .catch(err => {
                      console.error('Webhook error:', err);
                      setMessages(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (
                          lastIndex >= 0 &&
                        updated[lastIndex].sender === 'ai' &&
                        updated[lastIndex].text.includes('正在思考中')
                        ) {
                          updated[lastIndex] = { ...updated[lastIndex], text: '抱歉，他的大腦當機了，請稍後再試' };
                        } else {
                          updated.push({ sender: 'ai' as const, text: '抱歉，他的大腦當機了，請稍後再試', model });
                        }
                        return updated;
                      });
                    });
                } else {
                  // simulate AI response for other models
                  setTimeout(() => {
                    setMessages((msgs) => [
                      ...msgs,
                      { sender: 'ai' as const, text: '抱歉，他正在忙碌中...，請稍後再試', model },
                    ]);
                  }, 1000);
                }
              }}
            >
              Send
            </button>
          </div>
        )}

        {/* Mimi 模式下的拍照與預覽區塊 */}
        {model === 'llava-v1.6-7b' && (
          <>
            {/* 拍照相機浮動懸浮視窗 */}
            {showCamera && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/10">
                <div className="bg-white p-4 rounded-lg shadow-lg w-[350px] max-w-full">
                  <video ref={videoRef} className="rounded border mb-2" height={240} width={320} />
                  <canvas ref={canvasRef} className="hidden" height={240} width={320} />
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-3 py-1 text-sm bg-[#EBC9A4] rounded-md"
                      onClick={() => {
                        if (!canvasRef.current || !videoRef.current) return;
                        const ctx = canvasRef.current.getContext('2d');
                        if (!ctx) return;
                        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                        const data = canvasRef.current.toDataURL('image/png');
                        setPhotoPreview(data);
                        setShowCamera(false);
                      }}
                    >
                      拍照
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-gray-300 rounded-md"
                      onClick={() => setShowCamera(false)}
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* 拍照預覽與送出 */}
            {photoPreview && (
              <div className="mt-2 flex flex-col items-end">
                <img alt="preview" className="w-40 rounded border mb-2" src={photoPreview} />
                <button
                  className="px-3 py-1 text-sm bg-[#EBC9A4] rounded-md"
                  onClick={async () => {
                    setMessages(prev => [...prev, { sender: 'user' as const, text: '已上傳相片，等待回應...', model }]);
                    const webhookURL = 'http://10.147.19.122:5678/webhook/a94f62fe-81df-4139-bde9-4538a8dcc5ed';
                    const payload = new FormData();
                    const blob = await (await fetch(photoPreview)).blob();
                    payload.append('image', blob, 'photo.png');
                    fetch(webhookURL, {
                      method: 'POST',
                      body: payload,
                    })
                      .then(r => r.json())
                      .then(d => {
                        const replyText = d.reply || d.output || d.message || JSON.stringify(d);
                        setMessages(prev => {
                          const updated = [...prev];
                          const lastIndex = updated.length - 1;
                          if (
                            lastIndex >= 0 &&
                        updated[lastIndex].sender === 'ai' &&
                        updated[lastIndex].text.includes('正在思考中')
                          ) {
                            updated[lastIndex] = { ...updated[lastIndex], text: replyText };
                          } else {
                            updated.push({ sender: 'ai' as const, text: replyText, model });
                          }
                          return updated;
                        });
                      })
                      .catch(() => {
                        setMessages(prev => {
                          const updated = [...prev];
                          const lastIndex = updated.length - 1;
                          if (
                            lastIndex >= 0 &&
                        updated[lastIndex].sender === 'ai' &&
                        updated[lastIndex].text.includes('正在思考中')
                          ) {
                            updated[lastIndex] = { ...updated[lastIndex], text: '圖片處理時發生錯誤' };
                          } else {
                            updated.push({ sender: 'ai' as const, text: '圖片處理時發生錯誤', model });
                          }
                          return updated;
                        });
                      });
                    setPhotoPreview(null);
                  }}
                >
                  送出圖片
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}