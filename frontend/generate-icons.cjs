// Скрипт для генерации иконок PWA разных размеров
// Запуск: node generate-icons.js

const fs = require('fs');
const path = require('path');

// Размеры иконок для PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const iconsDir = path.join(__dirname, 'public', 'icons');
const svgPath = path.join(iconsDir, 'icon.svg');

console.log('🎨 Генерация иконок для PWA...\n');

// Проверяем наличие sharp
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('📦 Устанавливаем sharp...');
  require('child_process').execSync('npm install --save-dev sharp', { stdio: 'inherit' });
  sharp = require('sharp');
}

// Читаем SVG
if (!fs.existsSync(svgPath)) {
  console.error('❌ Ошибка: icon.svg не найден в public/icons/');
  process.exit(1);
}

const svgBuffer = fs.readFileSync(svgPath);

// Генерируем иконки
async function generateIcons() {
  console.log('Генерирую иконки:\n');
  
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${size}x${size} → icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Ошибка при генерации ${size}x${size}:`, error.message);
    }
  }
  
  // Создаем apple-touch-icon
  const appleTouchPath = path.join(__dirname, 'public', 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('\n✅ apple-touch-icon.png создан (180x180)');
  
  // Создаем favicon
  const faviconPath = path.join(__dirname, 'public', 'favicon.png');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(faviconPath);
  console.log('✅ favicon.png создан (32x32)');
  
  console.log('\n🎉 Все иконки успешно сгенерированы!');
  console.log('📁 Расположение: frontend/public/icons/\n');
}

generateIcons().catch(console.error);
