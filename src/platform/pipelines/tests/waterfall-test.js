require('dotenv').config();
const { CoreSignalMultiSource } = require('../modules/core/CoreSignalMultiSource');

/**
 * 🧪 WATERFALL LOGIC TEST
 * 
 * Test the new waterfall approach for finding highest ranking executives
 */

async function testWaterfallLogic() {
    console.log('🧪 WATERFALL LOGIC TEST');
    console.log('========================\n');

    const coresignal = new CoreSignalMultiSource();

    // Test data - simulate employees with different titles
    const testEmployees = [
        { name: 'John Smith', title: 'CFO', email: 'john@company.com', phone: '555-0001' },
        { name: 'Jane Doe', title: 'VP Sales', email: 'jane@company.com', phone: '555-0002' },
        { name: 'Bob Johnson', title: 'Sales Director', email: 'bob@company.com', phone: '555-0003' },
        { name: 'Alice Brown', title: 'Marketing Director', email: 'alice@company.com', phone: '555-0004' },
        { name: 'Charlie Wilson', title: 'Head of Sales', email: 'charlie@company.com', phone: '555-0005' },
        { name: 'Diana Lee', title: 'Regional Sales Manager', email: 'diana@company.com', phone: '555-0006' },
        { name: 'Eve Taylor', title: 'Customer Success Manager', email: 'eve@company.com', phone: '555-0007' },
        { name: 'Frank Miller', title: 'Business Development Director', email: 'frank@company.com', phone: '555-0008' }
    ];

    console.log('📊 Test Employees:');
    testEmployees.forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.name} - ${emp.title}`);
    });
    console.log('');

    // Test CFO waterfall
    console.log('🎯 TESTING CFO WATERFALL:');
    console.log('==========================');
    const cfoResult = await coresignal.findExecutiveInPreview(testEmployees, 'CFO');
    
    if (cfoResult) {
        console.log(`\n✅ CFO RESULT: ${cfoResult.name} (${cfoResult.title})`);
        console.log(`   Tier: ${cfoResult.tier} - ${cfoResult.tierName}`);
        console.log(`   Score: ${cfoResult.matchScore}`);
        console.log(`   Reason: ${cfoResult.matchReason}`);
    } else {
        console.log('\n❌ No CFO found');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test CRO waterfall
    console.log('🎯 TESTING CRO WATERFALL:');
    console.log('==========================');
    const croResult = await coresignal.findExecutiveInPreview(testEmployees, 'CRO');
    
    if (croResult) {
        console.log(`\n✅ CRO RESULT: ${croResult.name} (${croResult.title})`);
        console.log(`   Tier: ${croResult.tier} - ${croResult.tierName}`);
        console.log(`   Score: ${croResult.matchScore}`);
        console.log(`   Reason: ${croResult.matchReason}`);
    } else {
        console.log('\n❌ No CRO found');
    }

    console.log('\n🏁 WATERFALL TEST COMPLETE');
}

// Run the test
testWaterfallLogic().catch(console.error);
