#!/usr/bin/env node

// ESM-compatible build script for Firebase deploy
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔥 Building Switch Market for Firebase...\n');

try {
  // Step 1: Build frontend
  console.log('📦 Building frontend with Vite...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Ensure dist directory exists
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Step 3: Move built files to correct location (validate build)
  console.log('📁 Organizing build files...');
  // Vite outputs client build into dist/public per project config
  const publicDir = path.join(process.cwd(), 'dist', 'public');
  if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
    throw new Error('Build failed - dist/public/index.html not found');
  }

  // Step 4: Copy attached assets to build using cross-platform fs.cpSync
  console.log('🖼️  Copying attached assets...');
  const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
  const distAssetsDir = path.join(publicDir, 'attached_assets');
  if (fs.existsSync(attachedAssetsDir)) {
    // Node 16+ supports fs.cpSync; fallback to manual copy otherwise
    if (typeof fs.cpSync === 'function') {
      fs.cpSync(attachedAssetsDir, distAssetsDir, { recursive: true });
    } else {
      // naive recursive copy
      const copyRecursive = (src, dest) => {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) copyRecursive(srcPath, destPath);
          else fs.copyFileSync(srcPath, destPath);
        }
      };
      copyRecursive(attachedAssetsDir, distAssetsDir);
    }
  }

  console.log('✅ Build completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up Firebase secrets:');
  console.log('   - VITE_FIREBASE_API_KEY');
  console.log('   - VITE_FIREBASE_PROJECT_ID');
  console.log('   - VITE_FIREBASE_APP_ID');
  console.log('2. Run: firebase deploy');

} catch (error) {
  console.error('❌ Build failed:', (error && error.message) || String(error));
  process.exit(1);
}