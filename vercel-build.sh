#!/bin/bash

# Set environment variables
export NODE_ENV=production
export VERCEL=1

# Install dependencies if needed
echo "Installing dependencies..."
npm ci --omit=dev

# Build client
echo "Building client..."
cd client
npx vite build --outDir ../dist/public
cd ..

# Create a special _vercel.js file for handling SSR in the public directory
echo "Creating Vercel handlers..."
cat > dist/public/_vercel.js << EOF
// This file helps Vercel correctly serve the application
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).sendFile('index.html');
}
EOF

echo "Build completed successfully!" 