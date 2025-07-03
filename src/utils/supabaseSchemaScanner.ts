import { createClient } from '@supabase/supabase-js'

// 資料庫結構介面定義
export interface TableInfo {
  table_name: string
  table_type: string
  columns: ColumnInfo[]
  relationships: RelationshipInfo[]
  indexes: IndexInfo[]
  policies: PolicyInfo[]
  triggers: TriggerInfo[]
  functions: FunctionInfo[]
}

export interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
  numeric_precision: number | null
  numeric_scale: number | null
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
  update_rule: string
  delete_rule: string
}

export interface IndexInfo {
  index_name: string
  table_name: string
  column_name: string
  is_unique: boolean
  index_type: string
}

export interface PolicyInfo {
  policy_name: string
  table_name: string
  operation: string
  definition: string
  roles: string[]
}

export interface TriggerInfo {
  trigger_name: string
  table_name: string
  event_manipulation: string
  action_timing: string
  action_statement: string
}

export interface FunctionInfo {
  function_name: string
  return_type: string
  parameters: string
  definition: string
}

export interface DatabaseSchema {
  tables: TableInfo[]
  enums: EnumInfo[]
  views: ViewInfo[]
  functions: FunctionInfo[]
  summary: SchemaSummary
}

export interface EnumInfo {
  enum_name: string
  enum_values: string[]
}

export interface ViewInfo {
  view_name: string
  definition: string
  columns: ColumnInfo[]
}

export interface SchemaSummary {
  total_tables: number
  total_columns: number
  total_relationships: number
  total_policies: number
  total_functions: number
  total_enums: number
  total_views: number
  rls_enabled_tables: string[]
  tables_without_rls: string[]
}

export class SupabaseSchemaScanner {
  private supabase: any

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * 掃描整個資料庫結構
   */
  async scanDatabase(): Promise<DatabaseSchema> {
    try {
      console.log('開始掃描 Supabase 資料庫結構...')

      const tables = await this.getTables()
      const enums = await this.getEnums()
      const views = await this.getViews()
      const functions = await this.getFunctions()

      // 為每個表格獲取詳細資訊
      const detailedTables = await Promise.all(
        tables.map(async (table) => {
          const columns = await this.getTableColumns(table.table_name)
          const relationships = await this.getTableRelationships(table.table_name)
          const indexes = await this.getTableIndexes(table.table_name)
          const policies = await this.getTablePolicies(table.table_name)
          const triggers = await this.getTableTriggers(table.table_name)

          return {
            ...table,
            columns,
            relationships,
            indexes,
            policies,
            triggers
          }
        })
      )

      const summary = this.generateSummary(detailedTables, enums, views, functions)

      return {
        tables: detailedTables,
        enums,
        views,
        functions,
        summary
      }
    } catch (error) {
      console.error('掃描資料庫時發生錯誤:', error)
      throw error
    }
  }

  /**
   * 獲取所有表格
   */
  private async getTables(): Promise<{ table_name: string; table_type: string }[]> {
    const { data, error } = await this.supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'information_schema%')

