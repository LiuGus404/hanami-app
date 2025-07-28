#!/bin/bash

# 批量修復 HanamiButton 和 HanamiCard 的導入問題

echo "開始修復導入問題..."

# 修復 HanamiButton 導入
find src -name "*.tsx" -type f -exec sed -i '' 's/import HanamiButton from '\''@\/components\/ui\/HanamiButton'\''/import { HanamiButton } from '\''@\/components\/ui\/HanamiButton'\''/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/import HanamiButton from '\''\.\/HanamiButton'\''/import { HanamiButton } from '\''\.\/HanamiButton'\''/g' {} \;

# 修復 HanamiCard 導入
find src -name "*.tsx" -type f -exec sed -i '' 's/import HanamiCard from '\''@\/components\/ui\/HanamiCard'\''/import { HanamiCard } from '\''@\/components\/ui\/HanamiCard'\''/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/import HanamiCard from '\''\.\/HanamiCard'\''/import { HanamiCard } from '\''\.\/HanamiCard'\''/g' {} \;

echo "導入問題修復完成！" 