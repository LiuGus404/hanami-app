#!/bin/bash

# 构建脚本 - 持续运行直到成功
# 设置颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始持续构建检查...${NC}"
echo ""

attempt=1
max_attempts=10

while [ $attempt -le $max_attempts ]; do
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}构建尝试 #${attempt}${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo ""
    
    # 运行构建
    npm run build
    
    # 检查退出码
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ 构建成功！${NC}"
        echo -e "${GREEN}总共尝试了 ${attempt} 次${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}✗ 构建失败 (尝试 ${attempt}/${max_attempts})${NC}"
        echo ""
        
        if [ $attempt -lt $max_attempts ]; then
            echo -e "${YELLOW}等待 2 秒后重试...${NC}"
            sleep 2
        fi
    fi
    
    attempt=$((attempt + 1))
done

echo ""
echo -e "${RED}构建失败：已达到最大尝试次数 (${max_attempts})${NC}"
exit 1

