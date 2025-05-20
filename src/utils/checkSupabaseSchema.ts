import { getSupabaseClient } from '@/lib/supabase'

export async function checkSupabaseSchema(table: string, inputData: Record<string, any>) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(1)

  if (error) {
    console.error(`❌ 讀取 ${table} 失敗:`, error)
    return { schemaKeys: [], inputKeys: [], missingInInput: [], extraInInput: [] }
  }

  if (!data || data.length === 0) {
    console.warn(`⚠️ ${table} 沒有任何資料，無法比對欄位。請至少在資料庫內手動加一筆資料。`)
    return { schemaKeys: [], inputKeys: [], missingInInput: [], extraInInput: [] }
  }

  const schemaKeys = Object.keys(data[0]).sort()
  const inputKeys = Object.keys(inputData).sort()

  const missingInInput = schemaKeys.filter(k => !(k in inputData))
  const extraInInput = inputKeys.filter(k => !schemaKeys.includes(k))

  console.log(`✅ 資料庫欄位:`, schemaKeys)
  console.log(`✅ 前端資料欄位:`, inputKeys)

  if (missingInInput.length > 0) {
    console.warn(`⚠️ 資料庫存在但前端沒送出的欄位:`, missingInInput)
  } else {
    console.log(`🎉 沒有缺少欄位。`)
  }

  if (extraInInput.length > 0) {
    console.error(`❌ 前端送出但資料庫沒有的多餘欄位:`, extraInInput)
  } else {
    console.log(`🎉 沒有多餘欄位。`)
  }

  return { schemaKeys, inputKeys, missingInInput, extraInInput }
}