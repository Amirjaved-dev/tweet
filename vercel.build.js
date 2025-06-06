// This script will be run by Vercel during the build process
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

console.log('Starting Vercel build process...');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

if (!fs.existsSync('dist/public')) {
  fs.mkdirSync('dist/public');
}

try {
  // Build the client
  console.log('Building client...');
  execSync('vite build --outDir dist/public', { stdio: 'inherit' });
  
  // Copy index.html to the root of dist/public
  if (fs.existsSync('dist/public/index.html')) {
    console.log('Index.html exists, deployment should work correctly');
  } else {
    console.error('Error: index.html not found in dist/public!');
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 