import { supabase } from '@/lib/supabase'

export interface SimpleTableInfo {
  table_name: string
  column_count: number
  has_rls: boolean
  columns: SimpleColumnInfo[]
}

export interface SimpleColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

export interface SimpleDatabaseSchema {
  tables: SimpleTableInfo[]
  summary: {
    total_tables: number
    total_columns: number
    tables_with_rls: string[]
    tables_without_rls: string[]
  }
}

export async function scanSimpleSchema(): Promise<SimpleDatabaseSchema> {
  console.log('開始掃描 Supabase 資料庫結構...')

  try {
    // 獲取所有表格
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'information_schema%')
      .not('table_name', 'like', 'sql_%')

    if (tablesError) {
      console.error('獲取表格時發生錯誤:', tablesError)
      throw tablesError
    }

    console.log(`找到 ${tables?.length || 0} 個表格`)

    const tableInfos: SimpleTableInfo[] = []

    // 為每個表格獲取欄位資訊
    for (const table of tables || []) {
      console.log(`掃描表格: ${table.table_name}`)
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select(`
          column_name,
          data_type,
          is_nullable,
          column_default
        `)
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name)
        .order('ordinal_position')

      if (columnsError) {
        console.error(`獲取表格 ${table.table_name} 欄位時發生錯誤:`, columnsError)
        continue
      }

      // 檢查是否有 RLS 策略
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('policyname')
        .eq('tablename', table.table_name)
        .limit(1)

      const hasRls = !policiesError && policies && policies.length > 0

      tableInfos.push({
        table_name: table.table_name,
        column_count: columns?.length || 0,
        has_rls: hasRls,
        columns: columns || []
      })
    }

    // 生成摘要
    const summary = {
      total_tables: tableInfos.length,
      total_columns: tableInfos.reduce((sum, table) => sum + table.column_count, 0),
      tables_with_rls: tableInfos.filter(table => table.has_rls).map(table => table.table_name),
      tables_without_rls: tableInfos.filter(table => !table.has_rls).map(table => table.table_name)
    }

    return {
      tables: tableInfos,
      summary
    }

  } catch (error) {
    console.error('掃描資料庫時發生錯誤:', error)
    throw error
  }
}

export function generateSimpleReport(schema: SimpleDatabaseSchema): string {
  let report = '# Supabase 資料庫結構掃描報告\n\n'
  
  // 摘要
  report += '## 📊 摘要\n\n'
  report += `- **總表格數**: ${schema.summary.total_tables}\n`
  report += `- **總欄位數**: ${schema.summary.total_columns}\n`
  report += `- **啟用 RLS 的表格**: ${schema.summary.tables_with_rls.length}\n`
  report += `- **未啟用 RLS 的表格**: ${schema.summary.tables_without_rls.length}\n\n`

  // RLS 狀態
  report += '## 🔐 RLS 狀態\n\n'
  report += `**啟用 RLS 的表格 (${schema.summary.tables_with_rls.length}):**\n`
  schema.summary.tables_with_rls.forEach(table => {
    report += `- ✅ ${table}\n`
  })
  report += '\n'

  report += `**未啟用 RLS 的表格 (${schema.summary.tables_without_rls.length}):**\n`
  schema.summary.tables_without_rls.forEach(table => {
    report += `- ⚠️ ${table}\n`
  })
  report += '\n'

  // 詳細表格資訊
  report += '## 📋 表格詳細資訊\n\n'
  schema.tables.forEach(table => {
    report += `### 🗂️ ${table.table_name}\n\n`
    report += `- **欄位數**: ${table.column_count}\n`
    report += `- **RLS 狀態**: ${table.has_rls ? '✅ 已啟用' : '⚠️ 未啟用'}\n\n`
    
    // 欄位
    report += '#### 欄位\n\n'
    report += '| 欄位名稱 | 資料型別 | 可為空 | 預設值 |\n'
    report += '|----------|----------|--------|--------|\n'
    table.columns.forEach(column => {
      report += `| ${column.column_name} | ${column.data_type} | ${column.is_nullable} | ${column.column_default || '-'} |\n`
    })
    report += '\n'

    report += '---\n\n'
  })

  return report
}

// 執行掃描的函數
export async function runSimpleSchemaScan(): Promise<{ schema: SimpleDatabaseSchema; report: string }> {
  try {
    const schema = await scanSimpleSchema()
    const report = generateSimpleReport(schema)
    
    console.log('掃描完成！')
    console.log(`發現 ${schema.summary.total_tables} 個表格`)
    console.log(`發現 ${schema.summary.total_columns} 個欄位`)
    console.log(`啟用 RLS 的表格: ${schema.summary.tables_with_rls.length}`)
    console.log(`未啟用 RLS 的表格: ${schema.summary.tables_without_rls.length}`)
    
    return { schema, report }
  } catch (error) {
    console.error('掃描失敗:', error)
    throw error
  }
} 