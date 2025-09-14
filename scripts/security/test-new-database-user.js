#!/usr/bin/env node

// Test script for new database user connection
const { Client } = require('pg');

async function testDatabaseConnection() {
  console.log('🔍 Testing new database user connection...');
  
  // Replace with your NEW credentials from Neon Console
  const NEW_DATABASE_URL = 'postgresql://adrata:npg_F4Y0IJrNUjEv@ep-morning-hill-a8m5cnzb-pooler.eastus2.azure.neon.tech/adrata_db?sslmode=require&channel_binding=require';
  
  const client = new Client({
    connectionString: NEW_DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('✅ Connection successful!');
    
    // Test table access first
    console.log('🔍 Testing table access...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`✅ Tables accessible: ${tables.rows.length} tables found`);
    console.log('📋 Available tables:', tables.rows.map(row => row.table_name).join(', '));
    
    // Test basic query if leads table exists
    if (tables.rows.some(row => row.table_name.toLowerCase() === 'leads')) {
      console.log('🔍 Testing leads query...');
      const result = await client.query('SELECT COUNT(*) as total_leads FROM "leads"');
      console.log(`✅ Query successful: ${result.rows[0].total_leads} leads found`);
    } else {
      console.log('⚠️  Leads table not found, but connection is working!');
    }
    
    console.log('🎉 NEW DATABASE USER WORKING PERFECTLY!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('💡 Check your credentials and try again');
  } finally {
    await client.end();
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
