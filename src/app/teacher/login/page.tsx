'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TeacherLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    setError('')
    setSuccess('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('老師登入成功')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFCEB] font-['Quicksand',_sans-serif]">
      <div className="bg-white shadow-xl rounded-[30px] p-8 w-[350px] border border-[#FDE6B8]">
        <h1 className="text-2xl font-extrabold text-center text-[#2B3A3B] mb-4">
          Hanami 老師登入
        </h1>
        <p className="text-sm text-center text-[#7B7B7B] mb-6">
          歡迎老師回來！請輸入登入資料 🎵
        </p>
        <input
          type="email"
          placeholder="電子郵件"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-2 border border-[#EADBC8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FCD58B]"
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-[#EADBC8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FCD58B]"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-[#FCD58B] text-[#2B3A3B] font-bold py-2 rounded-full hover:bg-[#fbc161] transition"
        >
          登入
        </button>
        {error && <p className="text-red-400 mt-3 text-sm text-center">{error}</p>}
        {success && <p className="text-green-500 mt-3 text-sm text-center">{success}</p>}
      </div>
    </div>
  )
}