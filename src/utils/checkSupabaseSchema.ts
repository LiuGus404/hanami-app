import { supabase } from '@/lib/supabase'

export interface TableSchema {
  table_name: string
  columns: ColumnSchema[]
  relationships: RelationshipSchema[]
  policies: PolicySchema[]
  indexes: IndexSchema[]
}

export interface ColumnSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  is_primary_key: boolean
  is_foreign_key: boolean
  foreign_table_name?: string
  foreign_column_name?: string
}

export interface RelationshipSchema {
  constraint_name: string
  table_name: string
  column_name: string
  foreign_table_name: string
  foreign_column_name: string
}

export interface PolicySchema {
  policyname: string
  tablename: string
  cmd: string
  qual: string | null
  with_check: string | null
  roles: string[]
}

export interface IndexSchema {
  indexname: string
  tablename: string
  indexdef: string
}

export interface DatabaseSchema {
  tables: TableSchema[]
  summary: {
    total_tables: number
    total_columns: number
    total_relationships: number
    total_policies: number
    rls_enabled_tables: string[]
    tables_without_rls: string[]
  }
}

export async function scanSupabaseSchema(): Promise<DatabaseSchema> {
  console.log('開始掃描 Supabase 資料庫結構...')

  try {
    // 1. 獲取所有表格
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'information_schema%')

    if (tablesError) {
      console.error('獲取表格時發生錯誤:', tablesError)
      throw tablesError
    }

    console.log(`找到 ${tables?.length || 0} 個表格`)

    // 2. 為每個表格獲取詳細資訊
    const tableSchemas: TableSchema[] = []

    for (const table of tables || []) {
      console.log(`掃描表格: ${table.table_name}`)
      
      const columns = await getTableColumns(table.table_name)
      const relationships = await getTableRelationships(table.table_name)
      const policies = await getTablePolicies(table.table_name)
      const indexes = await getTableIndexes(table.table_name)

      tableSchemas.push({
        table_name: table.table_name,
        columns,
        relationships,
        policies,
        indexes
      })
    }

    // 3. 生成摘要
    const summary = generateSummary(tableSchemas)

    return {
      tables: tableSchemas,
      summary
    }

  } catch (error) {
    console.error('掃描資料庫時發生錯誤:', error)
    throw error
  }
}

async function getTableColumns(tableName: string): Promise<ColumnSchema[]> {
  // 獲取基本欄位資訊
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select(`
      column_name,
      data_type,
      is_nullable,
      column_default
    `)
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .order('ordinal_position')

  if (columnsError) {
    console.error(`獲取表格 ${tableName} 欄位時發生錯誤:`, columnsError)
    return []
  }

  // 獲取主鍵資訊
  const { data: primaryKeys, error: pkError } = await supabase
    .from('information_schema.key_column_usage')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .eq('constraint_name', `${tableName}_pkey`)

  if (pkError) {
    console.error(`獲取表格 ${tableName} 主鍵時發生錯誤:`, pkError)
  }

  // 獲取外鍵資訊
  const { data: foreignKeys, error: fkError } = await supabase
    .from('information_schema.key_column_usage')
    .select(`
      column_name,
      constraint_name
    `)
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .not('constraint_name', 'eq', `${tableName}_pkey`)

  if (fkError) {
    console.error(`獲取表格 ${tableName} 外鍵時發生錯誤:`, fkError)
  }

  return (columns || []).map(column => {
    const isPrimaryKey = primaryKeys?.some(pk => pk.column_name === column.column_name) || false
    const isForeignKey = foreignKeys?.some(fk => fk.column_name === column.column_name) || false
    
    return {
      ...column,
      is_primary_key: isPrimaryKey,
      is_foreign_key: isForeignKey
    }
  })
}

async function getTableRelationships(tableName: string): Promise<RelationshipSchema[]> {
  // 使用 SQL 查詢獲取外鍵關聯
  const { data, error } = await supabase
    .rpc('get_foreign_keys', { table_name_param: tableName })

  if (error) {
    // 如果 RPC 不存在，使用備用方法
    console.log(`表格 ${tableName} 沒有外鍵關聯或 RPC 不存在`)
    return []
  }

  return data || []
}

