// 測試簡單的資料庫插入
const testData = {
  activity_name: "測試活動",
  activity_description: "這是一個測試活動",
  activity_type: "game",
  difficulty_level: 1,
  duration_minutes: 30,
  estimated_duration: 30,
  age_range_min: 3,
  age_range_max: 12,
  materials_needed: ["測試道具"],
  target_abilities: ["測試能力"],
  instructions: "測試說明",
  notes: "測試備註",
  template_id: null,
  custom_fields: null,
  status: "draft",
  tags: ["測試標籤"],
  category: "測試分類",
  is_active: true
};

console.log('測試資料:', JSON.stringify(testData, null, 2));

// 驗證資料類型
console.log('資料類型驗證:');
Object.keys(testData).forEach(key => {
  console.log(`${key}: ${typeof testData[key]} = ${testData[key]}`);
}); 