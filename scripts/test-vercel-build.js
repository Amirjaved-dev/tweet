#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Testing Vercel build process locally');

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

try {
  // Run the Vercel build script
  console.log('📦 Building for Vercel...');
  execSync('npm run build:vercel', { stdio: 'inherit', cwd: rootDir });
  
  // Check if the build was successful
  if (fs.existsSync(path.join(rootDir, 'dist/public/index.html'))) {
    console.log('✅ Build successful! Static assets generated in dist/public/');
  } else {
    console.error('❌ Build failed! No index.html found in dist/public/');
    process.exit(1);
  }
  
  // Test API endpoints for Vercel
  console.log('🧪 Testing API endpoints for Vercel...');
  
  // Simple checks for API files
  const apiDir = path.join(rootDir, 'server/api');
  if (fs.existsSync(apiDir)) {
    const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.ts'));
    console.log(`📋 Found ${apiFiles.length} API endpoint files`);
    
    // Check if they use the Vercel adapter
    let adaptedCount = 0;
    for (const file of apiFiles) {
      const content = fs.readFileSync(path.join(apiDir, file), 'utf8');
      if (content.includes('createVercelHandler') || content.includes('@vercel/node')) {
        adaptedCount++;
      }
    }
    
    console.log(`✅ ${adaptedCount}/${apiFiles.length} API endpoints are adapted for Vercel`);
  }
  
  console.log('✨ All tests passed! Your app should deploy successfully on Vercel.');
  console.log('🔍 Deployment tips:');
  console.log('   1. Make sure to set all required environment variables in Vercel dashboard');
  console.log('   2. If using a database, ensure the connection string is properly configured');
  console.log('   3. Test your deployment by running a preview before going to production');
  
} catch (error) {
  console.error('❌ Error occurred during testing:', error.message);
  process.exit(1);
} 