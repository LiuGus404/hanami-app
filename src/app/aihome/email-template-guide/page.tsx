'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  EnvelopeIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CodeBracketIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function EmailTemplateGuidePage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '問題說明', icon: ExclamationTriangleIcon },
    { id: 'template', label: '自定義模板', icon: CodeBracketIcon },
    { id: 'setup', label: '配置步驟', icon: CogIcon },
    { id: 'preview', label: '預覽效果', icon: EyeIcon }
  ];

  const customTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>確認您的 HanamiEcho 帳戶</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #FFF9F2 0%, #FFFDF8 50%, #FFD59A 100%);
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(255, 213, 154, 0.3);
            border: 2px solid #FFD59A;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #2B3A3B;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%);
            color: #2B3A3B;
            padding: 18px 36px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            font-size: 18px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 8px 25px rgba(255, 213, 154, 0.4);
            transition: all 0.3s ease;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(255, 213, 154, 0.6);
        }
        .feature-item {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 15px;
            background: rgba(255, 213, 154, 0.1);
            border-radius: 15px;
            border-left: 4px solid #FFD59A;
        }
        .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 15px;
            border-radius: 50%;
        }
        .target-icon { background: #FFD59A; }
        .book-icon { background: #EBC9A4; }
        .star-icon { background: #FFB6C1; }
        .heart-icon { background: #FFB6C1; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #FFD59A;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">HanamiEcho</div>
            <div class="title">歡迎加入我們的 AI 學習之旅！</div>
        </div>
        
        <div class="content">
            <p>親愛的用戶，</p>
            
            <p>感謝您註冊 HanamiEcho！我們很高興您選擇加入我們的 AI 學習平台。</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">確認我的電子郵件</a>
            </div>
            
            <p>確認後，您將能夠：</p>
            <div class="feature-item">
                <span class="icon target-icon"></span>
                <span>與您的專屬 3D AI 角色互動</span>
            </div>
            <div class="feature-item">
                <span class="icon book-icon"></span>
                <span>享受個性化的學習體驗</span>
            </div>
            <div class="feature-item">
                <span class="icon star-icon"></span>
                <span>探索豐富的 AI 功能</span>
            </div>
            <div class="feature-item">
                <span class="icon heart-icon"></span>
                <span>為您的孩子提供優質的教育內容</span>
            </div>
            
            <p>如果您沒有註冊 HanamiEcho 帳戶，請忽略此郵件。</p>
        </div>
        
        <div class="footer">
            <p>此郵件由 HanamiEcho 系統自動發送，請勿回覆。</p>
            <p>如有疑問，請聯繫我們的客服團隊。</p>
            <p style="margin-top: 15px;">
                <a href="{{ .SiteURL }}" style="color: #FFD59A; text-decoration: none; font-weight: bold;">訪問 HanamiEcho</a>
            </p>
        </div>
    </div>
</body>
</html>`;

  const copyTemplate = () => {
    navigator.clipboard.writeText(customTemplate);
    alert('模板已複製到剪貼板！');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            自定義郵件模板配置
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            將 Supabase 默認模板替換為 HanamiEcho 品牌模板
          </p>
        </div>

        {/* 標籤導航 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/50 rounded-xl p-1 border border-[#EADBC8]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#FFD59A] text-[#4B4036]'
                      : 'text-[#2B3A3B] hover:bg-white/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 內容區域 */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                    問題說明
                  </h2>
                  <div className="space-y-4 text-[#2B3A3B]">
                    <p>
                      您收到的郵件是 Supabase 的默認邀請模板，內容簡單且沒有品牌特色。
                    </p>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-800 mb-2">當前收到的郵件：</h3>
                      <div className="bg-white p-3 rounded border text-sm">
                        <p><strong>發件人：</strong> HanamiEChoAI &lt;lulu@hanamiecho.com&gt;</p>
                        <p><strong>主題：</strong> You have been invited</p>
                        <p><strong>內容：</strong> 簡單的邀請鏈接，沒有品牌設計</p>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">我們要實現的效果：</h3>
                      <div className="bg-white p-3 rounded border text-sm">
                        <p><strong>發件人：</strong> HanamiEcho &lt;noreply@hanamiecho.com&gt;</p>
                        <p><strong>主題：</strong> 確認您的 HanamiEcho 帳戶</p>
                        <p><strong>內容：</strong> 精美的品牌設計，包含 HanamiEcho 特色</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}

          {activeTab === 'template' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <CodeBracketIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                    自定義郵件模板
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">HanamiEcho 品牌模板</h3>
                      <p className="text-blue-700 text-sm mb-3">
                        這個模板包含 HanamiEcho 的品牌色彩、Logo 和特色功能介紹
                      </p>
                      <HanamiButton
                        onClick={copyTemplate}
                        size="sm"
                        variant="secondary"
                      >
                        複製模板代碼
                      </HanamiButton>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">模板代碼</h3>
                      <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto max-h-96">
                        {customTemplate}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}

          {activeTab === 'setup' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <CogIcon className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-6">
                    配置步驟
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-purple-800 mb-4">
                        步驟 1：前往 Supabase 控制台
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-purple-700">
                        <li>登入 Supabase 控制台</li>
                        <li>選擇您的項目</li>
                        <li>導航至 <code className="bg-white px-2 py-1 rounded">Authentication → Email Templates</code></li>
                      </ol>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-green-800 mb-4">
                        步驟 2：配置邀請郵件模板
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-green-700">
                        <li>找到 "Invite user" 模板</li>
                        <li>點擊 "Edit" 按鈕</li>
                        <li>將提供的 HTML 模板代碼粘貼到編輯器中</li>
                        <li>保存更改</li>
                      </ol>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-blue-800 mb-4">
                        步驟 3：配置其他郵件模板（可選）
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-blue-700">
                        <li>Sign up confirmation（註冊確認）</li>
                        <li>Password reset（密碼重置）</li>
                        <li>Magic link（魔法鏈接）</li>
                        <li>Email change（郵箱更改）</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-yellow-800 mb-4">
                        步驟 4：測試新模板
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                        <li>使用我們的測試工具發送測試郵件</li>
                        <li>檢查郵件是否使用新模板</li>
                        <li>確認所有鏈接正常工作</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}

          {activeTab === 'preview' && (
            <HanamiCard className="p-6">
              <div className="flex items-start space-x-4">
                <EyeIcon className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                    模板預覽效果
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">模板特色</h3>
                      <ul className="list-disc list-inside space-y-1 text-green-700">
                        <li>HanamiEcho 品牌色彩和 Logo</li>
                        <li>響應式設計，適配各種設備</li>
                        <li>精美的按鈕和動畫效果</li>
                        <li>功能特色介紹</li>
                        <li>專業的頁腳信息</li>
                      </ul>
                    </div>

                    <div className="bg-white border border-[#EADBC8] rounded-lg p-4">
                      <h3 className="font-semibold text-[#4B4036] mb-2">視覺效果</h3>
                      <div className="text-sm text-[#2B3A3B] space-y-2">
                        <p>• 溫暖的櫻花色漸層背景</p>
                        <p>• 圓潤可愛的設計風格</p>
                        <p>• 清晰的品牌標識</p>
                        <p>• 突出的確認按鈕</p>
                        <p>• 功能特色圖標展示</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">測試建議</h3>
                      <div className="space-y-2">
                        <HanamiButton
                          onClick={() => window.location.href = '/aihome/test-smtp'}
                          size="sm"
                          variant="secondary"
                        >
                          測試新模板
                        </HanamiButton>
                        <p className="text-blue-700 text-sm">
                          配置完成後，使用測試工具發送郵件來查看新模板效果
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </HanamiCard>
          )}
        </div>

        <div className="text-center mt-8">
          <HanamiButton
            onClick={() => window.location.href = '/aihome/dashboard'}
            size="lg"
          >
            返回儀表板
          </HanamiButton>
        </div>
      </div>
    </div>
  );
}

