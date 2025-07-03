'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { PopupSelect } from '@/components/ui/PopupSelect'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string | null
  model: string | null
  status: string | null
  prompt: string | null
  result: string | null
  created_at: string | null
  started_at: string | null
  finished_at: string | null
  error_message: string | null
  assigned_model: string | null
  memory_id: string | null
}

interface Model {
  name: string
  icon: string
  status: string
}

interface Props {
  models: Model[]
  onCreateTask: () => void
  onCancelTask: () => void
  onFilterChange: (status: string[]) => void
}

const getModelImage = (name: string) => {
  switch (name.toLowerCase()) {
    case 'hibi': return '/owlui.png'
    case 'lulu': return '/foxcat.png'
    case 'mimi': return '/rabbit.png'
    case 'taku': return '/polarbear.png'
    default: return '/owl.png'
  }
}

const getModelDisplayName = (name: string) => {
  switch (name.toLowerCase()) {
    case 'hibi': return '希希'
    case 'lulu': return '語語'
    case 'mimi': return '米米'
    case 'taku': return '策策'
    default: return ''
  }
}

export default function AIControlPanel({
  models,
  onCreateTask,
  onCancelTask,
  onFilterChange,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'processing' | 'done'>('processing')
  const [showPopup, setShowPopup] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>(['進行中'])
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedModel, setSelectedModel] = useState('hibi')
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  // 取得任務列表
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      let query = supabase.from('ai_tasks').select('*')

      // 根據 statusFilter 過濾任務狀態
      let statusValues: string[] = []
      for (const status of statusFilter) {
        if (status === '進行中') statusValues.push('processing')
        if (status === '已完成') statusValues.push('done')
        if (status === '出現錯誤') statusValues.push('error')
      }
      if (statusValues.length > 0) {
        query = query.in('status', statusValues)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching tasks:', error)
        setTasks([])
      } else {
        const mappedTasks = (data || []).map((item) => ({
          id: item.id,
          title: item.title || '',
          model: item.model || '',
          status: item.status || 'processing',
          prompt: item.prompt || '',
          result: item.result || '',
          created_at: item.created_at || '',
          started_at: item.started_at || '',
          finished_at: item.finished_at || '',
          error_message: item.error_message || '',
          assigned_model: item.assigned_model || '',
          memory_id: item.memory_id || '',
        }))
        setTasks(mappedTasks)
      }
    } catch (error) {
      console.error('Error in fetchTasks:', error)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase, statusFilter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // 新增任務送出
  const handleSubmitTask = async () => {
    try {
      const newTask = {
        title: taskTitle,
        prompt: taskDescription,
        model: selectedModel,
        status: 'queued',
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
        error_message: null,
        assigned_model: null,
        memory_id: `${selectedModel}-${Date.now()}`
      }

      console.log('送出任務', newTask)

      const { error } = await supabase.from('ai_tasks').insert([newTask])

      if (error) {
        console.error('任務送出失敗:', error)
        alert('任務送出失敗: ' + error.message)
        await fetchTasks()
      } else {
        setShowCreateForm(false)
        setTaskTitle('')
        setTaskDescription('')
        await fetchTasks()
      }
    } catch (err) {
      console.error('發生錯誤:', err)
      alert('發生錯誤，請稍後再試')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCD58B] mx-auto"></div>
          <p className="mt-4 text-[#2B3A3B]">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-[#FFFCF2] min-h-screen flex gap-4">
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Task Panel */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Image src="/owlui.png" alt="Owl UI" width={32} height={32} />
                  <div className="flex flex-col">
                    <h2 className="text-xl font-semibold">AI 任務列表</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-3 py-1 rounded-full bg-[#FFF8E6] border border-[#DDD2BA] text-[#2B3A3B] text-sm font-semibold flex items-center gap-2"
                  >
                    ＋ 新增任務
                  </button>
                  {selectedTasks.length > 0 && (
                    <>
                      <button
                        onClick={() => setSelectedTasks(tasks.map(t => t.id))}
                        className="px-2 py-1 text-sm rounded-full border border-[#DDD2BA] bg-[#FDF6E8] hover:bg-[#F5EAD4]"
                      >
                        全選
                      </button>
                      <button
                        onClick={() => setSelectedTasks([])}
                        className="px-2 py-1 text-sm rounded-full border border-[#DDD2BA] bg-[#FDF6E8] hover:bg-[#F5EAD4]"
                      >
                        取消選取
                      </button>
                      <button
                        onClick={onCancelTask}
                        className="px-3 py-1 rounded-full bg-[#FFF8E6] border border-[#DDD2BA] text-[#2B3A3B] text-sm font-semibold flex items-center gap-2"
                      >
                        ✕ 取消任務
                      </button>
                    </>
                  )}
                  <button onClick={() => setShowPopup(true)} className="hanami-btn-soft px-3 py-1 text-[#2B3A3B] text-sm font-semibold">篩選：{statusFilter.join(', ')}</button>
                </div>
              </div>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-5 rounded-2xl border border-[#E8E3D5] shadow-md bg-[#FFFCF2] space-y-3 cursor-pointer ${
                      selectedTasks.includes(task.id) ? 'ring-2 ring-[#A68A64]' : ''
                    }`}
                    onClick={() => {
                      setSelectedTasks((prev) =>
                        prev.includes(task.id)
                          ? prev.filter((id) => id !== task.id)
                          : [...prev, task.id]
                      );
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-[#4B4B4B]">{task.title || '未命名任務'}</h3>
                        <span className="text-xs bg-[#F8E7AA] text-[#6E5C2F] rounded-full px-2 py-0.5 mt-1 inline-block">
                          {task.model || '未指定模型'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          task.status === 'processing' ? 'bg-yellow-500' :
                          task.status === 'done' ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        <span className="text-sm">
                          {task.status === 'processing' ? '處理中' : task.status === 'done' ? '已完成' : '錯誤'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-start mt-1">
                      <p className="text-sm text-[#666] whitespace-pre-wrap pr-4 flex-1">
                        {task.prompt || '無描述'}
                      </p>
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845
                               a 15.9155 15.9155 0 0 1 0 31.831
                               a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E8E3D5"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845
                               a 15.9155 15.9155 0 0 1 0 31.831
                               a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#FCD58B"
                            strokeWidth="3"
                            strokeDasharray="100, 100"
                          />
                        </svg>
                        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-[#2B3A3B]">
                          0%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 pt-2">
                      <div className="flex gap-4">
                        <span>開始時間：{task.started_at || '未開始'}</span>
                        <span>創建時間：{task.created_at || '未知'}</span>
                      </div>
                      <span className="bg-gray-200 px-2 py-0.5 rounded">{task.memory_id || '無記憶ID'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Status */}
            <div>
              <h2 className="text-xl font-semibold mb-2">角色狀態</h2>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-3 rounded-2xl border border-[#E8E3D5] bg-[#FFFCF2] shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Image src={getModelImage(model.name)} alt={model.name} width={24} height={24} />
                      <span>{getModelDisplayName(model.name)} {model.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {model.status === 'idle'
                        ? '閒置中'
                        : model.status === 'busy'
                        ? '暫停處理中'
                        : '忙碌中'}
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full ${
                        model.status === 'idle'
                          ? 'bg-green-500'
                          : model.status === 'busy'
                          ? 'bg-yellow-400'
                          : 'bg-red-500'
                      }`}
                    ></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <PopupSelect
          title="選擇任務狀態"
          options={[
            { label: '未開始', value: '未開始' },
            { label: '排程中', value: '排程中' },
            { label: '進行中', value: '進行中' },
            { label: '已完成', value: '已完成' },
            { label: '待確認', value: '待確認' },
            { label: '出現錯誤', value: '出現錯誤' },
          ]}
          selected={statusFilter}
          mode="multi"
          onChange={(value) => {
            const selected = value as string[];
            setStatusFilter(selected);
            onFilterChange(selected);
          }}
          onConfirm={() => setShowPopup(false)}
          onCancel={() => setShowPopup(false)}
        />
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#FFFDF8] border border-[#D8CDBF] rounded-[24px] w-96 p-6 shadow-xl text-[#4B4B4B]">
            <h2 className="text-xl font-bold text-center mb-4">新增任務</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="任務名稱"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full border border-[#D8CDBF] rounded-xl px-4 py-2 text-sm"
              />
              <textarea
                placeholder="任務說明..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full border border-[#D8CDBF] rounded-xl px-4 py-2 text-sm"
                rows={3}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上載圖片</label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <span className="block text-sm mb-1">相機</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="w-full border border-[#D8CDBF] rounded-xl px-4 py-2 text-sm bg-white"
                    />
                  </label>
                  <label className="flex-1">
                    <span className="block text-sm mb-1">相簿</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full border border-[#D8CDBF] rounded-xl px-4 py-2 text-sm bg-white"
                    />
                  </label>
                </div>
                <label className="text-xs text-gray-500 mt-1 block">建議使用手機裝置拍照或選取圖片</label>
              </div>
              <button
                onClick={() => setShowModelSelect(true)}
                className="w-full border border-[#D8CDBF] rounded-xl px-4 py-2 text-sm text-left bg-white"
              >
                選擇模型：{getModelDisplayName(selectedModel)} ({selectedModel})
              </button>
            </div>
            <div className="flex justify-around mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-[#D8CDBF] rounded-xl hover:bg-[#F3F0E5]"
              >
                取消
              </button>
              <button
                onClick={handleSubmitTask}
                className="px-6 py-2 bg-[#A68A64] text-white font-semibold rounded-xl hover:bg-[#937654]"
              >
                送出
              </button>
            </div>
          </div>
        </div>
      )}

      {showModelSelect && (
        <PopupSelect
          title="選擇 AI 助理"
          options={[
            { label: '希希 Hibi', value: 'hibi' },
            { label: '語語 Lulu', value: 'lulu' },
            { label: '策策 Taku', value: 'taku' },
            { label: '米米 Mimi', value: 'mimi' },
          ]}
          selected={selectedModel}
          mode="single"
          onChange={(val) => setSelectedModel(val as string)}
          onConfirm={() => setShowModelSelect(false)}
          onCancel={() => setShowModelSelect(false)}
        />
      )}
    </>
  )
}