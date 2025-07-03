'use client'

import { useState } from 'react'
import { runSimpleSchemaScan, SimpleDatabaseSchema } from '@/utils/simpleSchemaScanner'
import { runAdvancedSchemaScan, AdvancedDatabaseSchema } from '@/utils/advancedSchemaScanner'
import { supabase } from '@/lib/supabase'

type ScanMode = 'simple' | 'advanced'

export default function SchemaScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanMode, setScanMode] = useState<ScanMode>('simple')
  const [simpleSchema, setSimpleSchema] = useState<SimpleDatabaseSchema | null>(null)
  const [advancedSchema, setAdvancedSchema] = useState<AdvancedDatabaseSchema | null>(null)
  const [report, setReport] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [scanResult, setScanResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleScan = async () => {
    setIsScanning(true)
    setError('')
    setSimpleSchema(null)
    setAdvancedSchema(null)
    setReport('')

    try {
      // 簡化掃描功能，直接使用 scanDatabase
      await scanDatabase()
      setReport('資料庫掃描完成，請查看掃描結果。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '掃描失敗')
    } finally {
      setIsScanning(false)
    }
  }

  const downloadReport = () => {
    if (!report) return
    
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supabase-schema-report-${scanMode}-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const schema = simpleSchema || advancedSchema

  const scanDatabase = async () => {
    setLoading(true)
    setScanResult('開始掃描資料庫...\n')

    try {
      // 檢查 hanami_student_lesson 表
      setScanResult(prev => prev + '\n🔍 檢查 hanami_student_lesson 表...\n')
      
      const { data: lessonData, error: lessonError } = await supabase
        .from('hanami_student_lesson')
        .select('*')
        .limit(10)
      
      if (lessonError) {
        setScanResult(prev => prev + `❌ 錯誤: ${lessonError.message}\n`)
        if (lessonError.code === 'PGRST116') {
          setScanResult(prev => prev + `💡 提示: 這可能是RLS權限問題，請執行 fix_hanami_student_lesson_rls.sql 腳本\n`)
        }
      } else {
        setScanResult(prev => prev + `✅ 找到 ${lessonData?.length || 0} 筆課堂記錄\n`)
        if (lessonData && lessonData.length > 0) {
          setScanResult(prev => prev + `📋 範例資料:\n${JSON.stringify(lessonData[0], null, 2)}\n`)
        }
      }

      // 檢查 Hanami_Students 表
      setScanResult(prev => prev + '\n🔍 檢查 Hanami_Students 表...\n')
      
      const { data: studentData, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_type')
        .limit(5)
      
      if (studentError) {
        setScanResult(prev => prev + `❌ 錯誤: ${studentError.message}\n`)
      } else {
        setScanResult(prev => prev + `✅ 找到 ${studentData?.length || 0} 筆學生記錄\n`)
        if (studentData && studentData.length > 0) {
          setScanResult(prev => prev + `📋 學生列表:\n${studentData.map(s => `${s.id}: ${s.full_name} (${s.student_type})`).join('\n')}\n`)
        }
      }

      // 檢查特定學生的課堂資料
      if (studentData && studentData.length > 0) {
        const testStudent = studentData[0]
        setScanResult(prev => prev + `\n🔍 檢查學生 ${testStudent.full_name} (${testStudent.student_type}) 的課堂資料...\n`)
        
        if (testStudent.student_type === '試堂' || testStudent.student_type === 'trial') {
          // 檢查試堂學生課堂資料
          const { data: trialLessons, error: trialLessonError } = await supabase
            .from('hanami_trial_students')
            .select('*')
            .eq('id', testStudent.id)
          
          if (trialLessonError) {
            setScanResult(prev => prev + `❌ 錯誤: ${trialLessonError.message}\n`)
          } else {
            setScanResult(prev => prev + `✅ 試堂學生課堂資料: ${JSON.stringify(trialLessons?.[0] || {}, null, 2)}\n`)
          }
        } else {
          // 檢查常規學生課堂資料
          const { data: studentLessons, error: studentLessonError } = await supabase
            .from('hanami_student_lesson')
            .select('*')
            .eq('student_id', testStudent.id)
          
          if (studentLessonError) {
            setScanResult(prev => prev + `❌ 錯誤: ${studentLessonError.message}\n`)
          } else {
            setScanResult(prev => prev + `✅ 該學生有 ${studentLessons?.length || 0} 筆課堂記錄\n`)
          }
        }
      }

    } catch (error) {
      setScanResult(prev => prev + `❌ 掃描失敗: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  const createTestData = async () => {
    setLoading(true)
    setScanResult('開始創建測試資料...\n')

    try {
      // 先獲取一個學生
      const { data: students, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_type')
        .limit(5)
      
      if (studentError || !students || students.length === 0) {
        setScanResult(prev => prev + '❌ 無法獲取學生資料\n')
        return
      }

      setScanResult(prev => prev + `📝 找到 ${students.length} 個學生，開始創建測試課堂資料...\n`)

      for (const student of students) {
        setScanResult(prev => prev + `\n🎯 為學生 ${student.full_name} (${student.id}) 創建課堂資料...\n`)
        
        if (student.student_type === '試堂' || student.student_type === 'trial') {
          // 試堂學生：更新 hanami_trial_students 表
          const { error: updateError } = await supabase
            .from('hanami_trial_students')
            .update({
              lesson_date: new Date().toISOString().split('T')[0],
              course_type: '鋼琴',
              actual_timeslot: '14:00-15:00',
              student_teacher: '張老師',
              lesson_duration: '00:45:00'
            })
            .eq('id', student.id)
          
          if (updateError) {
            setScanResult(prev => prev + `❌ 更新試堂學生課堂資料失敗: ${updateError.message}\n`)
          } else {
            setScanResult(prev => prev + `✅ 成功更新試堂學生課堂資料\n`)
          }
        } else {
          // 常規學生：在 hanami_student_lesson 表中創建記錄
          const testLessons = [
            {
              student_id: student.id,
              lesson_date: new Date().toISOString().split('T')[0], // 今天
              course_type: '鋼琴',
              actual_timeslot: '14:00-15:00',
              lesson_teacher: '張老師',
              lesson_status: '出席',
              full_name: student.full_name
            },
            {
              student_id: student.id,
              lesson_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 一週前
              course_type: '鋼琴',
              actual_timeslot: '14:00-15:00',
              lesson_teacher: '張老師',
              lesson_status: '出席',
              full_name: student.full_name
            },
            {
              student_id: student.id,
              lesson_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 一週後
              course_type: '鋼琴',
              actual_timeslot: '14:00-15:00',
              lesson_teacher: '張老師',
              lesson_status: null,
              full_name: student.full_name
            }
          ]

          for (const lesson of testLessons) {
            const { error: insertError } = await supabase
              .from('hanami_student_lesson')
              .insert(lesson)
            
            if (insertError) {
              setScanResult(prev => prev + `❌ 創建課堂資料失敗: ${insertError.message}\n`)
            } else {
              setScanResult(prev => prev + `✅ 成功創建課堂資料: ${lesson.lesson_date}\n`)
            }
          }
        }
      }

      setScanResult(prev => prev + '\n🎉 測試資料創建完成！\n')

    } catch (error) {
      setScanResult(prev => prev + `❌ 創建測試資料失敗: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  const checkSpecificStudent = async () => {
    setLoading(true)
    setScanResult('開始檢查特定學生課堂資料...\n')

    try {
      // 獲取第一個學生
      const { data: students, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_type')
        .limit(1)
      
      if (studentError || !students || students.length === 0) {
        setScanResult(prev => prev + '❌ 無法獲取學生資料\n')
        return
      }

      const student = students[0]
      setScanResult(prev => prev + `🎯 檢查學生 ${student.full_name} (${student.id}) 的課堂資料...\n`)

      if (student.student_type === '試堂' || student.student_type === 'trial') {
        // 檢查試堂學生
        const { data: trialData, error: trialError } = await supabase
          .from('hanami_trial_students')
          .select('*')
          .eq('id', student.id)
        
        if (trialError) {
          setScanResult(prev => prev + `❌ 查詢試堂學生資料失敗: ${trialError.message}\n`)
        } else {
          setScanResult(prev => prev + `✅ 試堂學生資料: ${JSON.stringify(trialData, null, 2)}\n`)
        }
      } else {
        // 檢查常規學生的課堂資料
        const { data: lessonData, error: lessonError } = await supabase
          .from('hanami_student_lesson')
          .select('*')
          .eq('student_id', student.id)
        
        if (lessonError) {
          setScanResult(prev => prev + `❌ 查詢課堂資料失敗: ${lessonError.message}\n`)
        } else {
          setScanResult(prev => prev + `✅ 課堂資料數量: ${lessonData?.length || 0}\n`)
          if (lessonData && lessonData.length > 0) {
            setScanResult(prev => prev + `📋 課堂資料: ${JSON.stringify(lessonData[0], null, 2)}\n`)
          }
        }
      }

    } catch (error) {
      setScanResult(prev => prev + `❌ 檢查失敗: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Supabase 資料庫結構掃描器</h1>
        <p className="text-gray-600 mb-6">
          掃描並分析 Supabase 資料庫的所有表格、欄位和 RLS 策略
        </p>
        
        {/* 掃描模式選擇 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">選擇掃描模式:</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="simple"
                checked={scanMode === 'simple'}
                onChange={(e) => setScanMode(e.target.value as ScanMode)}
                className="mr-2"
              />
              <span>簡單掃描 (基本資訊)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="advanced"
                checked={scanMode === 'advanced'}
                onChange={(e) => setScanMode(e.target.value as ScanMode)}
                className="mr-2"
              />
              <span>進階掃描 (完整資訊，需要 RPC 函數)</span>
            </label>
          </div>
        </div>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? '掃描中...' : `開始${scanMode === 'simple' ? '簡單' : '進階'}掃描`}
          </button>
          
          {report && (
            <button
              onClick={downloadReport}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              下載報告
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>錯誤:</strong> {error}
          </div>
        )}

        {scanMode === 'advanced' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <strong>注意:</strong> 進階掃描需要先在 Supabase 中執行 <code>supabase_schema_scanner_functions.sql</code> 腳本來建立必要的 RPC 函數。
          </div>
        )}
      </div>

      {schema && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📊 掃描摘要</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{schema.summary.total_tables}</div>
              <div className="text-sm text-gray-600">總表格數</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{schema.summary.total_columns}</div>
              <div className="text-sm text-gray-600">總欄位數</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{schema.summary.tables_with_rls.length}</div>
              <div className="text-sm text-gray-600">啟用 RLS 的表格</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{schema.summary.tables_without_rls.length}</div>
              <div className="text-sm text-gray-600">未啟用 RLS 的表格</div>
            </div>
          </div>

          {/* 進階掃描的額外統計 */}
          {advancedSchema && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{advancedSchema.summary.total_relationships}</div>
                <div className="text-sm text-gray-600">總關聯數</div>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{advancedSchema.summary.total_policies}</div>
                <div className="text-sm text-gray-600">總策略數</div>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">{advancedSchema.summary.total_enums}</div>
                <div className="text-sm text-gray-600">總枚舉數</div>
              </div>
            </div>
          )}
        </div>
      )}

      {schema && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">🔐 RLS 狀態</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-600">
                ✅ 啟用 RLS 的表格 ({schema.summary.tables_with_rls.length})
              </h3>
              <div className="bg-green-50 p-4 rounded-lg">
                {schema.summary.tables_with_rls.length > 0 ? (
                  <ul className="space-y-1">
                    {schema.summary.tables_with_rls.map(table => (
                      <li key={table} className="text-sm">• {table}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">沒有啟用 RLS 的表格</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-orange-600">
                ⚠️ 未啟用 RLS 的表格 ({schema.summary.tables_without_rls.length})
              </h3>
              <div className="bg-orange-50 p-4 rounded-lg">
                {schema.summary.tables_without_rls.length > 0 ? (
                  <ul className="space-y-1">
                    {schema.summary.tables_without_rls.map(table => (
                      <li key={table} className="text-sm">• {table}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">所有表格都已啟用 RLS</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 枚舉類型 (僅進階掃描) */}
      {advancedSchema && advancedSchema.enums.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">🔤 枚舉類型</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advancedSchema.enums.map(enumType => (
              <div key={enumType.enum_name} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">{enumType.enum_name}</h3>
                <div className="text-sm text-gray-600">
                  值: {enumType.enum_values.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {schema && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📋 表格詳細資訊</h2>
          <div className="space-y-6">
            {(simpleSchema?.tables || advancedSchema?.tables || []).map(table => (
              <div key={table.table_name} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">🗂️ {table.table_name}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">欄位數: {table.column_count}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      table.has_rls 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {table.has_rls ? '✅ RLS 已啟用' : '⚠️ RLS 未啟用'}
                    </span>
                  </div>
                </div>
                
                {/* 欄位資訊 */}
                <div>
                  <h4 className="text-lg font-medium mb-2">欄位</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">欄位名稱</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">資料型別</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">可為空</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">預設值</th>
                          {advancedSchema && (
                            <>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">主鍵</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">外鍵</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">參考表格</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">參考欄位</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {table.columns.map(column => (
                          <tr key={column.column_name} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm font-medium">{column.column_name}</td>
                            <td className="px-4 py-2 text-sm">{column.data_type}</td>
                            <td className="px-4 py-2 text-sm">{column.is_nullable}</td>
                            <td className="px-4 py-2 text-sm">{column.column_default || '-'}</td>
                            {advancedSchema && (
                              <>
                                <td className="px-4 py-2 text-sm">{(column as any).is_primary_key ? '🔑' : ''}</td>
                                <td className="px-4 py-2 text-sm">{(column as any).is_foreign_key ? '🔗' : ''}</td>
                                <td className="px-4 py-2 text-sm">{(column as any).foreign_table_name || '-'}</td>
                                <td className="px-4 py-2 text-sm">{(column as any).foreign_column_name || '-'}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 進階掃描的額外資訊 */}
                {advancedSchema && (
                  <>
                    {/* 關聯資訊 */}
                    {(table as any).relationships?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-lg font-medium mb-2">🔗 關聯 ({(table as any).relationships.length})</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">約束名稱</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">欄位</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">參考表格</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">參考欄位</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(table as any).relationships.map((rel: any) => (
                                <tr key={rel.constraint_name} className="border-t border-gray-200">
                                  <td className="px-4 py-2 text-sm">{rel.constraint_name}</td>
                                  <td className="px-4 py-2 text-sm">{rel.column_name}</td>
                                  <td className="px-4 py-2 text-sm">{rel.foreign_table_name}</td>
                                  <td className="px-4 py-2 text-sm">{rel.foreign_column_name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* RLS 策略 */}
                    <div className="mt-4">
                      <h4 className="text-lg font-medium mb-2">
                        🔐 RLS 策略 ({(table as any).policies?.length || 0})
                      </h4>
                      {(table as any).policies?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">策略名稱</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">操作</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">條件</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(table as any).policies.map((policy: any) => (
                                <tr key={policy.policyname} className="border-t border-gray-200">
                                  <td className="px-4 py-2 text-sm">{policy.policyname}</td>
                                  <td className="px-4 py-2 text-sm">{policy.cmd}</td>
                                  <td className="px-4 py-2 text-sm">
                                    {policy.qual || policy.with_check || '無條件'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <p className="text-sm text-orange-700">⚠️ 此表格未設置 RLS 策略</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {report && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📄 完整報告</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm overflow-x-auto">{report}</pre>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">資料庫資料檢查</h2>
        <button
          onClick={scanDatabase}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '掃描中...' : '開始掃描資料庫'}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">掃描結果：</h2>
        <div className="bg-white rounded-lg p-4 border border-[#E9E2D6]">
          <pre className="text-sm text-[#4B4036] whitespace-pre-wrap bg-gray-50 p-4 rounded border">
            {scanResult || '尚未開始掃描'}
          </pre>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">創建測試資料</h2>
        <button
          onClick={createTestData}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '創建中...' : '開始創建測試資料'}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">檢查特定學生課堂資料</h2>
        <button
          onClick={checkSpecificStudent}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '檢查中...' : '開始檢查特定學生課堂資料'}
        </button>
      </div>
    </div>
  )
} 