const fs = require('fs');

const filePath = 'src/components/ui/GrowthTreePathManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 清理隱藏字符和格式問題
const fixes = [
  // 清理可能的隱藏字符
  {
    from: /\r\n/g,
    to: "\n"
  },
  {
    from: /\r/g,
    to: "\n"
  },
  // 清理多餘的空格
  {
    from: /[ \t]+$/gm,
    to: ""
  },
  // 清理可能的 BOM
  {
    from: /^\uFEFF/,
    to: ""
  }
];

// 應用所有修復
fixes.forEach(fix => {
  content = content.replace(fix.from, fix.to);
});

// 寫回文件
fs.writeFileSync(filePath, content, 'utf8');
console.log('文件清理完成');
