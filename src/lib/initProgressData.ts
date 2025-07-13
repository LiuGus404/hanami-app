import { supabase } from './supabase';

// 初始化發展能力資料
export const initializeDevelopmentAbilities = async () => {
  const abilities = [
    {
      ability_name: '小肌發展',
      ability_description: '手指、手腕等精細動作的協調能力',
      ability_color: '#FFB6C1',
      max_level: 5,
    },
    {
      ability_name: '專注力',
      ability_description: '持續專注於特定任務的能力',
      ability_color: '#87CEEB',
      max_level: 5,
    },
    {
      ability_name: '情緒管理',
      ability_description: '理解和調節自己情緒的能力',
      ability_color: '#98FB98',
      max_level: 5,
    },
    {
      ability_name: '分離能力',
      ability_description: '與父母分離時的適應能力',
      ability_color: '#DDA0DD',
      max_level: 5,
    },
    {
      ability_name: '語言表達',
      ability_description: '口語表達和溝通能力',
      ability_color: '#F0E68C',
      max_level: 5,
    },
    {
      ability_name: '社交能力',
      ability_description: '與他人互動和合作的能力',
      ability_color: '#FFA07A',
      max_level: 5,
    },
    {
      ability_name: '追視能力',
      ability_description: '視覺追蹤和注意力轉移能力',
      ability_color: '#B0E0E6',
      max_level: 5,
    },
    {
      ability_name: '大肌肉發展',
      ability_description: '全身大肌肉的協調和運動能力',
      ability_color: '#FF69B4',
      max_level: 5,
    },
  ];

  try {
    // 檢查是否已存在資料
    const { data: existingAbilities } = await supabase
      .from('hanami_development_abilities')
      .select('ability_name');

    if (existingAbilities && existingAbilities.length > 0) {
      console.log('發展能力資料已存在，跳過初始化');
      return;
    }

    // 插入能力資料
    const { data, error } = await supabase
      .from('hanami_development_abilities')
      .insert(abilities)
      .select();

    if (error) {
      console.error('初始化發展能力失敗：', error);
      throw error;
    }

    console.log('成功初始化發展能力資料：', data);
  } catch (err) {
    console.error('初始化發展能力時發生錯誤：', err);
  }
};

// 初始化基礎教學活動
export const initializeTeachingActivities = async () => {
  const activities = [
    {
      activity_name: '音樂節奏遊戲',
      activity_description: '透過拍手、跺腳等方式培養節奏感',
      activity_type: 'game',
      difficulty_level: 1,
      target_abilities: [], // 需要先獲取能力ID
      materials_needed: ['音樂播放器', '節奏棒'],
      duration_minutes: 15,
      age_range_min: 3,
      age_range_max: 6,
    },
    {
      activity_name: '手指操練習',
      activity_description: '鍛鍊手指靈活性和精細動作',
      activity_type: 'training',
      difficulty_level: 2,
      target_abilities: [],
      materials_needed: ['手指操卡片'],
      duration_minutes: 10,
      age_range_min: 3,
      age_range_max: 6,
    },
    {
      activity_name: '情緒表達練習',
      activity_description: '學習識別和表達不同情緒',
      activity_type: 'exercise',
      difficulty_level: 2,
      target_abilities: [],
      materials_needed: ['情緒卡片', '鏡子'],
      duration_minutes: 20,
      age_range_min: 4,
      age_range_max: 6,
    },
  ];

  try {
    // 檢查是否已存在資料
    const { data: existingActivities } = await supabase
      .from('hanami_teaching_activities')
      .select('activity_name');

    if (existingActivities && existingActivities.length > 0) {
      console.log('教學活動資料已存在，跳過初始化');
      return;
    }

    // 獲取能力ID
    const { data: abilities } = await supabase
      .from('hanami_development_abilities')
      .select('id, ability_name');

    if (!abilities) {
      console.error('無法獲取能力資料');
      return;
    }

    // 為活動分配目標能力
    const activitiesWithAbilities = activities.map((activity, index) => {
      const abilityMap: { [key: string]: string[] } = {
        '音樂節奏遊戲': ['小肌發展', '專注力'],
        '手指操練習': ['小肌發展'],
        '情緒表達練習': ['情緒管理', '語言表達'],
      };

      const targetAbilityNames = abilityMap[activity.activity_name] || [];
      const targetAbilities = abilities
        .filter(ability => targetAbilityNames.includes(ability.ability_name))
        .map(ability => ability.id);

      return {
        title: activity.activity_name,
        description: activity.activity_description,
        activity_type: activity.activity_type,
        difficulty_level: activity.difficulty_level,
        duration: activity.duration_minutes,
        materials: activity.materials_needed,
        objectives: targetAbilities,
        instructions: '',
        notes: '',
        status: 'draft',
        tags: [],
        category: '',
      };
    });

    // 插入活動資料
    const { data, error } = await supabase
      .from('hanami_teaching_activities')
      .insert(activitiesWithAbilities)
      .select();

    if (error) {
      console.error('初始化教學活動失敗：', error);
      throw error;
    }

    console.log('成功初始化教學活動資料：', data);
  } catch (err) {
    console.error('初始化教學活動時發生錯誤：', err);
  }
};

