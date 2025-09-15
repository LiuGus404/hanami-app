'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  ClipboardDocumentIcon,
  CheckCircleIcon,
  EyeIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

export default function EmailTemplateCopyPage() {
  const [copied, setCopied] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('simple');

  const simpleTemplate = `<div style="text-align: center; margin: 30px 0;">
    <h2 style="color: #2B3A3B; font-size: 28px; margin-bottom: 20px; background: linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        🎯 歡迎加入 HanamiEcho！
    </h2>
    
    <p style="color: #4B4036; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">
        您已受邀加入 HanamiEcho AI 學習平台。點擊下方按鈕完成註冊，開始您的智能學習之旅：
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%); color: #2B3A3B; padding: 18px 36px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px; box-shadow: 0 8px 25px rgba(255, 213, 154, 0.4); transition: all 0.3s ease;">
            ✨ 確認我的帳戶
        </a>
    </div>
    
    <div style="background: rgba(255, 213, 154, 0.1); border-radius: 15px; padding: 20px; margin: 25px 0; border-left: 4px solid #FFD59A;">
        <p style="color: #4B4036; font-size: 14px; margin: 0; text-align: left;">
            <strong>🎯 確認後您將獲得：</strong><br>
            • 專屬 AI 學習伙伴<br>
            • 個性化學習體驗<br>
            • 豐富的教育資源<br>
            • 家庭協作功能
        </p>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px;">
        如果您沒有註冊 HanamiEcho，請忽略此郵件。<br>
        此郵件由 HanamiEcho 系統自動發送。
    </p>
</div>`;

  const fullTemplate = `<!DOCTYPE html>
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
                <span>與您的專屬 AI 角色互動</span>
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTemplate = activeTemplate === 'simple' ? simpleTemplate : fullTemplate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            郵件模板複製工具
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            選擇並複製 HanamiEcho 品牌郵件模板
          </p>
        </div>

        {/* 模板選擇 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/50 rounded-xl p-1 border border-[#EADBC8]">
            <button
              onClick={() => setActiveTemplate('simple')}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                activeTemplate === 'simple'
                  ? 'bg-[#FFD59A] text-[#4B4036]'
                  : 'text-[#2B3A3B] hover:bg-white/30'
              }`}
            >
              簡化版本
            </button>
            <button
              onClick={() => setActiveTemplate('full')}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                activeTemplate === 'full'
                  ? 'bg-[#FFD59A] text-[#4B4036]'
                  : 'text-[#2B3A3B] hover:bg-white/30'
              }`}
            >
              完整版本
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 模板預覽 */}
          <HanamiCard className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <EyeIcon className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-bold text-[#4B4036]">
                模板預覽
              </h2>
            </div>
            
            <div className="bg-white border border-[#EADBC8] rounded-lg p-4 max-h-96 overflow-y-auto">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: currentTemplate.replace('{{ .ConfirmationURL }}', '#').replace('{{ .SiteURL }}', '#')
                }}
              />
            </div>
          </HanamiCard>

          {/* 模板代碼 */}
          <HanamiCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CodeBracketIcon className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-bold text-[#4B4036]">
                  模板代碼
                </h2>
              </div>
              <HanamiButton
                onClick={() => copyToClipboard(currentTemplate)}
                size="sm"
                variant="secondary"
                className="flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>已複製</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    <span>複製</span>
                  </>
                )}
              </HanamiButton>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto max-h-96 whitespace-pre-wrap">
                {currentTemplate}
              </pre>
            </div>
          </HanamiCard>
        </div>

        {/* 使用說明 */}
        <HanamiCard className="p-6 mt-6">
          <h2 className="text-xl font-bold text-[#4B4036] mb-4">
            使用說明
          </h2>
          <div className="space-y-3 text-[#2B3A3B]">
            <div className="flex items-start space-x-3">
              <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
              <p>點擊「複製」按鈕複製模板代碼</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
              <p>前往 Supabase 控制台 → Authentication → Email Templates</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
              <p>找到 "Invite user" 模板，點擊 "Edit"</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
              <p>將複製的代碼粘貼到編輯器中，保存更改</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</span>
              <p>使用測試工具發送郵件查看新模板效果</p>
            </div>
          </div>
        </HanamiCard>

        <div className="text-center mt-8 space-x-4">
          <HanamiButton
            onClick={() => window.location.href = '/aihome/test-smtp'}
            size="lg"
            variant="secondary"
          >
            測試新模板
          </HanamiButton>
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

