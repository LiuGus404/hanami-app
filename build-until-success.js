const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let attemptCount = 0;
const maxAttempts = 50;

function runBuild() {
  attemptCount++;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`嘗試 ${attemptCount}/${maxAttempts}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const output = execSync('npm run build', {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: __dirname
    });
    
    console.log('✅ Build 成功！');
    console.log(output);
    return true;
  } catch (error) {
    console.log('❌ Build 失敗，錯誤訊息：');
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
    console.log(errorOutput);
    
    // 嘗試從錯誤中提取文件路徑和行號
    const errorLines = errorOutput.split('\n');
    const fileErrors = [];
    
    for (const line of errorLines) {
      // 匹配 Next.js 錯誤格式: ./src/path/to/file.tsx:123:45
      const match = line.match(/\.\/src\/([^\s:]+):(\d+):(\d+)/);
      if (match) {
        const [, filePath, lineNum, colNum] = match;
        fileErrors.push({
          file: path.join(__dirname, 'src', filePath),
          line: parseInt(lineNum),
          col: parseInt(colNum),
          message: line
        });
      }
      
      // 匹配 TypeScript 錯誤格式
      const tsMatch = line.match(/src\/([^\s(]+)\((\d+),(\d+)\)/);
      if (tsMatch) {
        const [, filePath, lineNum, colNum] = tsMatch;
        fileErrors.push({
          file: path.join(__dirname, 'src', filePath),
          line: parseInt(lineNum),
          col: parseInt(colNum),
          message: line
        });
      }
    }
    
    if (fileErrors.length > 0) {
      console.log('\n發現以下文件錯誤：');
      fileErrors.forEach(err => {
        console.log(`  - ${err.file}:${err.line}:${err.col}`);
      });
      
      // 嘗試修復常見錯誤
      fixCommonErrors(fileErrors);
    }
    
    return false;
  }
}

function fixCommonErrors(fileErrors) {
  console.log('\n嘗試修復常見錯誤...');
  
  for (const error of fileErrors) {
    if (!fs.existsSync(error.file)) {
      console.log(`⚠️  文件不存在: ${error.file}`);
      continue;
    }
    
    try {
      let content = fs.readFileSync(error.file, 'utf-8');
      const lines = content.split('\n');
      const originalContent = content;
      
      // 修復常見的導入錯誤
      if (error.message.includes("Cannot find module") || error.message.includes("Module not found")) {
        // 檢查是否是 .ts vs .tsx 的問題
        const importMatch = lines[error.line - 1]?.match(/from ['"]([^'"]+)['"]/);
        if (importMatch) {
          const importPath = importMatch[1];
          // 如果是相對路徑，嘗試添加 .tsx 或 .ts
          if (importPath.startsWith('@/') || importPath.startsWith('./') || importPath.startsWith('../')) {
            const possiblePaths = [
              importPath + '.tsx',
              importPath + '.ts',
              importPath + '/index.tsx',
              importPath + '/index.ts'
            ];
            
            // 檢查文件是否存在
            for (const possiblePath of possiblePaths) {
              const resolvedPath = resolveImportPath(error.file, possiblePath);
              if (resolvedPath && fs.existsSync(resolvedPath)) {
                console.log(`  ✓ 找到正確路徑: ${possiblePath}`);
                // 不需要修改，因為 TypeScript 會自動解析
                break;
              }
            }
          }
        }
      }
      
      // 修復 'use client' 缺失的問題
      if (error.message.includes("use client") && !content.includes("'use client'") && error.file.endsWith('.tsx')) {
        if (lines[0] !== "'use client'") {
          content = "'use client';\n" + content;
          console.log(`  ✓ 添加 'use client' 到 ${error.file}`);
        }
      }
      
      // 修復未使用的變量
      if (error.message.includes("is assigned a value but never used")) {
        const varMatch = lines[error.line - 1]?.match(/(\w+)\s*=/);
        if (varMatch) {
          const varName = varMatch[1];
          // 在變量名前添加下劃線
          content = content.replace(new RegExp(`\\b${varName}\\s*=`, 'g'), `_${varName} =`);
          console.log(`  ✓ 修復未使用變量: ${varName}`);
        }
      }
      
      // 如果內容有變化，寫回文件
      if (content !== originalContent) {
        fs.writeFileSync(error.file, content, 'utf-8');
        console.log(`  ✓ 已修復: ${error.file}`);
      }
    } catch (fixError) {
      console.log(`  ✗ 無法修復 ${error.file}: ${fixError.message}`);
    }
  }
}

function resolveImportPath(fromFile, importPath) {
  if (importPath.startsWith('@/')) {
    return path.join(__dirname, 'src', importPath.slice(2));
  }
  
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return path.resolve(path.dirname(fromFile), importPath);
  }
  
  return null;
}

// 主循環
console.log('開始持續 build 直到成功...\n');

while (attemptCount < maxAttempts) {
  const success = runBuild();
  
  if (success) {
    console.log('\n🎉 恭喜！Build 成功完成！');
    process.exit(0);
  }
  
  if (attemptCount >= maxAttempts) {
    console.log('\n❌ 達到最大嘗試次數，請手動檢查錯誤。');
    process.exit(1);
  }
  
  // 等待一下再重試
  console.log('\n等待 2 秒後重試...');
  setTimeout(() => {}, 2000);
}

