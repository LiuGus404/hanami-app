import { supabase } from '@/lib/supabase'

export interface AdvancedTableInfo {
  table_name: string
  column_count: number
  has_rls: boolean
  policy_count: number
  index_count: number
  foreign_key_count: number
  columns: AdvancedColumnInfo[]
  relationships: RelationshipInfo[]
  indexes: IndexInfo[]
  policies: PolicyInfo[]
}

export interface AdvancedColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  is_primary_key: boolean
  is_foreign_key: boolean
  foreign_table_name?: string
  foreign_column_name?: string
}

export interface RelationshipInfo {
  constraint_name: string
  table_name: string
  column_name: string
  foreign_table_name: string
  foreign_column_name: string
}

export interface IndexInfo {
  index_name: string
  table_name: string
  column_name: string
  is_unique: boolean
  index_type: string
}

export interface PolicyInfo {
  policyname: string
  tablename: string
  cmd: string
  qual: string | null
  with_check: string | null
  roles: string[]
}

export interface EnumInfo {
  enum_name: string
  enum_values: string[]
}

export interface AdvancedDatabaseSchema {
  tables: AdvancedTableInfo[]
  enums: EnumInfo[]
  summary: {
    total_tables: number
    total_columns: number
    total_relationships: number
    total_policies: number
    total_indexes: number
    total_enums: number
    tables_with_rls: string[]
    tables_without_rls: string[]
  }
}

export async function scanAdvancedSchema(): Promise<AdvancedDatabaseSchema> {
  console.log('開始進階掃描 Supabase 資料庫結構...')

  try {
    // 1. 使用 RPC 函數獲取所有表格概覽
    const { data: tableOverviews, error: overviewError } = await supabase
      .rpc('scan_all_tables')

    if (overviewError) {
      console.error('獲取表格概覽時發生錯誤:', overviewError)
      throw overviewError
    }

    console.log(`找到 ${tableOverviews?.length || 0} 個表格`)

    // 2. 獲取所有枚舉類型
    const { data: enums, error: enumsError } = await supabase
      .rpc('get_enums')

    if (enumsError) {
      console.error('獲取枚舉類型時發生錯誤:', enumsError)
    }

    // 3. 為每個表格獲取詳細資訊
    const detailedTables: AdvancedTableInfo[] = []

    for (const tableOverview of tableOverviews || []) {
      console.log(`掃描表格: ${tableOverview.table_name}`)
      
      // 獲取表格詳細欄位資訊
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_details', { table_name_param: tableOverview.table_name })

      if (columnsError) {
        console.error(`獲取表格 ${tableOverview.table_name} 詳細資訊時發生錯誤:`, columnsError)
      }

      // 獲取外鍵關聯
      const { data: relationships, error: relationshipsError } = await supabase
        .rpc('get_foreign_keys', { table_name_param: tableOverview.table_name })

      if (relationshipsError) {
        console.error(`獲取表格 ${tableOverview.table_name} 外鍵時發生錯誤:`, relationshipsError)
      }

      // 獲取索引
      const { data: indexes, error: indexesError } = await supabase
        .rpc('get_table_indexes', { table_name_param: tableOverview.table_name })

      if (indexesError) {
        console.error(`獲取表格 ${tableOverview.table_name} 索引時發生錯誤:`, indexesError)
      }

      // 獲取 RLS 策略
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select(`
          policyname,
          tablename,
          cmd,
          qual,
          with_check,
          roles
        `)
        .eq('tablename', tableOverview.table_name)

      if (policiesError) {
        console.error(`獲取表格 ${tableOverview.table_name} 策略時發生錯誤:`, policiesError)
      }

      detailedTables.push({
        table_name: tableOverview.table_name,
        column_count: tableOverview.column_count,
        has_rls: tableOverview.has_rls,
        policy_count: tableOverview.policy_count,
        index_count: tableOverview.index_count,
        foreign_key_count: tableOverview.foreign_key_count,
        columns: columns || [],
        relationships: relationships || [],
        indexes: indexes || [],
        policies: policies || []
      })
    }

    // 4. 生成摘要
    const summary = {
      total_tables: detailedTables.length,
      total_columns: detailedTables.reduce((sum, table) => sum + table.column_count, 0),
      total_relationships: detailedTables.reduce((sum, table) => sum + table.relationships.length, 0),
      total_policies: detailedTables.reduce((sum, table) => sum + table.policies.length, 0),
      total_indexes: detailedTables.reduce((sum, table) => sum + table.indexes.length, 0),
      total_enums: enums?.length || 0,
      tables_with_rls: detailedTables.filter(table => table.has_rls).map(table => table.table_name),
      tables_without_rls: detailedTables.filter(table => !table.has_rls).map(table => table.table_name)
    }

    return {
      tables: detailedTables,
      enums: enums || [],
      summary
    }

  } catch (error) {
    console.error('進階掃描資料庫時發生錯誤:', error)
    throw error
  }
}

