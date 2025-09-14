#!/usr/bin/env node

/**
 * Workspace Manager for Adrata Multi-Workspace Setup
 * Helps manage access to production, demo, and TOPS workspaces
 */

const fs = require('fs');
const path = require('path');

const WORKSPACES = {
  production: {
    name: '🚀 Adrata (Production)',
    path: '/Users/rosssylvester/Development/adrata',
    workspaceFile: 'adrata.code-workspace',
    description: 'Main production workspace with real data (867+ leads, 277 prospects, etc.)'
  },
  demo: {
    name: '🎯 Demo (Safe Testing)',
    path: '/Users/rosssylvester/Development/Demo',
    workspaceFile: 'Demo.code-workspace',
    description: 'Safe demo workspace with fictional data for testing and training'
  },
  tops: {
    name: '👨‍💻 TOPS',
    path: '/Users/rosssylvester/Development/TOPS',
    workspaceFile: 'TOPS.code-workspace',
    description: 'Engineering talent management workspace'
  },
  multi: {
    name: '🔄 Multi-Workspace (Production + Demo + TOPS)',
    path: '/Users/rosssylvester/Development/adrata',
    workspaceFile: 'adrata-multi.code-workspace',
    description: 'Access all workspaces simultaneously'
  }
};

function showWorkspaceInfo() {
  console.log('🎯 ADRATA WORKSPACE MANAGER\n');
  console.log('Available workspaces:\n');
  
  Object.entries(WORKSPACES).forEach(([key, workspace]) => {
    console.log(`${workspace.name}`);
    console.log(`   📁 Path: ${workspace.path}`);
    console.log(`   📄 Workspace: ${workspace.workspaceFile}`);
    console.log(`   📝 Description: ${workspace.description}`);
    console.log(`   🚀 Command: code ${workspace.workspaceFile}`);
    console.log('');
  });
}

function openWorkspace(workspaceKey) {
  const workspace = WORKSPACES[workspaceKey];
  if (!workspace) {
    console.log(`❌ Unknown workspace: ${workspaceKey}`);
    console.log('Available workspaces:', Object.keys(WORKSPACES).join(', '));
    return;
  }
  
  const workspacePath = path.join(workspace.path, workspace.workspaceFile);
  
  if (!fs.existsSync(workspacePath)) {
    console.log(`❌ Workspace file not found: ${workspacePath}`);
    return;
  }
  
  console.log(`🚀 Opening ${workspace.name}...`);
  console.log(`   📁 Path: ${workspacePath}`);
  console.log(`   📄 Workspace: ${workspace.workspaceFile}`);
  
  // Use VS Code to open the workspace
  const { execSync } = require('child_process');
  try {
    execSync(`code "${workspacePath}"`, { stdio: 'inherit' });
    console.log(`✅ Successfully opened ${workspace.name}`);
  } catch (error) {
    console.log(`❌ Error opening workspace: ${error.message}`);
    console.log(`💡 Try opening manually: code "${workspacePath}"`);
  }
}

function showUserAccess() {
  console.log('👥 USER ACCESS CONFIGURATION\n');
  
  console.log('🎯 Dan Mirolli (Owner):');
  console.log('   ✅ Full access to Adrata workspace');
  console.log('   ✅ Full access to Demo workspace');
  console.log('   ✅ Full access to TOPS workspace');
  console.log('   ✅ 867+ real leads, 277 prospects, 1130 contacts, 232 accounts');
  console.log('');
  
  console.log('🎯 Victoria Leland (Business Development Manager):');
  console.log('   📧 Email: vleland@topengineersplus.com');
  console.log('   ✅ Access to TOPS workspace');
  console.log('   ✅ Manager role - manages Matthew and Justin');
  console.log('   ✅ Business development activities');
  console.log('');
  
  console.log('🎯 Matthew Torvik (Controller):');
  console.log('   📧 Email: mtorvik@topengineersplus.com');
  console.log('   ✅ Access to TOPS workspace');
  console.log('   📋 Reports to: Victoria Leland');
  console.log('   ✅ Financial oversight and reporting');
  console.log('');
  
  console.log('🎯 Justin Bedard (Business Relationship Manager):');
  console.log('   📧 Email: jbedard@topengineersplus.com');
  console.log('   ✅ Access to TOPS workspace');
  console.log('   📋 Reports to: Victoria Leland');
  console.log('   ✅ Client relationship management');
  console.log('');
  
  console.log('🔄 Multi-Workspace Access:');
  console.log('   ✅ Access all workspaces simultaneously');
  console.log('   ✅ Easy switching between workspaces');
  console.log('   ✅ Maintains separate data isolation');
}

function showUsage() {
  console.log('📖 USAGE\n');
  console.log('node scripts/workspace-manager.js [command]\n');
  console.log('Commands:');
  console.log('  info                    Show all available workspaces');
  console.log('  access                  Show user access details');
  console.log('  production              Open production workspace');
  console.log('  demo                    Open demo workspace');
  console.log('  tops                    Open TOPS workspace');
  console.log('  multi                   Open multi-workspace view');
  console.log('  help                    Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/workspace-manager.js info');
  console.log('  node scripts/workspace-manager.js demo');
  console.log('  node scripts/workspace-manager.js tops');
  console.log('  node scripts/workspace-manager.js multi');
}

// Main execution
const command = process.argv[2] || 'help';

switch (command) {
  case 'info':
    showWorkspaceInfo();
    break;
  case 'access':
    showUserAccess();
    break;
  case 'production':
    openWorkspace('production');
    break;
  case 'demo':
    openWorkspace('demo');
    break;
  case 'tops':
    openWorkspace('tops');
    break;
  case 'multi':
    openWorkspace('multi');
    break;
  case 'help':
  default:
    showUsage();
    break;
}
