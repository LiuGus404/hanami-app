// HanamiEcho 資料庫型別定義
// 基於實際的 Supabase SAAS 表結構

// 重新導出主要的型別定義
export type {
  SaasUser,
  AICharacter,
  UserAICharacter,
  LearningPath,
  LearningModule,
  LearningProgress,
  WorkTask,
  WorkProject,
  Memory,
  FamilyGroup,
  SubscriptionPlan,
  UserSubscription,
  CharacterInteraction,
  UserAnalytics,
  EmotionalSupport,
  Story,
  StoryProgress,
  UsageStatistics,
  SystemConfig,
  Notification,
  Document,
  Tag,
  TagRelation,
  UserPreference,
  UserSession,
  AuditLog,
  APIEndpoint,
  ErrorLog,
} from './hanamiecho';

// 資料庫表名枚舉
export enum DatabaseTable {
  // 核心表
  SAAS_USERS = 'saas_users',
  SAAS_3D_CHARACTERS = 'saas_3d_characters',
  SAAS_USER_CHARACTERS = 'saas_user_characters',
  
  // 學習相關表
  SAAS_LEARNING_PATHS = 'saas_learning_paths',
  SAAS_USER_LEARNING_PATHS = 'saas_user_learning_paths',
  
  // 工作相關表
  SAAS_WORK_TASKS = 'saas_work_tasks',
  SAAS_WORK_PROJECTS = 'saas_work_projects',
  
  // 記憶庫相關表
  SAAS_PERSONAL_MEMORIES = 'saas_personal_memories',
  
  // 家庭協作相關表
  SAAS_FAMILY_GROUPS = 'saas_family_groups',
  SAAS_FAMILY_ACTIVITIES = 'saas_family_activities',
  
  // 訂閱相關表
  SAAS_SUBSCRIPTION_PLANS = 'saas_subscription_plans',
  SAAS_USER_SUBSCRIPTIONS = 'saas_user_subscriptions',
  
  // 互動與分析相關表
  SAAS_CHARACTER_INTERACTIONS = 'saas_character_interactions',
  SAAS_USER_ANALYTICS = 'saas_user_analytics',
  
  // 情感支持相關表
  SAAS_EMOTIONAL_SUPPORT = 'saas_emotional_support',
  
  // 故事相關表
  SAAS_STORIES = 'saas_stories',
  SAAS_STORY_PROGRESS = 'saas_story_progress',
  
  // 使用統計相關表
  SAAS_USAGE_STATISTICS = 'saas_usage_statistics',
  
  // 系統相關表
  SAAS_SYSTEM_CONFIG = 'saas_system_config',
  SAAS_NOTIFICATIONS = 'saas_notifications',
  SAAS_DOCUMENTS = 'saas_documents',
  SAAS_TAGS = 'saas_tags',
  SAAS_TAG_RELATIONS = 'saas_tag_relations',
  SAAS_USER_PREFERENCES = 'saas_user_preferences',
  SAAS_USER_SESSIONS = 'saas_user_sessions',
  SAAS_AUDIT_LOGS = 'saas_audit_logs',
  SAAS_API_ENDPOINTS = 'saas_api_endpoints',
  SAAS_ERROR_LOGS = 'saas_error_logs',
}

// 資料庫操作型別
export interface DatabaseOperation {
  table: DatabaseTable;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  data?: any;
  filters?: Record<string, any>;
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  };
}

// 查詢結果型別
export interface QueryResult<T> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

// 分頁結果型別
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error: string | null;
}

// 資料庫連接狀態
export interface DatabaseStatus {
  connected: boolean;
  lastCheck: string;
  error?: string;
}

// 表結構資訊
export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface ConstraintInfo {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  columns: string[];
  definition?: string;
}

// 資料庫遷移型別
export interface Migration {
  id: string;
  name: string;
  version: string;
  up: string;
  down: string;
  executed: boolean;
  executedAt?: string;
  rollbackAt?: string;
}

// 資料庫備份型別
export interface DatabaseBackup {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
  downloadUrl?: string;
}

// 資料庫性能監控型別
export interface DatabasePerformance {
  queryTime: number;
  queryCount: number;
  slowQueries: SlowQuery[];
  connectionCount: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: string;
}

export interface SlowQuery {
  query: string;
  executionTime: number;
  timestamp: string;
  frequency: number;
}

// 資料庫安全型別
export interface DatabaseSecurity {
  rlsEnabled: boolean;
  policies: SecurityPolicy[];
  auditEnabled: boolean;
  encryptionEnabled: boolean;
  lastSecurityCheck: string;
}

export interface SecurityPolicy {
  name: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  definition: string;
  isActive: boolean;
}

// 資料庫統計型別
export interface DatabaseStats {
  totalTables: number;
  totalRows: number;
  totalSize: number;
  indexSize: number;
  tableStats: TableStats[];
  lastUpdated: string;
}

export interface TableStats {
  tableName: string;
  rowCount: number;
  size: number;
  indexSize: number;
  lastAnalyzed: string;
}

// 資料庫健康檢查型別
export interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  lastCheck: string;
  overallScore: number;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
  timestamp: string;
}

// 資料庫配置型別
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
  poolSize: number;
  connectionTimeout: number;
  queryTimeout: number;
  maxRetries: number;
}

// 資料庫事件型別
export interface DatabaseEvent {
  id: string;
  type: 'connection' | 'query' | 'error' | 'migration' | 'backup';
  message: string;
  data?: any;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

// 資料庫事務型別
export interface DatabaseTransaction {
  id: string;
  status: 'pending' | 'committed' | 'rolled_back';
  operations: DatabaseOperation[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// 資料庫鎖型別
export interface DatabaseLock {
  id: string;
  table: string;
  type: 'row' | 'table' | 'advisory';
  mode: 'shared' | 'exclusive';
  granted: boolean;
  waiting: boolean;
  grantedAt?: string;
  waitingSince?: string;
}

// 資料庫連接池型別
export interface ConnectionPool {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
  minConnections: number;
  averageWaitTime: number;
  averageQueryTime: number;
}

// 資料庫快取型別
export interface DatabaseCache {
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  cacheSize: number;
  maxCacheSize: number;
  evictionCount: number;
  lastCleared: string;
}

// 資料庫日誌型別
export interface DatabaseLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: any;
  timestamp: string;
  source: string;
}

// 資料庫指標型別
export interface DatabaseMetrics {
  queriesPerSecond: number;
  averageQueryTime: number;
  slowQueryCount: number;
  connectionCount: number;
  transactionCount: number;
  deadlockCount: number;
  lockWaitTime: number;
  bufferHitRate: number;
  indexUsage: number;
  timestamp: string;
}