export function generateAdvancedReport(schema: AdvancedDatabaseSchema): string {
  let report = '# Supabase 資料庫結構進階掃描報告\n\n'
  
  // 摘要
  report += '## 📊 摘要\n\n'
  report += `- **總表格數**: ${schema.summary.total_tables}\n`
  report += `- **總欄位數**: ${schema.summary.total_columns}\n`
  report += `- **總關聯數**: ${schema.summary.total_relationships}\n`
  report += `- **總策略數**: ${schema.summary.total_policies}\n`
  report += `- **總索引數**: ${schema.summary.total_indexes}\n`
  report += `- **總枚舉數**: ${schema.summary.total_enums}\n\n`

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

  // 枚舉類型
  if (schema.enums.length > 0) {
    report += '## 🔤 枚舉類型\n\n'
    schema.enums.forEach(enumType => {
      report += `### ${enumType.enum_name}\n\n`
      report += `值: ${enumType.enum_values.join(', ')}\n\n`
    })
  }

  // 詳細表格資訊
  report += '## 📋 表格詳細資訊\n\n'
  schema.tables.forEach(table => {
    report += `### 🗂️ ${table.table_name}\n\n`
    report += `- **欄位數**: ${table.column_count}\n`
    report += `- **RLS 狀態**: ${table.has_rls ? '✅ 已啟用' : '⚠️ 未啟用'}\n`
    report += `- **策略數**: ${table.policy_count}\n`
    report += `- **索引數**: ${table.index_count}\n`
    report += `- **外鍵數**: ${table.foreign_key_count}\n\n`
    
    // 欄位
    report += '#### 欄位\n\n'
    report += '| 欄位名稱 | 資料型別 | 可為空 | 預設值 | 主鍵 | 外鍵 | 參考表格 | 參考欄位 |\n'
    report += '|----------|----------|--------|--------|------|------|----------|----------|\n'
    table.columns.forEach(column => {
      const pk = column.is_primary_key ? '🔑' : ''
      const fk = column.is_foreign_key ? '🔗' : ''
      const refTable = column.foreign_table_name || '-'
      const refColumn = column.foreign_column_name || '-'
      report += `| ${column.column_name} | ${column.data_type} | ${column.is_nullable} | ${column.column_default || '-'} | ${pk} | ${fk} | ${refTable} | ${refColumn} |\n`
    })
    report += '\n'

    // 關聯
    if (table.relationships.length > 0) {
      report += '#### 🔗 關聯\n\n'
      report += '| 約束名稱 | 欄位 | 參考表格 | 參考欄位 |\n'
      report += '|----------|------|----------|----------|\n'
      table.relationships.forEach(rel => {
        report += `| ${rel.constraint_name} | ${rel.column_name} | ${rel.foreign_table_name} | ${rel.foreign_column_name} |\n`
      })
      report += '\n'
    }

    // 索引
    if (table.indexes.length > 0) {
      report += '#### 📇 索引\n\n'
      report += '| 索引名稱 | 欄位 | 唯一 | 類型 |\n'
      report += '|----------|------|------|------|\n'
      table.indexes.forEach(index => {
        report += `| ${index.index_name} | ${index.column_name} | ${index.is_unique ? '✓' : ''} | ${index.index_type} |\n`
      })
      report += '\n'
    }

    // RLS 策略
    if (table.policies.length > 0) {
      report += '#### 🔐 RLS 策略\n\n'
      report += '| 策略名稱 | 操作 | 條件 |\n'
      report += '|----------|------|------|\n'
      table.policies.forEach(policy => {
        const condition = policy.qual || policy.with_check || '無條件'
        report += `| ${policy.policyname} | ${policy.cmd} | ${condition} |\n`
      })
      report += '\n'
    } else {
      report += '#### ⚠️ 未設置 RLS 策略\n\n'
    }

    report += '---\n\n'
  })

  return report
}

// 執行進階掃描的函數
export async function runAdvancedSchemaScan(): Promise<{ schema: AdvancedDatabaseSchema; report: string }> {
  try {
    const schema = await scanAdvancedSchema()
    const report = generateAdvancedReport(schema)
    
    console.log('進階掃描完成！')
    console.log(`發現 ${schema.summary.total_tables} 個表格`)
    console.log(`發現 ${schema.summary.total_columns} 個欄位`)
    console.log(`發現 ${schema.summary.total_relationships} 個關聯`)
    console.log(`發現 ${schema.summary.total_policies} 個 RLS 策略`)
    console.log(`發現 ${schema.summary.total_indexes} 個索引`)
    console.log(`發現 ${schema.summary.total_enums} 個枚舉類型`)
    
    return { schema, report }
  } catch (error) {
    console.error('進階掃描失敗:', error)
    throw error
  }
} 