#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearLocalStorageCache() {
  try {
    console.log('🗑️ Clearing localStorage cache for speedrun...');
    
    // Get Victoria's workspace ID
    const victoria = await prisma.users.findFirst({
      where: {
        name: { contains: 'Victoria' }
      },
      select: {
        id: true,
        name: true,
        activeWorkspaceId: true
      }
    });
    
    if (!victoria) {
      console.log('❌ Victoria not found');
      return;
    }
    
    console.log(`Found Victoria: ${victoria.name}`);
    console.log(`Workspace ID: ${victoria.activeWorkspaceId}`);
    
    // Create a simple HTML page that clears localStorage
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Clear Speedrun Cache</title>
</head>
<body>
    <h1>Clearing Speedrun Cache</h1>
    <div id="status">Clearing cache...</div>
    <script>
        console.log('Clearing localStorage cache...');
        
        // Clear all speedrun-related cache
        const workspaceId = '${victoria.activeWorkspaceId}';
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('speedrun') || key.includes(workspaceId))) {
                keysToRemove.push(key);
            }
        }
        
        console.log('Keys to remove:', keysToRemove);
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('Removed:', key);
        });
        
        // Also clear sessionStorage
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('speedrun') || key.includes(workspaceId))) {
                sessionKeysToRemove.push(key);
            }
        }
        
        console.log('Session keys to remove:', sessionKeysToRemove);
        
        sessionKeysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
            console.log('Removed session:', key);
        });
        
        document.getElementById('status').innerHTML = 'Cache cleared! Keys removed: ' + keysToRemove.length + ' localStorage, ' + sessionKeysToRemove.length + ' sessionStorage';
        console.log('Cache clearing complete');
    </script>
</body>
</html>
    `;
    
    // Write the HTML file
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'clear-cache.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log(`✅ Created cache clearing page: ${htmlPath}`);
    console.log('📝 Instructions:');
    console.log('1. Open the HTML file in your browser');
    console.log('2. Check the browser console for confirmation');
    console.log('3. Refresh the speedrun page');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearLocalStorageCache();
