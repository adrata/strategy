'use server';

import { prisma } from '@/platform/database/prisma-client';

export async function getSellerCompanies(workspaceId: string, sellerAssignedUserId: string, sellerId: string) {
  try {
    console.log('🔍 [SERVER ACTION] Getting companies for seller:', { workspaceId, sellerAssignedUserId, sellerId });
    
    // Get all companies assigned to the seller's assignedUserId
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId,
        assignedUserId: sellerAssignedUserId,
        deletedAt: null
      },
      orderBy: [
        { rank: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: 5000,
      select: {
        id: true,
        name: true,
        industry: true,
        size: true,
        revenue: true,
        website: true,
        city: true,
        state: true,
        country: true,
        description: true,
        rank: true,
        assignedUserId: true,
        updatedAt: true
      }
    });

    console.log('🔍 [SERVER ACTION] Found companies:', allCompanies.length);

    // Apply the slicing logic to get the seller's 100 companies
    const sellerIndex = parseInt(sellerId.split('-').pop() || '1');
    const companiesPerSeller = 100;
    const startIndex = (sellerIndex - 1) * companiesPerSeller;
    const endIndex = startIndex + companiesPerSeller;

    console.log(`🔍 [SERVER ACTION] Seller ${sellerId} (index ${sellerIndex}): slicing companies ${startIndex}-${endIndex} of ${allCompanies.length} total`);

    const sellerCompanies = allCompanies.slice(startIndex, endIndex);

    console.log('🔍 [SERVER ACTION] Seller companies (slice):', sellerCompanies.length);

    return {
      success: true,
      data: sellerCompanies,
      total: allCompanies.length,
      slice: {
        startIndex,
        endIndex,
        sellerIndex,
        companiesPerSeller
      }
    };
  } catch (error) {
    console.error('❌ [SERVER ACTION] Error getting seller companies:', error);
    return {
      success: false,
      error: 'Failed to get seller companies',
      data: []
    };
  }
}