// 初始化成長樹模板
export const initializeGrowthTrees = async () => {
  try {
    // 獲取課程類型
    const { data: courseTypes } = await supabase
      .from('Hanami_CourseTypes')
      .select('id, name')
      .eq('status', true);

    if (!courseTypes || courseTypes.length === 0) {
      console.log('沒有可用的課程類型，跳過成長樹初始化');
      return;
    }

    // 檢查是否已存在成長樹
    const { data: existingTrees } = await supabase
      .from('hanami_growth_trees')
      .select('tree_name');

    if (existingTrees && existingTrees.length > 0) {
      console.log('成長樹資料已存在，跳過初始化');
      return;
    }

    // 為每個課程類型建立基礎成長樹
    const trees = courseTypes.map((courseType, index) => ({
      tree_name: `${courseType.name}基礎成長樹`,
      tree_description: `${courseType.name}課程的基礎學習目標和進度追蹤`,
      course_type: courseType.id,
      tree_level: 1,
      difficulty_level: 1,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('hanami_growth_trees')
      .insert(trees)
      .select();

    if (error) {
      console.error('初始化成長樹失敗：', error);
      throw error;
    }

    console.log('成功初始化成長樹資料：', data);

    // 為每個成長樹建立基礎目標
    for (const tree of data) {
      await initializeGrowthGoals(tree.id, tree.tree_name);
    }

  } catch (err) {
    console.error('初始化成長樹時發生錯誤：', err);
  }
};

// 初始化成長目標
export const initializeGrowthGoals = async (treeId: string, treeName: string) => {
  const baseGoals = [
    {
      goal_name: '基礎認識',
      goal_description: '對課程內容有基本認識和興趣',
      goal_order: 1,
      goal_icon: '🌱',
    },
    {
      goal_name: '技能掌握',
      goal_description: '掌握基礎技能和概念',
      goal_order: 2,
      goal_icon: '🌿',
    },
    {
      goal_name: '熟練應用',
      goal_description: '能夠熟練應用所學技能',
      goal_order: 3,
      goal_icon: '🌸',
    },
    {
      goal_name: '創新發揮',
      goal_description: '能夠創新性地運用所學知識',
      goal_order: 4,
      goal_icon: '🍎',
    },
  ];

  try {
    const goals = baseGoals.map(goal => ({
      ...goal,
      tree_id: treeId,
      is_achievable: true,
      is_completed: false,
      progress_max: 5,
      required_abilities: [],
      related_activities: [],
      progress_contents: [],
    }));

    const { data, error } = await supabase
      .from('hanami_growth_goals')
      .insert(goals)
      .select();

    if (error) {
      console.error(`初始化成長目標失敗 (${treeName})：`, error);
      throw error;
    }

    console.log(`成功為 ${treeName} 初始化成長目標：`, data);
  } catch (err) {
    console.error(`初始化成長目標時發生錯誤 (${treeName})：`, err);
  }
};

// 執行所有初始化
export const initializeAllProgressData = async () => {
  console.log('開始初始化學生進度系統資料...');
  
  try {
    await initializeDevelopmentAbilities();
    await initializeTeachingActivities();
    await initializeGrowthTrees();
    
    console.log('學生進度系統資料初始化完成！');
  } catch (err) {
    console.error('初始化過程中發生錯誤：', err);
  }
}; 