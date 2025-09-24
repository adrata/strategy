#!/usr/bin/env node

/**
 * 🔐 UPDATE DAN'S PASSWORD VIA API
 * Update dan@adrata.com password to "DanGoat90!" using the API endpoints
 * This approach uses the existing authentication system
 */

const fetch = require('node-fetch');

async function updateDanPasswordViaAPI() {
  try {
    console.log('🔐 UPDATING DAN\'S PASSWORD VIA API\n');
    console.log('Target user: dan@adrata.com');
    console.log('New password: DanGoat90!\n');

    // First, we need to login as Dan to get authentication
    console.log('🔍 Step 1: Attempting to login as Dan...');
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/unified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        credentials: {
          email: 'dan@adrata.com',
          password: 'password' // Try the default password first
        }
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed with default password, trying other common passwords...');
      
      // Try other common passwords
      const commonPasswords = ['dan', 'danpass', 'DanGoat90!'];
      
      for (const password of commonPasswords) {
        console.log(`🔍 Trying password: ${password}`);
        
        const tryLoginResponse = await fetch('http://localhost:3000/api/auth/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'login',
            credentials: {
              email: 'dan@adrata.com',
              password: password
            }
          })
        });

        if (tryLoginResponse.ok) {
          console.log(`✅ Successfully logged in with password: ${password}`);
          
          const loginData = await tryLoginResponse.json();
          console.log('🔍 Login response:', JSON.stringify(loginData, null, 2));
          
          // Extract the access token from the response
          const accessToken = loginData.accessToken || loginData.token;
          
          if (!accessToken) {
            console.log('❌ No access token found in login response');
            return;
          }
          
          // Now change the password to DanGoat90!
          console.log('\n🔐 Step 2: Changing password to "DanGoat90!"...');
          
          const changePasswordResponse = await fetch('http://localhost:3000/api/settings/user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'Cookie': tryLoginResponse.headers.get('set-cookie') || ''
            },
            body: JSON.stringify({
              action: 'change_password',
              currentPassword: password,
              newPassword: 'DanGoat90!'
            })
          });

          console.log('🔍 Password change response status:', changePasswordResponse.status);
          
          if (changePasswordResponse.ok) {
            const changeResult = await changePasswordResponse.json();
            console.log('🔍 Password change result:', JSON.stringify(changeResult, null, 2));
            
            if (changeResult.success) {
              console.log('✅ Password successfully changed to "DanGoat90!"');
              console.log('\n🎉 DAN\'S PASSWORD UPDATE COMPLETE');
              console.log('=====================================');
              console.log('Email: dan@adrata.com');
              console.log('Password: DanGoat90!');
              console.log('Status: Ready for login');
            } else {
              console.log('❌ Password change failed:', changeResult.error);
            }
          } else {
            const errorText = await changePasswordResponse.text();
            console.log('❌ Password change request failed:', errorText);
          }
          return;
        }
      }
      
      console.log('❌ Could not login with any common passwords');
      console.log('   The password may already be set to "DanGoat90!" or another secure password');
      return;
    }

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Successfully logged in as Dan');
      console.log('🎉 Dan\'s password is already working!');
      console.log('   You can login with:');
      console.log('   Email: dan@adrata.com');
      console.log('   Password: password (or the current password)');
    } else {
      console.log('❌ Login failed:', loginData.error);
    }

  } catch (error) {
    console.error('❌ Error updating Dan\'s password:', error.message);
    console.log('\n💡 Alternative approaches:');
    console.log('   1. Check if the development server is running (npm run dev)');
    console.log('   2. Try logging in through the web interface');
    console.log('   3. Contact the system administrator for password reset');
  }
}

// Run the script
updateDanPasswordViaAPI();
