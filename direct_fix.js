const fs = require('fs');

const filePath = 'src/components/ui/GrowthTreePathManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 直接修復語法錯誤
const fixes = [
  // 修復第372行的問題 - 重新格式化整個對象
  {
    from: /const learningPathData = \{[\s\S]*?nodes: sortedCoreActivities\.map\(\(ta: any, index\) => \(\{[\s\S]*?\}\)\)[\s\S]*?\};/g,
    to: `const learningPathData = {
            id: \`tree-\${currentTreeId}\`,
            name: \`成長樹 \${currentTreeId} 學習路徑\`,
            description: '從 hanami_tree_activities 表生成的核心學習路徑',
            nodes: sortedCoreActivities.map((ta: any, index) => ({
              id: ta.id,
              node_type: 'activity',
              title: ta.hanami_teaching_activities?.activity_name || ta.custom_activity_name || \`活動 \${index + 1}\`,
              description: ta.hanami_teaching_activities?.activity_description || ta.custom_activity_description || '',
              duration: ta.estimated_duration || ta.hanami_teaching_activities?.duration_minutes || 30,
              difficulty: ta.difficulty_level || 1,
              metadata: {
                activity_id: ta.activity_id,
                activity_source: ta.activity_source,
                activity_type: ta.activity_type
              }
            }))
          };`
  },
  // 修復其他可能的語法問題
  {
    from: /as any\[\] as any\[\] as any\[\] as any\[\]/g,
    to: "as any[]"
  },
  // 修復 activityDat 問題
  {
    from: /activityDat\(a as any\)/g,
    to: "activityData"
  }
];

// 應用所有修復
fixes.forEach(fix => {
  content = content.replace(fix.from, fix.to);
});

// 寫回文件
fs.writeFileSync(filePath, content, 'utf8');
console.log('直接修復完成');
