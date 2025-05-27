const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const sourceIcon = path.join(__dirname, '../public/icons/icon-512.png');
const targetDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    // 確保目標目錄存在
    await fs.mkdir(targetDir, { recursive: true });
    
    // 為每個尺寸生成圖示
    for (const size of sizes) {
      const targetPath = path.join(targetDir, `icon-${size}.png`);
      
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 250, b: 245, alpha: 0 }
        })
        .png()
        .toFile(targetPath);
      
      console.log(`Generated ${size}x${size} icon`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 