async function getTablePolicies(tableName: string): Promise<PolicySchema[]> {
  const { data, error } = await supabase
    .from('pg_policies')
    .select(`
      policyname,
      tablename,
      cmd,
      qual,
      with_check,
      roles
    `)
    .eq('tablename', tableName)

  if (error) {
    console.error(`獲取表格 ${tableName} 策略時發生錯誤:`, error)
    return []
  }

  return data || []
}

async function getTableIndexes(tableName: string): Promise<IndexSchema[]> {
  const { data, error } = await supabase
    .from('pg_indexes')
    .select(`
      indexname,
      tablename,
      indexdef
    `)
    .eq('tablename', tableName)
    .eq('schemaname', 'public')

  if (error) {
    console.error(`獲取表格 ${tableName} 索引時發生錯誤:`, error)
    return []
  }

  return data || []
}

function generateSummary(tables: TableSchema[]) {
  const totalColumns = tables.reduce((sum, table) => sum + table.columns.length, 0)
  const totalRelationships = tables.reduce((sum, table) => sum + table.relationships.length, 0)
  const totalPolicies = tables.reduce((sum, table) => sum + table.policies.length, 0)

  const rlsEnabledTables = tables
    .filter(table => table.policies.length > 0)
    .map(table => table.table_name)

  const tablesWithoutRls = tables
    .filter(table => table.policies.length === 0)
    .map(table => table.table_name)

  return {
    total_tables: tables.length,
    total_columns,
    total_relationships,
    total_policies,
    rls_enabled_tables: rlsEnabledTables,
    tables_without_rls: tablesWithoutRls
  }
}

export function generateSchemaReport(schema: DatabaseSchema): string {
  let report = '# Supabase 資料庫結構掃描報告\n\n'
  
  // 摘要
  report += '## 📊 摘要\n\n'
  report += `- **總表格數**: ${schema.summary.total_tables}\n`
  report += `- **總欄位數**: ${schema.summary.total_columns}\n`
  report += `- **總關聯數**: ${schema.summary.total_relationships}\n`
  report += `- **總策略數**: ${schema.summary.total_policies}\n\n`

  // RLS 狀態
  report += '## 🔐 RLS 狀態\n\n'
  report += `**啟用 RLS 的表格 (${schema.summary.rls_enabled_tables.length}):**\n`
  schema.summary.rls_enabled_tables.forEach(table => {
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
    
    // 欄位
    report += '#### 欄位\n\n'
    report += '| 欄位名稱 | 資料型別 | 可為空 | 預設值 | 主鍵 | 外鍵 |\n'
    report += '|----------|----------|--------|--------|------|------|\n'
    table.columns.forEach(column => {
      const pk = column.is_primary_key ? '🔑' : ''
      const fk = column.is_foreign_key ? '🔗' : ''
      report += `| ${column.column_name} | ${column.data_type} | ${column.is_nullable} | ${column.column_default || '-'} | ${pk} | ${fk} |\n`
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
      report += '| 索引名稱 | 定義 |\n'
      report += '|----------|------|\n'
      table.indexes.forEach(index => {
        report += `| ${index.indexname} | ${index.indexdef} |\n`
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

// 執行掃描的函數
export async function runSchemaScan(): Promise<{ schema: DatabaseSchema; report: string }> {
  try {
    const schema = await scanSupabaseSchema()
    const report = generateSchemaReport(schema)
    
    console.log('掃描完成！')
    console.log(`發現 ${schema.summary.total_tables} 個表格`)
    console.log(`發現 ${schema.summary.total_columns} 個欄位`)
    console.log(`發現 ${schema.summary.total_relationships} 個關聯`)
    console.log(`發現 ${schema.summary.total_policies} 個 RLS 策略`)
    
    return { schema, report }
  } catch (error) {
    console.error('掃描失敗:', error)
    throw error
  }
}