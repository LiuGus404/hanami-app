const fs = require('fs');

const filePath = 'src/components/ui/GrowthTreePathManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 修復語法錯誤
const fixes = [
  // 修復可能的隱藏字符問題
  {
    from: /\r\n/g,
    to: "\n"
  },
  {
    from: /\r/g,
    to: "\n"
  },
  // 修復可能的 BOM
  {
    from: /^\uFEFF/,
    to: ""
  },
  // 修復多餘的空格
  {
    from: /[ \t]+$/gm,
    to: ""
  },
  // 修復可能的語法問題
  {
    from: /const teachingActivity = treeActivity\.hanami_teaching_activities as any\[\] as any\[\] as any\[\] as any\[\];/g,
    to: "const teachingActivity = treeActivity.hanami_teaching_activities as any;"
  },
  // 修復重複的類型斷言
  {
    from: /as any\[\] as any\[\] as any\[\] as any\[\]/g,
    to: "as any[]"
  },
  // 修復可能的語法錯誤
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
console.log('語法錯誤修復完成');
