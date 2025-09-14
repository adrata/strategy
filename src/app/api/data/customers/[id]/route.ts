import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';

interface RouteParams {
  params: { id: string };
}

// GET: Retrieve specific client
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const clientId = params['id'];
    
    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    console.log(`👥 [CLIENT API] Getting client: ${clientId}`);

    await prisma.$connect();

    const client = await prisma.customers.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Transform to match expected structure
    const transformedClient = {
      id: client.id,
      name: `Client ${client.id}`,
      company: client.companyId,
      companyId: client.companyId,
      clientStatus: client.customerStatus,
      tier: client.tier,
      segment: client.segment,
      healthScore: client.healthScore,
      totalLifetimeValue: client.totalLifetimeValue,
      contractEndDate: client.contractEndDate,
      created_at: client.createdAt.toISOString(),
      updated_at: client.updatedAt.toISOString(),
    };

    console.log(`✅ [CLIENT API] Found client: ${client.id}`);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      client: transformedClient,
    });
  } catch (error) {
    console.error("❌ [CLIENT API] Error getting client:", error);
    await prisma.$disconnect();

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get client",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT: Update client
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const clientId = params['id'];
    const { workspaceId, userId, updateData } = await request.json();

    console.log(`📝 [CLIENT API] Updating client: ${clientId}`);

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 },
      );
    }

    await prisma.$connect();

    // Update client using actual schema fields
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (updateData.status) updateFields['customerStatus'] = updateData.status;
    if (updateData.tier) updateFields['tier'] = updateData.tier;
    if (updateData.segment) updateFields['segment'] = updateData.segment;
    if (updateData.healthScore) updateFields['healthScore'] = updateData.healthScore;
    if (updateData.contractValue) updateFields['totalLifetimeValue'] = updateData.contractValue;
    if (updateData.contractEndDate) updateFields['contractEndDate'] = new Date(updateData.contractEndDate);

    const updatedClient = await prisma.customers.update({
      where: { id: clientId },
      data: updateFields,
    });

    console.log(`✅ [CLIENT API] Client updated: ${updatedClient.id}`);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: "Client updated successfully",
      clientId: updatedClient.id,
    });
  } catch (error) {
    console.error("❌ [CLIENT API] Error updating client:", error);
    await prisma.$disconnect();

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update client",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE: Delete client (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const clientId = params['id'];

    console.log(`🗑️ [CLIENT API] Deleting client: ${clientId}`);

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 },
      );
    }

    await prisma.$connect();

    // Soft delete by setting deletedAt timestamp
    const deletedClient = await prisma.customers.update({
      where: { id: clientId },
      data: { deletedAt: new Date() },
    });

    console.log(`✅ [CLIENT API] Client deleted: ${deletedClient.id}`);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully",
      clientId: deletedClient.id,
    });
  } catch (error) {
    console.error("❌ [CLIENT API] Error deleting client:", error);
    await prisma.$disconnect();

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete client",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
