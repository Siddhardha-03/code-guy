#!/usr/bin/env node

/**
 * Railway + Render Deployment Helper Script
 * Validates configuration and provides deployment guidance
 * 
 * Usage: node deployment-helper.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log('green', `✅ ${description}`);
    return true;
  } else {
    log('red', `❌ ${description}`);
    return false;
  }
}

function checkEnvironmentTemplate() {
  const envTemplate = path.join(__dirname, '.env.railway-render');
  return checkFile(envTemplate, 'Environment template (.env.railway-render)');
}

function checkClientFiles() {
  const clientFiles = [
    { path: 'client/public/_redirects', desc: 'Client redirects file' },
    { path: 'client/public/_headers', desc: 'Client headers file' },
    { path: 'client/render-client-deployment.md', desc: 'Client deployment guide' }
  ];
  
  let allGood = true;
  clientFiles.forEach(file => {
    const exists = checkFile(path.join(__dirname, file.path), file.desc);
    allGood = allGood && exists;
  });
  
  return allGood;
}

function checkServerFiles() {
  const serverFiles = [
    { path: 'server/render.yaml', desc: 'Server Render configuration' },
    { path: 'server/render-deployment-guide.md', desc: 'Server deployment guide' },
    { path: 'server/railway-db-config.md', desc: 'Railway database guide' },
    { path: 'server/test-railway-connection.js', desc: 'Database connection test' }
  ];
  
  let allGood = true;
  serverFiles.forEach(file => {
    const exists = checkFile(path.join(__dirname, file.path), file.desc);
    allGood = allGood && exists;
  });
  
  return allGood;
}

function checkPackageJson() {
  try {
    // Check server package.json
    const serverPackage = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
    if (serverPackage.engines && serverPackage.engines.node) {
      log('green', '✅ Server Node.js engine specified');
    } else {
      log('red', '❌ Server package.json missing Node.js engine');
      return false;
    }
    
    // Check client package.json
    const clientPackage = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
    if (clientPackage.engines && clientPackage.engines.node) {
      log('green', '✅ Client Node.js engine specified');
    } else {
      log('red', '❌ Client package.json missing Node.js engine');
      return false;
    }
    
    return true;
  } catch (error) {
    log('red', '❌ Error reading package.json files');
    return false;
  }
}

function displayDeploymentSteps() {
  log('blue', '\n🚀 RAILWAY + RENDER DEPLOYMENT STEPS:');
  console.log('\n1. RAILWAY DATABASE SETUP:');
  console.log('   • Go to railway.app');
  console.log('   • Deploy MySQL template');
  console.log('   • Copy connection variables');
  console.log('   • Run: node server/test-railway-connection.js');
  
  console.log('\n2. RENDER SERVER DEPLOYMENT:');
  console.log('   • Go to render.com → New Web Service');
  console.log('   • Connect GitHub repo');
  console.log('   • Root directory: server');
  console.log('   • Add environment variables from Railway');
  console.log('   • Deploy and test /api/health endpoint');
  
  console.log('\n3. RENDER CLIENT DEPLOYMENT:');
  console.log('   • Go to render.com → New Static Site');
  console.log('   • Root directory: client');
  console.log('   • Add REACT_APP_API_URL with server URL');
  console.log('   • Deploy and test authentication');
  
  console.log('\n4. CROSS-PLATFORM CONFIGURATION:');
  console.log('   • Update server CLIENT_URL with client URL');
  console.log('   • Add domains to Firebase authorized list');
  console.log('   • Test complete application flow');
}

function displayEnvironmentGuide() {
  log('blue', '\n🔧 ENVIRONMENT VARIABLES GUIDE:');
  console.log('\nRAILWAY → RENDER SERVER MAPPING:');
  console.log('MYSQLHOST → DB_HOST');
  console.log('MYSQLPORT → DB_PORT');
  console.log('MYSQLUSER → DB_USER');
  console.log('MYSQLPASSWORD → DB_PASSWORD');
  console.log('MYSQLDATABASE → DB_NAME');
  
  console.log('\nREQUIRED RENDER CLIENT VARIABLES:');
  console.log('REACT_APP_API_URL=https://your-server.onrender.com/api');
  console.log('REACT_APP_FIREBASE_PROJECT_ID=code-guy');
  console.log('REACT_APP_FIREBASE_AUTH_DOMAIN=code-guy.firebaseapp.com');
  
  console.log('\nSee .env.railway-render for complete template');
}

function main() {
  log('blue', '🔍 RAILWAY + RENDER DEPLOYMENT VALIDATION\n');
  
  let allChecksPass = true;
  
  // Check configuration files
  allChecksPass = checkEnvironmentTemplate() && allChecksPass;
  allChecksPass = checkServerFiles() && allChecksPass;
  allChecksPass = checkClientFiles() && allChecksPass;
  allChecksPass = checkPackageJson() && allChecksPass;
  
  console.log('\n' + '='.repeat(50));
  
  if (allChecksPass) {
    log('green', '\n🎉 ALL DEPLOYMENT FILES READY!');
    displayDeploymentSteps();
    displayEnvironmentGuide();
    
    log('green', '\n📚 DOCUMENTATION AVAILABLE:');
    console.log('• RAILWAY_RENDER_DEPLOYMENT.md - Complete guide');
    console.log('• server/render-deployment-guide.md - Server setup');
    console.log('• client/render-client-deployment.md - Client setup');
    console.log('• cross-platform-config.md - Integration guide');
    
  } else {
    log('red', '\n❌ DEPLOYMENT VALIDATION FAILED');
    log('yellow', 'Please fix the missing files before deploying.');
  }
  
  console.log('\n' + '='.repeat(50));
  log('blue', 'Estimated total cost: $12-17/month');
  log('blue', 'Deployment time: ~30 minutes');
  log('blue', 'Support: Check documentation files for troubleshooting');
}

// Run validation
main();