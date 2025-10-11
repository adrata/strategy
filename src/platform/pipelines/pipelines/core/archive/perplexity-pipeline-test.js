require('dotenv').config();
const { MultiSourceVerifier } = require('../modules/core/MultiSourceVerifier');

/**
 * 🔍 PERPLEXITY PIPELINE INTEGRATION TEST
 * 
 * Test Perplexity API integration with the actual pipeline
 */

async function testPerplexityPipelineIntegration() {
    console.log('🧪 PERPLEXITY PIPELINE INTEGRATION TEST');
    console.log('========================================\n');

    // Initialize the MultiSourceVerifier
    const verifier = new MultiSourceVerifier();

    // Test cases with real executives
    const testCases = [
        {
            name: 'Valid CFO - HighRadius',
            person: 'Tres Thompson',
            title: 'Chief Financial Officer',
            company: 'HighRadius'
        },
        {
            name: 'Valid CRO - HighRadius', 
            person: 'Sravan Bharadwaj',
            title: 'Chief Of Staff',
            company: 'HighRadius'
        },
        {
            name: 'Invalid Person',
            person: 'John Doe',
            title: 'CFO',
            company: 'FakeCompany'
        }
    ];

    for (const testCase of testCases) {
        console.log(`🧪 Testing: ${testCase.name}`);
        console.log(`   Person: ${testCase.person}`);
        console.log(`   Title: ${testCase.title}`);
        console.log(`   Company: ${testCase.company}`);
        
        try {
            const result = await verifier.verifyWithPerplexity(
                testCase.person,
                testCase.title,
                testCase.company
            );

            if (result) {
                console.log(`   ✅ SUCCESS: ${testCase.name}`);
                console.log(`   Is Current: ${result.isCurrent}`);
                console.log(`   Confidence: ${result.confidence}%`);
                console.log(`   Last Known Date: ${result.lastKnownDate}`);
                console.log(`   Reasoning: ${result.reasoning}`);
            } else {
                console.log(`   ❌ FAILED: ${testCase.name} - No result returned`);
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${testCase.name}`);
            console.log(`   Error: ${error.message}`);
        }
        console.log('');
    }

    // Test the full multi-source verification
    console.log('🔄 Testing Full Multi-Source Verification...');
    try {
        const result = await verifier.verifyPersonIdentity(
            'Tres Thompson',
            'HighRadius',
            'www.highradius.com'
        );

        if (result) {
            console.log('   ✅ Multi-Source Verification: SUCCESS');
            console.log(`   Confidence: ${result.confidence}%`);
            console.log(`   Reasoning: ${result.reasoning}`);
            console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
        } else {
            console.log('   ❌ Multi-Source Verification: FAILED');
        }
    } catch (error) {
        console.log('   ❌ Multi-Source Verification: ERROR');
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n🏁 PERPLEXITY PIPELINE INTEGRATION TEST COMPLETE');
}

// Run the test
testPerplexityPipelineIntegration().catch(console.error);
