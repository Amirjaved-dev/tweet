#!/bin/bash

# Set environment variables
export NODE_ENV=production
export VERCEL=1

# Install global tools
npm install -g vite typescript esbuild

# Build client
echo "Building client..."
vite build

# Build server
echo "Building server..."
tsc -p tsconfig.server.json
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify

echo "Build completed successfully!" 