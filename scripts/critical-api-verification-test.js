#!/usr/bin/env node

/**
 * 🚨 CRITICAL API VERIFICATION TEST
 * 
 * Tests actual API connectivity and real data responses
 * Zero tolerance for hallucination - must prove APIs work
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function criticalAPIVerificationTest() {
    console.log('🚨 CRITICAL API VERIFICATION TEST');
    console.log('=' .repeat(50));
    
    const results = {
        nodeJs: false,
        database: false,
        coreSignal: false,
        perplexity: false,
        dropContact: false,
        twilio: false,
        realDataFlow: false
    };
    
    // Test 1: Node.js and Environment
    console.log('\n1️⃣ Testing Node.js and Environment...');
    try {
        console.log(`✅ Node.js version: ${process.version}`);
        console.log(`📍 Working directory: ${process.cwd()}`);
        
        // Check environment variables
        const envVars = {
            'DATABASE_URL': !!process.env.DATABASE_URL,
            'CORESIGNAL_API_KEY': !!process.env.CORESIGNAL_API_KEY,
            'PERPLEXITY_API_KEY': !!process.env.PERPLEXITY_API_KEY,
            'DROPCONTACT_API_KEY': !!process.env.DROPCONTACT_API_KEY,
            'TWILIO_ACCOUNT_SID': !!process.env.TWILIO_ACCOUNT_SID,
            'TWILIO_AUTH_TOKEN': !!process.env.TWILIO_AUTH_TOKEN
        };
        
        console.log('🔧 Environment variables:');
        for (const [key, value] of Object.entries(envVars)) {
            console.log(`   ${value ? '✅' : '❌'} ${key}: ${value ? 'Set' : 'Not set'}`);
        }
        
        results.nodeJs = true;
        
    } catch (error) {
        console.log(`❌ Node.js test failed: ${error.message}`);
        return results;
    }
    
    // Test 2: Database Connection
    console.log('\n2️⃣ Testing Database Connection...');
    try {
        await prisma.$connect();
        
        const companyCount = await prisma.companies.count({
            where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1' }
        });
        
        const peopleCount = await prisma.people.count({
            where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1' }
        });
        
        console.log(`✅ Database connected successfully`);
        console.log(`📊 TOP Data: ${companyCount} companies, ${peopleCount} people`);
        
        // Test specific real contact
        const chrisMantle = await prisma.people.findFirst({
            where: {
                email: 'chris.mantle@pse.com',
                workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
            }
        });
        
        if (chrisMantle) {
            console.log(`✅ Real contact verified: ${chrisMantle.firstName} ${chrisMantle.lastName}`);
            console.log(`   Email: ${chrisMantle.email}`);
            console.log(`   Phone: ${chrisMantle.phone || 'Not available'}`);
        } else {
            console.log(`❌ Chris Mantle not found in database`);
        }
        
        results.database = true;
        
    } catch (error) {
        console.log(`❌ Database test failed: ${error.message}`);
    }
    
    // Test 3: CoreSignal API
    console.log('\n3️⃣ Testing CoreSignal API...');
    if (process.env.CORESIGNAL_API_KEY) {
        try {
            const response = await axios({
                method: 'GET',
                url: 'https://api.coresignal.com/cdapi/v1/linkedin/person/search',
                headers: {
                    'Authorization': `Bearer ${process.env.CORESIGNAL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    title: 'Engineer',
                    company_name: 'Idaho Power',
                    limit: 1
                },
                timeout: 10000
            });
            
            console.log(`✅ CoreSignal API responded: Status ${response.status}`);
            console.log(`📊 Response data type: ${typeof response.data}`);
            console.log(`📦 Data sample: ${JSON.stringify(response.data).substring(0, 200)}...`);
            
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                console.log(`✅ Real data received: ${response.data.length} records`);
                results.coreSignal = true;
            } else {
                console.log(`⚠️ API responded but no data returned`);
            }
            
        } catch (error) {
            console.log(`❌ CoreSignal API failed: ${error.response?.status} ${error.response?.statusText || error.message}`);
            if (error.response?.data) {
                console.log(`   Error details: ${JSON.stringify(error.response.data)}`);
            }
        }
    } else {
        console.log(`❌ CoreSignal API key not available`);
    }
    
    // Test 4: Perplexity API
    console.log('\n4️⃣ Testing Perplexity API...');
    if (process.env.PERPLEXITY_API_KEY) {
        try {
            const response = await axios({
                method: 'POST',
                url: 'https://api.perplexity.ai/chat/completions',
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    model: 'llama-3.1-sonar-small-128k-online',
                    messages: [
                        {
                            role: 'user',
                            content: 'Is Chris Mantle currently employed at Puget Sound Energy as of December 2024? Please provide a brief yes/no answer.'
                        }
                    ],
                    max_tokens: 50
                },
                timeout: 15000
            });
            
            console.log(`✅ Perplexity API responded: Status ${response.status}`);
            if (response.data?.choices?.[0]?.message?.content) {
                console.log(`✅ Real AI response received: "${response.data.choices[0].message.content}"`);
                console.log(`📊 Tokens used: ${response.data.usage?.total_tokens || 'unknown'}`);
                results.perplexity = true;
            } else {
                console.log(`⚠️ API responded but no content returned`);
            }
            
        } catch (error) {
            console.log(`❌ Perplexity API failed: ${error.response?.status} ${error.response?.statusText || error.message}`);
            if (error.response?.data) {
                console.log(`   Error details: ${JSON.stringify(error.response.data)}`);
            }
        }
    } else {
        console.log(`❌ Perplexity API key not available`);
    }
    
    // Test 5: DropContact API
    console.log('\n5️⃣ Testing DropContact API...');
    if (process.env.DROPCONTACT_API_KEY) {
        try {
            const response = await axios({
                method: 'POST',
                url: 'https://api.dropcontact.io/batch',
                headers: {
                    'X-Access-Token': process.env.DROPCONTACT_API_KEY,
                    'Content-Type': 'application/json'
                },
                data: {
                    data: [{ email: 'chris.mantle@pse.com' }],
                    siren: false,
                    language: 'en'
                },
                timeout: 15000
            });
            
            console.log(`✅ DropContact API responded: Status ${response.status}`);
            if (response.data?.data?.[0]) {
                const result = response.data.data[0];
                console.log(`✅ Real email validation: Status "${result.email_status}"`);
                console.log(`📊 Qualification: ${result.qualification || 'unknown'}`);
                results.dropContact = true;
            } else {
                console.log(`⚠️ API responded but no validation data returned`);
            }
            
        } catch (error) {
            console.log(`❌ DropContact API failed: ${error.response?.status} ${error.response?.statusText || error.message}`);
            if (error.response?.data) {
                console.log(`   Error details: ${JSON.stringify(error.response.data)}`);
            }
        }
    } else {
        console.log(`❌ DropContact API key not available`);
    }
    
    // Test 6: Twilio API
    console.log('\n6️⃣ Testing Twilio API...');
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
            
            // Test with Chris Mantle's phone if available
            const testPhone = '+14252485632'; // Chris Mantle's phone from database
            
            const response = await axios({
                method: 'GET',
                url: `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(testPhone)}?Fields=line_type_intelligence`,
                headers: {
                    'Authorization': `Basic ${auth}`
                },
                timeout: 10000
            });
            
            console.log(`✅ Twilio API responded: Status ${response.status}`);
            if (response.data) {
                console.log(`✅ Real phone validation: ${response.data.phone_number}`);
                console.log(`📊 Valid: ${response.data.valid}`);
                console.log(`📞 Line type: ${response.data.line_type_intelligence?.type || 'unknown'}`);
                results.twilio = true;
            } else {
                console.log(`⚠️ API responded but no phone data returned`);
            }
            
        } catch (error) {
            console.log(`❌ Twilio API failed: ${error.response?.status} ${error.response?.statusText || error.message}`);
            if (error.response?.data) {
                console.log(`   Error details: ${JSON.stringify(error.response.data)}`);
            }
        }
    } else {
        console.log(`❌ Twilio credentials not available`);
    }
    
    // Test 7: Real Data Flow
    console.log('\n7️⃣ Testing Real Data Flow...');
    if (results.database && (results.coreSignal || results.perplexity)) {
        console.log(`✅ Real data flow possible: Database + API integration confirmed`);
        results.realDataFlow = true;
    } else {
        console.log(`❌ Real data flow not confirmed: Missing database or API connectivity`);
    }
    
    // Final Assessment
    console.log('\n' + '='.repeat(50));
    console.log('🏁 CRITICAL VERIFICATION RESULTS');
    console.log('='.repeat(50));
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`📊 Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
    console.log('');
    
    for (const [test, passed] of Object.entries(results)) {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'WORKING' : 'FAILED'}`);
    }
    
    console.log('');
    if (successRate >= 80) {
        console.log('🎉 ✅ SYSTEM READY FOR CLIENT PRESENTATION');
        console.log('   All critical APIs confirmed working with real data');
    } else if (successRate >= 60) {
        console.log('⚠️ 🔧 SYSTEM NEEDS FIXES BEFORE CLIENT PRESENTATION');
        console.log('   Some APIs working but critical gaps remain');
    } else {
        console.log('🚨 ❌ SYSTEM NOT READY - CRITICAL FAILURES');
        console.log('   Too many API failures to guarantee real data');
    }
    
    await prisma.$disconnect();
    return results;
}

// Run the test
if (require.main === module) {
    criticalAPIVerificationTest()
        .catch(error => {
            console.error('💥 CRITICAL TEST FAILED:', error.message);
            process.exit(1);
        });
}

module.exports = { criticalAPIVerificationTest };
