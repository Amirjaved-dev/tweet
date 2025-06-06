// Simple build script for client
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create dist directory if it doesn't exist
const distPath = path.resolve('../dist/public');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

console.log('Building client with Vite...');
try {
  // Run Vite build
  execSync('vite build --outDir ../dist/public', { stdio: 'inherit' });
  console.log('Client build completed successfully');
} catch (error) {
  console.error('Client build failed:', error);
  process.exit(1);
} 