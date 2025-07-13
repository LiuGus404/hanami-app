const { createClient } = require('@supabase/supabase-js');

// 請替換為您的 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGrowthGoalsData() {
  try {
    console.log('🔍 檢查 hanami_growth_goals 表結構...');
    
    // 檢查表結構
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'hanami_growth_goals')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ 檢查表結構失敗:', columnsError);
      return;
    }
    
    console.log('📋 表結構:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    console.log('\n🔍 檢查實際資料...');
    
    // 檢查實際資料
    const { data: goals, error: goalsError } = await supabase
      .from('hanami_growth_goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (goalsError) {
      console.error('❌ 檢查資料失敗:', goalsError);
      return;
    }
    
    console.log('📊 最近 5 筆目標資料:');
    goals.forEach((goal, index) => {
      console.log(`\n目標 ${index + 1}:`);
      console.log(`  ID: ${goal.id}`);
      console.log(`  名稱: ${goal.goal_name}`);
      console.log(`  progress_max: ${goal.progress_max} (type: ${typeof goal.progress_max})`);
      console.log(`  required_abilities: ${JSON.stringify(goal.required_abilities)} (type: ${typeof goal.required_abilities})`);
      console.log(`  related_activities: ${JSON.stringify(goal.related_activities)} (type: ${typeof goal.related_activities})`);
      console.log(`  progress_contents: ${JSON.stringify(goal.progress_contents)} (type: ${typeof goal.progress_contents})`);
      console.log(`  is_completed: ${goal.is_completed} (type: ${typeof goal.is_completed})`);
    });
    
    // 檢查是否有資料
    const { count, error: countError } = await supabase
      .from('hanami_growth_goals')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 檢查資料數量失敗:', countError);
      return;
    }
    
    console.log(`\n📈 總共有 ${count} 筆目標資料`);
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error);
  }
}

// 執行檢查
checkGrowthGoalsData(); 