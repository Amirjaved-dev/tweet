import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create public directory if it doesn't exist
const publicDir = path.join(path.dirname(__dirname), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Input logo file
const inputFile = path.join(path.dirname(__dirname), 'logo.png');

// Output sizes
const sizes = [
  { size: 16, name: 'logo-16.png' },
  { size: 32, name: 'logo-32.png' },
  { size: 64, name: 'logo-64.png' },
  { size: 128, name: 'logo-128.png' },
  { size: 192, name: 'logo-192.png' },
  { size: 512, name: 'logo-512.png' }
];

// Process each size
async function processImages() {
  try {
    console.log('Starting logo resizing...');
    
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Error: Logo file not found at ${inputFile}`);
      console.log('Please place your logo.png file in the root directory of the project.');
      return;
    }
    
    for (const { size, name } of sizes) {
      const outputFile = path.join(publicDir, name);
      
      await sharp(inputFile)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      
      console.log(`✅ Created ${name} (${size}x${size}px)`);
    }
    
    // Create favicon.ico (multi-size ICO file)
    // Need to save 16x16 and 32x32 PNGs first
    const favicon16Path = path.join(publicDir, 'favicon-16.png');
    const favicon32Path = path.join(publicDir, 'favicon-32.png');
    
    await sharp(inputFile)
      .resize(16, 16)
      .png()
      .toFile(favicon16Path);
      
    await sharp(inputFile)
      .resize(32, 32)
      .png()
      .toFile(favicon32Path);
    
    console.log('✅ Created temporary favicon PNG files');
    
    // Use toIco package to create ICO file if available
    try {
      const toIco = require('to-ico');
      
      const favicon16 = fs.readFileSync(favicon16Path);
      const favicon32 = fs.readFileSync(favicon32Path);
      
      const ico = await toIco([favicon16, favicon32]);
      
      fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
      
      // Clean up temporary files
      fs.unlinkSync(favicon16Path);
      fs.unlinkSync(favicon32Path);
      
      console.log('✅ Created favicon.ico');
    } catch (err) {
      console.log('⚠️ Could not create favicon.ico - please install the to-ico package:');
      console.log('npm install to-ico --save-dev');
    }
    
    // Copy files to client/public directory
    const clientPublicDir = path.join(path.dirname(__dirname), 'client', 'public');
    if (fs.existsSync(clientPublicDir)) {
      console.log('\nCopying files to client/public directory...');
      
      // Copy all logo files
      for (const { name } of sizes) {
        const sourceFile = path.join(publicDir, name);
        const destFile = path.join(clientPublicDir, name);
        fs.copyFileSync(sourceFile, destFile);
        console.log(`✅ Copied ${name} to client/public/`);
      }
      
      // Copy favicon
      const faviconSource = path.join(publicDir, 'favicon.ico');
      const faviconDest = path.join(clientPublicDir, 'favicon.ico');
      fs.copyFileSync(faviconSource, faviconDest);
      console.log('✅ Copied favicon.ico to client/public/');
      
      // Copy manifest
      const manifestSource = path.join(publicDir, 'manifest.json');
      if (fs.existsSync(manifestSource)) {
        const manifestDest = path.join(clientPublicDir, 'manifest.json');
        fs.copyFileSync(manifestSource, manifestDest);
        console.log('✅ Copied manifest.json to client/public/');
      }
    } else {
      console.log('\nℹ️ client/public directory not found. Files were only copied to public/');
    }
    
    console.log('\nAll done! Logo files have been created in the public directory.');
    console.log('Remember to update your HTML to reference these new files.');
  } catch (err) {
    console.error('❌ Error processing images:', err);
  }
}

processImages(); 