const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_ATTEMPTS = 50;
let attemptCount = 0;

function runBuild() {
  attemptCount++;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`嘗試 ${attemptCount}/${MAX_ATTEMPTS}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const output = execSync('npm run build', {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: __dirname
    });
    
    console.log('✅ Build 成功！');
    return { success: true, output };
  } catch (error) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
    return { success: false, error: errorOutput };
  }
}

function extractErrors(errorOutput) {
  const errors = [];
  const lines = errorOutput.split('\n');
  
  for (const line of lines) {
    // Next.js 錯誤格式: ./src/path/to/file.tsx:123:45
    const nextMatch = line.match(/\.\/src\/([^\s:]+):(\d+):(\d+)/);
    if (nextMatch) {
      errors.push({
        file: path.join(__dirname, 'src', nextMatch[1]),
        line: parseInt(nextMatch[2]),
        col: parseInt(nextMatch[3]),
        message: line
      });
      continue;
    }
    
    // TypeScript 錯誤格式: src/path/to/file.tsx(123,45)
    const tsMatch = line.match(/src\/([^\s(]+)\((\d+),(\d+)\)/);
    if (tsMatch) {
      errors.push({
        file: path.join(__dirname, 'src', tsMatch[1]),
        line: parseInt(tsMatch[2]),
        col: parseInt(tsMatch[3]),
        message: line
      });
    }
  }
  
  return errors;
}

function fixCommonErrors(errors) {
  console.log('\n嘗試修復錯誤...');
  
  for (const error of errors) {
    if (!fs.existsSync(error.file)) {
      console.log(`  ⚠️  文件不存在: ${error.file}`);
      continue;
    }
    
    try {
      let content = fs.readFileSync(error.file, 'utf-8');
      const lines = content.split('\n');
      const originalContent = content;
      
      // 修復 1: 缺少 'use client'
      if (error.file.endsWith('.tsx') && !content.includes("'use client'") && 
          (error.message.includes("use client") || error.message.includes("Server Component"))) {
        if (!lines[0].includes("'use client'") && !lines[0].includes('"use client"')) {
          content = "'use client';\n" + content;
          console.log(`  ✓ 添加 'use client' 到 ${path.relative(__dirname, error.file)}`);
        }
      }
      
      // 修復 2: 未使用的變量
      if (error.message.includes("is assigned a value but never used")) {
        const errorLine = lines[error.line - 1];
        if (errorLine) {
          const varMatch = errorLine.match(/(\w+)\s*[:=]/);
          if (varMatch) {
            const varName = varMatch[1];
            // 在變量名前添加下劃線
            content = content.replace(new RegExp(`\\b${varName}\\s*[:=]`, 'g'), `_${varName} =`);
            console.log(`  ✓ 修復未使用變量: ${varName} 在 ${path.relative(__dirname, error.file)}`);
          }
        }
      }
      
      // 修復 3: 導入路徑問題
      if (error.message.includes("Cannot find module") || error.message.includes("Module not found")) {
        const errorLine = lines[error.line - 1];
        if (errorLine) {
          const importMatch = errorLine.match(/from\s+['"]([^'"]+)['"]/);
          if (importMatch) {
            const importPath = importMatch[1];
            console.log(`  ℹ️  檢查導入路徑: ${importPath} 在 ${path.relative(__dirname, error.file)}`);
            // 這裡可以添加更智能的路徑修復邏輯
          }
        }
      }
      
      // 如果內容有變化，寫回文件
      if (content !== originalContent) {
        fs.writeFileSync(error.file, content, 'utf-8');
        console.log(`  ✓ 已修復: ${path.relative(__dirname, error.file)}`);
      }
    } catch (fixError) {
      console.log(`  ✗ 無法修復 ${path.relative(__dirname, error.file)}: ${fixError.message}`);
    }
  }
}

// 主循環
console.log('開始自動 build 修復流程...\n');

while (attemptCount < MAX_ATTEMPTS) {
  const result = runBuild();
  
  if (result.success) {
    console.log('\n🎉 恭喜！Build 成功完成！');
    process.exit(0);
  }
  
  console.log('\n❌ Build 失敗，錯誤訊息：');
  console.log(result.error);
  
  // 提取錯誤
  const errors = extractErrors(result.error);
  if (errors.length > 0) {
    console.log(`\n發現 ${errors.length} 個錯誤文件：`);
    errors.forEach(err => {
      console.log(`  - ${path.relative(__dirname, err.file)}:${err.line}:${err.col}`);
    });
    
    // 嘗試修復
    fixCommonErrors(errors);
  }
  
  if (attemptCount >= MAX_ATTEMPTS) {
    console.log('\n❌ 達到最大嘗試次數，請手動檢查錯誤。');
    process.exit(1);
  }
  
  // 等待一下再重試
  console.log('\n等待 2 秒後重試...');
  // 使用同步等待
  const start = Date.now();
  while (Date.now() - start < 2000) {
    // 等待
  }
}

