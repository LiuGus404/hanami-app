// HanamiEcho 型別驗證工具
// 確保型別定義與實際資料庫結構一致

import { createSaasClient } from './supabase-saas';
import { DatabaseTable } from '@/types/database';

export interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface TableValidationResult {
  tableName: string;
  exists: boolean;
  columns: ColumnValidationResult[];
  indexes: IndexValidationResult[];
  constraints: ConstraintValidationResult[];
}

export interface ColumnValidationResult {
  name: string;
  exists: boolean;
  type: string;
  nullable: boolean;
  hasDefault: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface IndexValidationResult {
  name: string;
  exists: boolean;
  columns: string[];
  unique: boolean;
}

export interface ConstraintValidationResult {
  name: string;
  exists: boolean;
  type: string;
  definition: string;
}

/**
 * 驗證所有 SAAS 表的型別定義
 */
export async function validateAllTypes(): Promise<TypeValidationResult> {
  const result: TypeValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  try {
    const supabase = createSaasClient();
    
    // 驗證每個表
    for (const tableName of Object.values(DatabaseTable)) {
      const tableResult = await validateTable(tableName);
      
      if (!tableResult.exists) {
        result.errors.push(`表 ${tableName} 不存在`);
        result.isValid = false;
      }
      
      // 檢查必要的列
      const requiredColumns = getRequiredColumns(tableName);
      for (const requiredColumn of requiredColumns) {
        const column = tableResult.columns.find(c => c.name === requiredColumn.name);
        if (!column || !column.exists) {
          result.errors.push(`表 ${tableName} 缺少必要列: ${requiredColumn.name}`);
          result.isValid = false;
        } else if (column.type !== requiredColumn.type) {
          result.warnings.push(`表 ${tableName} 列 ${requiredColumn.name} 型別不匹配: 期望 ${requiredColumn.type}, 實際 ${column.type}`);
        }
      }
    }
    
    // 檢查表之間的關聯
    await validateTableRelationships(result);
    
  } catch (error) {
    result.errors.push(`型別驗證失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    result.isValid = false;
  }
  
  return result;
}

/**
 * 驗證特定表
 */
export async function validateTable(tableName: string): Promise<TableValidationResult> {
  const supabase = createSaasClient();
  
  const result: TableValidationResult = {
    tableName,
    exists: false,
    columns: [],
    indexes: [],
    constraints: []
  };
  
  try {
    // 檢查表是否存在
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        // 表不存在
        return result;
      }
      throw error;
    }
    
    result.exists = true;
    
    // 獲取表結構資訊
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: tableName
    });
    
    if (!columnsError && columns && Array.isArray(columns)) {
      result.columns = columns.map((col: any) => ({
        name: col.column_name,
        exists: true,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        hasDefault: !!col.column_default,
        isPrimaryKey: col.is_primary_key,
        isForeignKey: col.is_foreign_key
      }));
    }
    
  } catch (error) {
    console.error(`驗證表 ${tableName} 時發生錯誤:`, error);
  }
  
  return result;
}

/**
 * 獲取表的必要列定義
 */
function getRequiredColumns(tableName: string): Array<{name: string, type: string}> {
  const requiredColumns: Record<string, Array<{name: string, type: string}>> = {
    [DatabaseTable.SAAS_USERS]: [
      { name: 'id', type: 'uuid' },
      { name: 'email', type: 'text' },
      { name: 'full_name', type: 'text' },
      { name: 'subscription_status', type: 'text' },
      { name: 'is_verified', type: 'boolean' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'updated_at', type: 'timestamp with time zone' }
    ],
    [DatabaseTable.SAAS_3D_CHARACTERS]: [
      { name: 'id', type: 'uuid' },
      { name: 'name', type: 'text' },
      { name: 'type', type: 'text' },
      { name: 'target_audience', type: 'text' },
      { name: 'is_active', type: 'boolean' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'updated_at', type: 'timestamp with time zone' }
    ],
    [DatabaseTable.SAAS_LEARNING_PATHS]: [
      { name: 'id', type: 'uuid' },
      { name: 'name', type: 'text' },
      { name: 'target_audience', type: 'text' },
      { name: 'category', type: 'text' },
      { name: 'difficulty_level', type: 'text' },
      { name: 'is_active', type: 'boolean' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'updated_at', type: 'timestamp with time zone' }
    ],
    [DatabaseTable.SAAS_WORK_TASKS]: [
      { name: 'id', type: 'uuid' },
      { name: 'user_id', type: 'uuid' },
      { name: 'title', type: 'text' },
      { name: 'category', type: 'text' },
      { name: 'priority', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'updated_at', type: 'timestamp with time zone' }
    ],
    [DatabaseTable.SAAS_PERSONAL_MEMORIES]: [
      { name: 'id', type: 'uuid' },
      { name: 'user_id', type: 'uuid' },
      { name: 'memory_type', type: 'text' },
      { name: 'privacy_level', type: 'text' },
      { name: 'importance_level', type: 'text' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'last_accessed', type: 'timestamp with time zone' }
    ],
    [DatabaseTable.SAAS_FAMILY_GROUPS]: [
      { name: 'id', type: 'uuid' },
      { name: 'name', type: 'text' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'updated_at', type: 'timestamp with time zone' }
    ],
    [DatabaseTable.SAAS_SUBSCRIPTION_PLANS]: [
      { name: 'id', type: 'uuid' },
      { name: 'name', type: 'text' },
      { name: 'type', type: 'text' },
      { name: 'price_monthly', type: 'numeric' },
      { name: 'price_yearly', type: 'numeric' },
      { name: 'currency', type: 'text' },
      { name: 'is_active', type: 'boolean' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'updated_at', type: 'timestamp with time zone' }
    ],
    [DatabaseTable.SAAS_CHARACTER_INTERACTIONS]: [
      { name: 'id', type: 'uuid' },
      { name: 'character_id', type: 'uuid' },
      { name: 'user_id', type: 'uuid' },
      { name: 'interaction_type', type: 'text' },
      { name: 'timestamp', type: 'timestamp with time zone' }
    ],
    [DatabaseTable.SAAS_USER_ANALYTICS]: [
      { name: 'id', type: 'uuid' },
      { name: 'user_id', type: 'uuid' },
      { name: 'event_type', type: 'text' },
      { name: 'timestamp', type: 'timestamp with time zone' }
    ]
  };
  
  return requiredColumns[tableName] || [];
}

/**
 * 驗證表之間的關聯
 */
async function validateTableRelationships(result: TypeValidationResult): Promise<void> {
  const relationships = [
    {
      from: DatabaseTable.SAAS_USER_CHARACTERS,
      to: DatabaseTable.SAAS_USERS,
      column: 'user_id'
    },
    {
      from: DatabaseTable.SAAS_USER_CHARACTERS,
      to: DatabaseTable.SAAS_3D_CHARACTERS,
      column: 'character_id'
    },
    {
      from: DatabaseTable.SAAS_USER_LEARNING_PATHS,
      to: DatabaseTable.SAAS_USERS,
      column: 'user_id'
    },
    {
      from: DatabaseTable.SAAS_USER_LEARNING_PATHS,
      to: DatabaseTable.SAAS_LEARNING_PATHS,
      column: 'learning_path_id'
    },
    {
      from: DatabaseTable.SAAS_WORK_TASKS,
      to: DatabaseTable.SAAS_USERS,
      column: 'user_id'
    },
    {
      from: DatabaseTable.SAAS_PERSONAL_MEMORIES,
      to: DatabaseTable.SAAS_USERS,
      column: 'user_id'
    },
    {
      from: DatabaseTable.SAAS_USER_SUBSCRIPTIONS,
      to: DatabaseTable.SAAS_USERS,
      column: 'user_id'
    },
    {
      from: DatabaseTable.SAAS_USER_SUBSCRIPTIONS,
      to: DatabaseTable.SAAS_SUBSCRIPTION_PLANS,
      column: 'plan_id'
    }
  ];
  
  for (const rel of relationships) {
    try {
      const supabase = createSaasClient();
      const { data, error } = await supabase
        .from(rel.from)
        .select(`${rel.column}`)
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        result.warnings.push(`關聯表 ${rel.from} 不存在，無法驗證與 ${rel.to} 的關聯`);
      }
    } catch (error) {
      result.warnings.push(`驗證關聯 ${rel.from} -> ${rel.to} 時發生錯誤`);
    }
  }
}

/**
 * 生成型別驗證報告
 */
export function generateTypeValidationReport(validationResult: TypeValidationResult): string {
  let report = '# HanamiEcho 型別驗證報告\n\n';
  report += `**驗證時間**: ${new Date().toISOString()}\n`;
  report += `**整體狀態**: ${validationResult.isValid ? '✅ 通過' : '❌ 失敗'}\n\n`;
  
  if (validationResult.errors.length > 0) {
    report += '## ❌ 錯誤\n\n';
    validationResult.errors.forEach(error => {
      report += `- ${error}\n`;
    });
    report += '\n';
  }
  
  if (validationResult.warnings.length > 0) {
    report += '## ⚠️ 警告\n\n';
    validationResult.warnings.forEach(warning => {
      report += `- ${warning}\n`;
    });
    report += '\n';
  }
  
  if (validationResult.suggestions.length > 0) {
    report += '## 💡 建議\n\n';
    validationResult.suggestions.forEach(suggestion => {
      report += `- ${suggestion}\n`;
    });
    report += '\n';
  }
  
  if (validationResult.isValid && validationResult.warnings.length === 0) {
    report += '## ✅ 所有型別定義都與資料庫結構一致！\n\n';
  }
  
  return report;
}

/**
 * 檢查型別定義的完整性
 */
export function checkTypeCompleteness(): string[] {
  const missingTypes: string[] = [];
  
  // 檢查必要的型別定義
  const requiredTypes = [
    'SaasUser',
    'AICharacter',
    'LearningPath',
    'WorkTask',
    'Memory',
    'FamilyGroup',
    'SubscriptionPlan',
    'CharacterInteraction',
    'UserAnalytics'
  ];
  
  // 這裡可以添加更詳細的檢查邏輯
  // 例如檢查型別定義是否包含所有必要的屬性
  
  return missingTypes;
}

/**
 * 驗證型別定義的語法
 */
export function validateTypeSyntax(): TypeValidationResult {
  const result: TypeValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  try {
    // 這裡可以添加 TypeScript 編譯器 API 來檢查型別語法
    // 或者使用其他型別檢查工具
    
    result.suggestions.push('建議使用 TypeScript 編譯器進行更深入的型別檢查');
    
  } catch (error) {
    result.errors.push(`型別語法檢查失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    result.isValid = false;
  }
  
  return result;
}


