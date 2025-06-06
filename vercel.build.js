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
  // Print current directory for debugging
  console.log('Current directory:', process.cwd());
  console.log('Directory contents:', fs.readdirSync('.'));
  
  // List client directory
  if (fs.existsSync('client')) {
    console.log('Client directory contents:', fs.readdirSync('client'));
  } else {
    console.log('Client directory not found!');
  }
  
  // Build from client directory to handle relative paths correctly
  console.log('Building client...');
  execSync('cd client && vite build --outDir ../dist/public', { stdio: 'inherit' });
  
  // Check various possible locations of index.html
  const possibleLocations = [
    'dist/public/index.html',
    'client/dist/index.html',
    'dist/index.html'
  ];
  
  let indexHtmlFound = false;
  for (const location of possibleLocations) {
    if (fs.existsSync(location)) {
      console.log(`Found index.html at ${location}`);
      indexHtmlFound = true;
      
      // If it's not in the right place, copy it
      if (location !== 'dist/public/index.html') {
        console.log(`Copying index.html from ${location} to dist/public/index.html`);
        fs.copyFileSync(location, 'dist/public/index.html');
      }
      break;
    }
  }
  
  // Check if index.html exists in the correct location now
  if (fs.existsSync('dist/public/index.html')) {
    console.log('Index.html exists in correct location, deployment should work correctly');
  } else {
    console.error('Error: index.html not found in dist/public!');
    
    // Try to create a basic index.html as a fallback
    console.log('Creating a basic index.html as fallback...');
    const basicHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ThreadFlowPro</title>
    <script type="module" src="/assets/index.js"></script>
    <link rel="stylesheet" href="/assets/index.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    
    fs.writeFileSync('dist/public/index.html', basicHtml);
    console.log('Created fallback index.html');
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 