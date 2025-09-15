const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  console.log('🔍 CHECKING CURRENT DATABASE SCHEMA');
  console.log('=====================================');
  
  try {
    // Check if customers table exists and what fields it has
    console.log('\n📋 Checking customers table structure...');
    
    // Try to get one customer record to see what fields exist
    const customer = await prisma.customers.findFirst();
    if (customer) {
      console.log('✅ Customers table exists');
      console.log('Fields:', Object.keys(customer));
    } else {
      console.log('❌ No customers found, but table exists');
    }
    
    // Check if we can create a customer with just the required fields
    console.log('\n🧪 Testing customer creation...');
    
    // Get a company to use for testing
    const company = await prisma.companies.findFirst();
    if (!company) {
      console.log('❌ No companies found - cannot test customer creation');
      return;
    }
    
    console.log('Using company:', company.name, 'ID:', company.id);
    
    // Try to create a test customer
    try {
      const testCustomer = await prisma.customers.create({
        data: {
          id: 'test_customer_' + Date.now(),
          workspaceId: company.workspaceId,
          companyId: company.id,
          customerSince: new Date(),
          customerStatus: 'active'
        }
      });
      console.log('✅ Customer creation successful!');
      console.log('Created customer ID:', testCustomer.id);
      
      // Clean up test customer
      await prisma.customers.delete({
        where: { id: testCustomer.id }
      });
      console.log('🧹 Test customer cleaned up');
      
    } catch (error) {
      console.log('❌ Customer creation failed:', error.message);
      if (error.message.includes('accountId')) {
        console.log('🚨 ISSUE: Database still has accountId field!');
        console.log('💡 SOLUTION: Need to run database migration to remove accountId');
      }
    }
    
  } catch (error) {
    console.log('❌ Error checking schema:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
