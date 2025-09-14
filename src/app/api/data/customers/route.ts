import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const userId = searchParams.get("userId");

    if (!workspaceId || !userId) {
      return NextResponse.json({ error: "workspaceId and userId are required" }, { status: 400 });
    }

    console.log(`📊 [CUSTOMERS API] Getting customers for workspace: ${workspaceId}, user: ${userId}`);

    // Get customers from database - using customers table
    const customers = await prisma.customers.findMany({
      where: {
        workspaceId: workspaceId // Just filter by workspace to match metrics count
      },
      include: {
        company: true, // Include related company information
      },
      orderBy: {
        customerSince: 'desc'
      }
    });

    console.log(`📊 Found ${customers.length} customer accounts in database`);

    // Transform customers to include company name and proper kanban format
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.company?.name || 'Customer', // Use company name as primary display
      company: customer.company?.name || 'Customer', // Ensure company field exists
      contractValue: customer.totalLifetimeValue, // For kanban display
      assignedTo: customer.company?.assignedUserId,
      owner: 'Just Dano', // For kanban display
      // Include all original customer data without duplication
      customerStatus: customer.customerStatus,
      tier: customer.tier,
      segment: customer.segment,
      totalLifetimeValue: customer.totalLifetimeValue,
      avgDealSize: customer.avgDealSize,
      dealCount: customer.dealCount,
      lastDealValue: customer.lastDealValue,
      priority: customer.priority,
      healthScore: customer.healthScore,
      loyaltyScore: customer.loyaltyScore,
      retentionProbability: customer.retentionProbability,
      customerSince: customer.customerSince,
      lastDealDate: customer.lastDealDate,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }));

    return NextResponse.json({ 
      success: true,
      customers: transformedCustomers,
      count: transformedCustomers.length
    });

  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers', details: error }, 
      { status: 500 }
    );
  }
}

// POST: Create new customer
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId, customerData } = await request.json();

    console.log(
      `📝 [CUSTOMERS API] Adding customer for workspace: ${workspaceId}, user: ${userId}`,
    );

    if (!customerData || !customerData.accountId) {
      return NextResponse.json(
        { success: false, error: "Account ID is required for customer creation" },
        { status: 400 },
      );
    }

    await prisma.$connect();

    // Create customer using actual schema fields
    const newCustomer = await prisma.customers.create({
      data: {
        id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountId: customerData.accountId,
        customerStatus: customerData.status || "active",
        tier: customerData.tier || "standard",
        segment: customerData.segment || "enterprise",
        healthScore: customerData.healthScore || 75,
        loyaltyScore: customerData.loyaltyScore || 50,
        retentionProbability: customerData.retentionProbability || 85,
        totalLifetimeValue: customerData.contractValue || 0,
        avgDealSize: customerData.avgDealSize || 0,
        dealCount: customerData.dealCount || 0,
        customerSince: customerData.contractStartDate ? new Date(customerData.contractStartDate) : new Date(),
        firstPurchaseDate: customerData.contractStartDate ? new Date(customerData.contractStartDate) : new Date(),
        contractEndDate: customerData.contractEndDate ? new Date(customerData.contractEndDate) : null,
        priority: customerData.priority || "medium",
        workspaceId: workspaceId,
        updatedAt: new Date(),
        // notes: clientData.notes || null, // Remove notes field as it doesn't exist in schema
      }
    });

    // Transform to match expected structure
    const transformedCustomer = {
      id: newCustomer.id,
      name: newCustomer.accountId || 'Customer',
      company: newCustomer.accountId || 'Customer',
      accountId: newCustomer.accountId,
      customerStatus: newCustomer.customerStatus,
      tier: newCustomer.tier,
      healthScore: newCustomer.healthScore,
      totalLifetimeValue: newCustomer.totalLifetimeValue,
      contractEndDate: newCustomer.contractEndDate,
      created_at: newCustomer.customerSince.toISOString(),
      updated_at: newCustomer.customerSince.toISOString(),
    };

    console.log(
      `✅ [CUSTOMERS API] Customer created: ${newCustomer.accountId} (ID: ${newCustomer.id})`,
    );

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      customer: transformedCustomer,
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("❌ [CUSTOMERS API] Error creating customer:", error);
    await prisma.$disconnect();

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
} 