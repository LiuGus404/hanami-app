'use client';

import { useState, useEffect } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { Phone, TestTube, CheckCircle, XCircle } from 'lucide-react';

export default function TestPhoneProfilesPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('+852-1234-5678');

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    const tests = [
      {
        name: '測試電話檔案 API 連接',
        test: async () => {
          const response = await fetch(`/api/phone-profiles/${encodeURIComponent(testPhone)}`);
          if (response.ok) {
            const data = await response.json();
            return { success: true, data };
          } else if (response.status === 404) {
            return { success: true, message: '電話檔案不存在（正常情況）' };
          } else {
            const error = await response.text();
            return { success: false, error };
          }
        }
      },
      {
        name: '測試創建電話檔案',
        test: async () => {
          const testData = {
            person_name: '胡烯晴家長',
            personality_traits: '這是一個測試檔案，用於驗證系統功能。家長對音樂教育非常重視，願意投入時間和金錢。',
            needs: '希望孩子能夠在音樂方面有所成就，培養藝術修養和自信心。',
            attitude: '積極正面，對機構服務滿意，但對進度有較高期望。',
            level: 'C',
            important_notes: '這是一個測試檔案，展示完整的分析功能。',
            analysis_structured: {
              "risk": {
                "level": "medium",
                "risks": [
                  "出席不穩定（家長 9 月大部分日子無法上堂）→ 影響學習連貫性與續約率",
                  "未確認付款（試堂/12堂費用）→ 若未即時付款可能流失名額",
                  "家長需較多操作資訊（改期、病假證明）→ 若流程不清易引起摩擦或延遲"
                ],
                "rationale": "家長態度禮貌且有購買意向，但時段受限與頻繁出差/旅行使出席連續性風險存在。"
              },
              "basic": {
                "tags": [
                  "家長",
                  "預約12堂",
                  "試堂",
                  "留位",
                  "時段受限（平日上班）",
                  "已取消",
                  "改期",
                  "待付",
                  "確認付款（視情況）"
                ],
                "phone": testPhone,
                "source": "WhatsApp（推斷）",
                "student": "Helia ／ 學生OID：fd08d847",
                "assignee": "待指派",
                "relation": "家長（推斷）",
                "name_note": "胡烯晴 (Helia)（家長稱呼待確認）",
                "created_at_guess": "2024-12-19",
                "last_interaction": "家長 → 我們（最後訊息 2024-12-19）"
              },
              "persona": {
                "comm_style": "用語為廣東話（短句、禮貌、有表情符號），回覆節奏在關鍵時刻積極（會即時調整班次）；平時互動訊息量少。",
                "parent_care": {
                  "raw": "4/5 — 證據：已主動預約、詢問多項課務操作問題且有預約/改期行為。",
                  "evidence": "已主動預約、詢問多項課務操作問題且有預約/改期行為。",
                  "score_1to5": 4
                },
                "child_liking": {
                  "raw": "3/5 — 證據：家長填報偏好「聽歌／食物／書」，並主動報名音樂專注力課，但對上課反饋尚無明確正向回饋（需課後回訪）。",
                  "evidence": "家長填報偏好「聽歌／食物／書」，並主動報名音樂專注力課，但對上課反饋尚無明確正向回饋（需課後回訪）。",
                  "score_1to5": 3
                },
                "org_affinity": {
                  "raw": "4/5 — 證據：主動詢問並暫報 12 堂，追問價格（顯示購買意願）。",
                  "evidence": "主動詢問並暫報 12 堂，追問價格（顯示購買意願）。",
                  "score_1to5": 4
                },
                "home_practice": {
                  "raw": "未知（對話無提及是否有鋼琴或電子琴）→ 標註「待確認」。練習頻率：待確認。",
                  "size": null,
                  "type": "鋼琴",
                  "model": null,
                  "practice_freq": "待確認。",
                  "has_instrument": "有鋼琴"
                },
                "reminder_prefs": "會主動告知臨時缺席（生病/出差），對課堂是否取消、改期等資訊會尋求明確指示；偏好 WhatsApp 溝通。建議提醒節奏：堂前 3 天、堂前 1 天、當日早上、課後回訪。",
                "decision_spending": "有意購買（詢問12堂價格），價格有關心但未直接談價錢談退讓；傾向先試堂再決定。",
                "child_focus_points": [],
                "learning_expectations": []
              },
              "sources": {
                "phone": testPhone,
                "stats": "最近30天；訊息數（對方→我們/我們→對方）： 2/ 0",
                "last_time": "2024-12-19 14:30:00",
                "first_time": "2024-12-19 14:25:00；末訊時間：2024-12-19 14:30:00"
              },
              "highlights": [
                "已預約試堂並被告知需付款確認留位（試堂留位費 $138，付款方式 fps/payme）。",
                "家長表達想報12堂（詢問 $2588 價格），但實際上 9 月只有 9/9 與 9/30 可上。",
                "曾因小朋友發燒/手足口病取消並詢問是否需提供證明改期（有主動通知、配合改期）。",
                "多次詢問課堂遇紅雨會否取消、家長可否陪同等流程性問題（關心操作細節）。",
                "最近30天互動量低（對方→我們：2 / 我們→對方：0），但仍維持預約意向與溝通。"
              ],
              "priorities": [],
              "crm_suggestions": {
                "data_gaps": [],
                "labels_add": [],
                "fields_update": [],
                "assignment_sop": null,
                "attendance_makeup": null
              },
              "renew_and_payment": {
                "proven_flows": [],
                "payment_prefs": null,
                "canned_scripts": [],
                "reminder_cadence": [],
                "require_screenshot": null
              }
            }
          };

          const response = await fetch(`/api/phone-profiles/${encodeURIComponent(testPhone)}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
          });

          if (response.ok) {
            const data = await response.json();
            return { success: true, data };
          } else {
            const error = await response.text();
            return { success: false, error };
          }
        }
      },
      {
        name: '測試獲取已創建的電話檔案',
        test: async () => {
          const response = await fetch(`/api/phone-profiles/${encodeURIComponent(testPhone)}`);
          if (response.ok) {
            const data = await response.json();
            return { success: true, data };
          } else {
            const error = await response.text();
            return { success: false, error };
          }
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          name: test.name,
          success: result.success,
          data: result.data || (result as any).message,
          error: result.error
        });
      } catch (error) {
        results.push({
          name: test.name,
          success: false,
          error: error instanceof Error ? error.message : '未知錯誤'
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-[#FFD59A] rounded-xl mr-4">
              <TestTube className="w-6 h-6 text-[#2B3A3B]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2B3A3B]">電話檔案系統測試</h1>
              <p className="text-[#2B3A3B]/70">測試 saas_phone_profiles 表的 API 功能</p>
            </div>
          </div>
        </div>

        <HanamiCard className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">測試配置</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#2B3A3B]/70 mb-2">
                  測試電話號碼
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  placeholder="輸入測試電話號碼"
                />
              </div>
              <div className="flex items-end">
                <HanamiButton
                  onClick={runTests}
                  disabled={loading}
                  className="flex items-center"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {loading ? '測試中...' : '開始測試'}
                </HanamiButton>
              </div>
            </div>
          </div>
        </HanamiCard>

        {testResults.length > 0 && (
          <HanamiCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">測試結果</h2>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-[#2B3A3B]">{result.name}</h3>
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    
                    {result.success ? (
                      <div className="text-sm text-[#2B3A3B]/70">
                        {typeof result.data === 'string' ? (
                          <p>{result.data}</p>
                        ) : (
                          <pre className="bg-white p-3 rounded border text-xs overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        <p>錯誤: {result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </HanamiCard>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-[#2B3A3B] mb-2">使用說明</h3>
          <ul className="text-sm text-[#2B3A3B]/70 space-y-1">
            <li>• 此頁面用於測試電話檔案系統的 API 功能</li>
            <li>• 測試會創建、讀取和驗證電話檔案資料</li>
            <li>• 如果測試成功，表示系統已正確配置</li>
            <li>• 測試完成後，可以在學生詳情頁面的「電話檔案」分頁中查看功能</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
