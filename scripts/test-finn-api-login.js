#!/usr/bin/env node

/**
 * Test Finn's login via the actual API endpoint
 */

require('dotenv').config();

async function testApiLogin() {
  const email = 'finn@runegateco.com';
  const password = 'g2W*TKaCVRW&n2';
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://action.adrata.com';
  const signInUrl = `${apiUrl}/api/auth/sign-in`;

  console.log('Testing API login:');
  console.log(`  URL: ${signInUrl}`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password.substring(0, 4)}...`);
  console.log('');

  try {
    const response = await fetch(signInUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        platform: 'web',
        rememberMe: false
      })
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Login successful!');
    } else {
      console.log(`\n❌ Login failed: ${data.error}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApiLogin();
