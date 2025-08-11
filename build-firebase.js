#!/usr/bin/env node

/**
 * Build script per Firebase Deploy di Switch Market
 * 
 * Questo script:
 * 1. Builda il frontend con Vite
 * 2. Copia gli assets nella cartella corretta
 * 3. Prepara tutto per Firebase Hosting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Building Switch Market for Firebase...\n');

try {
  // Step 1: Build frontend
  console.log('📦 Building frontend with Vite...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Ensure dist directory exists
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Step 3: Move built files to correct location
  console.log('📁 Organizing build files...');
  
  // Vite builds to dist by default, but we need to ensure structure is correct
  const sourceDir = path.join(__dirname, 'dist');
  
  // Check if build was successful
  if (!fs.existsSync(path.join(sourceDir, 'index.html'))) {
    throw new Error('Build failed - index.html not found');
  }
  
  // Step 4: Copy attached assets to build
  console.log('🖼️  Copying attached assets...');
  const attachedAssetsDir = path.join(__dirname, 'attached_assets');
  const distAssetsDir = path.join(distDir, 'attached_assets');
  
  if (fs.existsSync(attachedAssetsDir)) {
    execSync(`cp -r "${attachedAssetsDir}" "${distAssetsDir}"`, { stdio: 'inherit' });
  }
  
  console.log('✅ Build completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up Firebase secrets:');
  console.log('   - VITE_FIREBASE_API_KEY');
  console.log('   - VITE_FIREBASE_PROJECT_ID');
  console.log('   - VITE_FIREBASE_APP_ID');
  console.log('2. Run: firebase deploy');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}