    if (error) throw error
    return data || []
  }

  /**
   * 獲取表格欄位資訊
   */
  private async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    // 獲取基本欄位資訊
    const { data: columns, error: columnsError } = await this.supabase
      .from('information_schema.columns')
      .select(`
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position')

    if (columnsError) throw columnsError

    // 獲取主鍵資訊
    const { data: primaryKeys, error: pkError } = await this.supabase
      .from('information_schema.key_column_usage')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .eq('constraint_name', `${tableName}_pkey`)

    if (pkError) throw pkError

    // 獲取外鍵資訊
    const { data: foreignKeys, error: fkError } = await this.supabase
      .from('information_schema.key_column_usage')
      .select(`
        column_name,
        constraint_name
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .not('constraint_name', 'eq', `${tableName}_pkey`)

    if (fkError) throw fkError

    // 獲取外鍵詳細資訊
    const { data: fkDetails, error: fkDetailsError } = await this.supabase
      .from('information_schema.referential_constraints')
      .select(`
        constraint_name,
        unique_constraint_name
      `)
      .in('constraint_name', foreignKeys?.map(fk => fk.constraint_name) || [])

    if (fkDetailsError) throw fkDetailsError

    // 組合欄位資訊
    return (columns || []).map(column => {
      const isPrimaryKey = primaryKeys?.some(pk => pk.column_name === column.column_name) || false
      const foreignKey = foreignKeys?.find(fk => fk.column_name === column.column_name)
      
      return {
        ...column,
        is_primary_key: isPrimaryKey,
        is_foreign_key: !!foreignKey,
        foreign_table_name: undefined, // 需要額外查詢
        foreign_column_name: undefined
      }
    })
  }

  /**
   * 獲取表格關聯資訊
   */
  private async getTableRelationships(tableName: string): Promise<RelationshipInfo[]> {
    const { data, error } = await this.supabase
      .rpc('get_table_relationships', { table_name_param: tableName })

    if (error) {
      // 如果 RPC 不存在，使用 SQL 查詢
      return this.getTableRelationshipsFallback(tableName)
    }

    return data || []
  }

  /**
   * 獲取表格關聯資訊的備用方法
   */
  private async getTableRelationshipsFallback(tableName: string): Promise<RelationshipInfo[]> {
    const { data, error } = await this.supabase
      .from('information_schema.key_column_usage')
      .select(`
        constraint_name,
        table_name,
        column_name
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName)

    if (error) throw error

    // 這裡需要額外的查詢來獲取完整的關聯資訊
    // 簡化版本，實際使用時需要更複雜的查詢
    return []
  }

  /**
   * 獲取表格索引資訊
   */
  private async getTableIndexes(tableName: string): Promise<IndexInfo[]> {
    const { data, error } = await this.supabase
      .rpc('get_table_indexes', { table_name_param: tableName })

    if (error) {
      // 備用方法
      return this.getTableIndexesFallback(tableName)
    }

    return data || []
  }

  /**
   * 獲取表格索引資訊的備用方法
   */
  private async getTableIndexesFallback(tableName: string): Promise<IndexInfo[]> {
    // 簡化的索引查詢
    return []
  }

  /**
   * 獲取表格 RLS 策略
   */
  private async getTablePolicies(tableName: string): Promise<PolicyInfo[]> {
    const { data, error } = await this.supabase
      .from('pg_policies')
      .select(`
        policyname,
        tablename,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      `)
      .eq('tablename', tableName)

    if (error) throw error

    return (data || []).map(policy => ({
      policy_name: policy.policyname,
      table_name: policy.tablename,
      operation: policy.cmd,
      definition: policy.qual || policy.with_check || '',
      roles: policy.roles || []
    }))
  }

  /**
   * 獲取表格觸發器
   */
  private async getTableTriggers(tableName: string): Promise<TriggerInfo[]> {
    const { data, error } = await this.supabase
      .from('information_schema.triggers')
      .select(`
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName)

    if (error) throw error

    return (data || []).map(trigger => ({
      trigger_name: trigger.trigger_name,
      table_name: tableName,
      event_manipulation: trigger.event_manipulation,
      action_timing: trigger.action_timing,
      action_statement: trigger.action_statement
    }))
  }

  /**
   * 獲取所有枚舉類型
   */
  private async getEnums(): Promise<EnumInfo[]> {
    const { data, error } = await this.supabase
      .rpc('get_enums')

    if (error) {
      // 備用方法
      return this.getEnumsFallback()
    }

    return data || []
  }

  /**
   * 獲取枚舉類型的備用方法
   */
  private async getEnumsFallback(): Promise<EnumInfo[]> {
    // 簡化的枚舉查詢
    return []
  }

  /**
   * 獲取所有視圖
   */
  private async getViews(): Promise<ViewInfo[]> {
    const { data, error } = await this.supabase
      .from('information_schema.views')
      .select('table_name, view_definition')
      .eq('table_schema', 'public')

    if (error) throw error

    return (data || []).map(view => ({
      view_name: view.table_name,
      definition: view.view_definition,
      columns: [] // 需要額外查詢
    }))
  }

  /**
   * 獲取所有函數
   */
  private async getFunctions(): Promise<FunctionInfo[]> {
    const { data, error } = await this.supabase
      .from('information_schema.routines')
      .select(`
        routine_name,
        data_type,
        routine_definition
      `)
      .eq('routine_schema', 'public')
      .eq('routine_type', 'FUNCTION')

    if (error) throw error

    return (data || []).map(func => ({
      function_name: func.routine_name,
      return_type: func.data_type,
      parameters: '', // 需要額外查詢
      definition: func.routine_definition
    }))
  }

  /**
   * 生成摘要資訊
   */
  private generateSummary(
    tables: TableInfo[],
    enums: EnumInfo[],
    views: ViewInfo[],
    functions: FunctionInfo[]
  ): SchemaSummary {
    const totalColumns = tables.reduce((sum, table) => sum + table.columns.length, 0)
    const totalRelationships = tables.reduce((sum, table) => sum + table.relationships.length, 0)
    const totalPolicies = tables.reduce((sum, table) => sum + table.policies.length, 0)
    const totalFunctions = functions.length

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
      total_functions,
      total_enums: enums.length,
      total_views: views.length,
      rls_enabled_tables: rlsEnabledTables,
      tables_without_rls: tablesWithoutRls
    }
  }

  /**
   * 生成詳細報告
   */
  generateReport(schema: DatabaseSchema): string {
    let report = '# Supabase 資料庫結構報告\n\n'
    
    // 摘要
    report += '## 摘要\n\n'
    report += `- 總表格數: ${schema.summary.total_tables}\n`
    report += `- 總欄位數: ${schema.summary.total_columns}\n`
    report += `- 總關聯數: ${schema.summary.total_relationships}\n`
    report += `- 總策略數: ${schema.summary.total_policies}\n`
    report += `- 總函數數: ${schema.summary.total_functions}\n`
    report += `- 總枚舉數: ${schema.summary.total_enums}\n`
    report += `- 總視圖數: ${schema.summary.total_views}\n\n`

    // RLS 狀態
    report += '### RLS 狀態\n\n'
    report += `**啟用 RLS 的表格:**\n`
    schema.summary.rls_enabled_tables.forEach(table => {
      report += `- ${table}\n`
    })
    report += '\n'

    report += `**未啟用 RLS 的表格:**\n`
    schema.summary.tables_without_rls.forEach(table => {
      report += `- ${table}\n`
    })
    report += '\n'

    // 詳細表格資訊
    report += '## 表格詳細資訊\n\n'
    schema.tables.forEach(table => {
      report += `### ${table.table_name}\n\n`
      
      // 欄位
      report += '#### 欄位\n\n'
      report += '| 欄位名稱 | 資料型別 | 可為空 | 預設值 | 主鍵 | 外鍵 |\n'
      report += '|----------|----------|--------|--------|------|------|\n'
      table.columns.forEach(column => {
        report += `| ${column.column_name} | ${column.data_type} | ${column.is_nullable} | ${column.column_default || '-'} | ${column.is_primary_key ? '✓' : ''} | ${column.is_foreign_key ? '✓' : ''} |\n`
      })
      report += '\n'

      // 關聯
      if (table.relationships.length > 0) {
        report += '#### 關聯\n\n'
        report += '| 約束名稱 | 欄位 | 參考表格 | 參考欄位 |\n'
        report += '|----------|------|----------|----------|\n'
        table.relationships.forEach(rel => {
          report += `| ${rel.constraint_name} | ${rel.column_name} | ${rel.foreign_table_name} | ${rel.foreign_column_name} |\n`
        })
        report += '\n'
      }

      // 索引
      if (table.indexes.length > 0) {
        report += '#### 索引\n\n'
        report += '| 索引名稱 | 欄位 | 唯一 | 類型 |\n'
        report += '|----------|------|------|------|\n'
        table.indexes.forEach(index => {
          report += `| ${index.index_name} | ${index.column_name} | ${index.is_unique ? '✓' : ''} | ${index.index_type} |\n`
        })
        report += '\n'
      }

      // RLS 策略
      if (table.policies.length > 0) {
        report += '#### RLS 策略\n\n'
        report += '| 策略名稱 | 操作 | 定義 |\n'
        report += '|----------|------|------|\n'
        table.policies.forEach(policy => {
          report += `| ${policy.policy_name} | ${policy.operation} | ${policy.definition} |\n`
        })
        report += '\n'
      }

      // 觸發器
      if (table.triggers.length > 0) {
        report += '#### 觸發器\n\n'
        report += '| 觸發器名稱 | 事件 | 時機 |\n'
        report += '|------------|------|------|\n'
        table.triggers.forEach(trigger => {
          report += `| ${trigger.trigger_name} | ${trigger.event_manipulation} | ${trigger.action_timing} |\n`
        })
        report += '\n'
      }

      report += '---\n\n'
    })

    // 枚舉類型
    if (schema.enums.length > 0) {
      report += '## 枚舉類型\n\n'
      schema.enums.forEach(enumType => {
        report += `### ${enumType.enum_name}\n\n`
        report += `值: ${enumType.enum_values.join(', ')}\n\n`
      })
    }

    // 視圖
    if (schema.views.length > 0) {
      report += '## 視圖\n\n'
      schema.views.forEach(view => {
        report += `### ${view.view_name}\n\n`
        report += '```sql\n'
        report += view.definition
        report += '\n```\n\n'
      })
    }

    // 函數
    if (schema.functions.length > 0) {
      report += '## 函數\n\n'
      schema.functions.forEach(func => {
        report += `### ${func.function_name}\n\n`
        report += `返回型別: ${func.return_type}\n\n`
        report += '```sql\n'
        report += func.definition
        report += '\n```\n\n'
      })
    }

    return report
  }
}

// 使用範例
export async function scanSupabaseSchema(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ schema: DatabaseSchema; report: string }> {
  const scanner = new SupabaseSchemaScanner(supabaseUrl, supabaseKey)
  const schema = await scanner.scanDatabase()
  const report = scanner.generateReport(schema)
  
  return { schema, report }
} 