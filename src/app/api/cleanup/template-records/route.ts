/**
 * 🧹 TEMPLATE RECORDS CLEANUP API
 * 
 * Removes template records with default values like "First Last"
 * that were created due to incomplete form submissions or API calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { workspaceId } = context;
    const body = await request.json();
    const { dryRun = false } = body;

    console.log(`🧹 [TEMPLATE CLEANUP] Starting cleanup for workspace: ${workspaceId}, dryRun: ${dryRun}`);

    const results = {
      people: { found: 0, deleted: 0 },
      companies: { found: 0, deleted: 0 },
      leads: { found: 0, deleted: 0 },
      prospects: { found: 0, deleted: 0 },
      opportunities: { found: 0, deleted: 0 }
    };

    // Clean up People table
    const peopleTemplateRecords = await prisma.people.findMany({
      where: {
        workspaceId,
        OR: [
          { firstName: 'First' },
          { lastName: 'Last' },
          { fullName: 'First Last' },
          { firstName: 'Unknown' },
          { lastName: 'Unknown' },
          { fullName: 'Unknown Unknown' }
        ]
      }
    });

    results.people.found = peopleTemplateRecords.length;
    console.log(`🧹 [TEMPLATE CLEANUP] Found ${peopleTemplateRecords.length} template people records`);

    if (!dryRun && peopleTemplateRecords.length > 0) {
      const deletedPeople = await prisma.people.deleteMany({
        where: {
          workspaceId,
          OR: [
            { firstName: 'First' },
            { lastName: 'Last' },
            { fullName: 'First Last' },
            { firstName: 'Unknown' },
            { lastName: 'Unknown' },
            { fullName: 'Unknown Unknown' }
          ]
        }
      });
      results.people.deleted = deletedPeople.count;
      console.log(`🧹 [TEMPLATE CLEANUP] Deleted ${deletedPeople.count} template people records`);
    }

    // Clean up Companies table
    const companiesTemplateRecords = await prisma.companies.findMany({
      where: {
        workspaceId,
        OR: [
          { name: 'First Last' },
          { name: 'Unknown' },
          { name: 'Template Company' },
          { name: 'Test Company' }
        ]
      }
    });

    results.companies.found = companiesTemplateRecords.length;
    console.log(`🧹 [TEMPLATE CLEANUP] Found ${companiesTemplateRecords.length} template company records`);

    if (!dryRun && companiesTemplateRecords.length > 0) {
      const deletedCompanies = await prisma.companies.deleteMany({
        where: {
          workspaceId,
          OR: [
            { name: 'First Last' },
            { name: 'Unknown' },
            { name: 'Template Company' },
            { name: 'Test Company' }
          ]
        }
      });
      results.companies.deleted = deletedCompanies.count;
      console.log(`🧹 [TEMPLATE CLEANUP] Deleted ${deletedCompanies.count} template company records`);
    }

    // Clean up Leads table (if it exists)
    try {
      const leadsTemplateRecords = await prisma.leads.findMany({
        where: {
          workspaceId,
          OR: [
            { firstName: 'First' },
            { lastName: 'Last' },
            { fullName: 'First Last' }
          ]
        }
      });

      results.leads.found = leadsTemplateRecords.length;
      console.log(`🧹 [TEMPLATE CLEANUP] Found ${leadsTemplateRecords.length} template lead records`);

      if (!dryRun && leadsTemplateRecords.length > 0) {
        const deletedLeads = await prisma.leads.deleteMany({
          where: {
            workspaceId,
            OR: [
              { firstName: 'First' },
              { lastName: 'Last' },
              { fullName: 'First Last' }
            ]
          }
        });
        results.leads.deleted = deletedLeads.count;
        console.log(`🧹 [TEMPLATE CLEANUP] Deleted ${deletedLeads.count} template lead records`);
      }
    } catch (error) {
      console.log(`🧹 [TEMPLATE CLEANUP] Leads table not found or accessible: ${error}`);
    }

    // Clean up Prospects table (if it exists)
    try {
      const prospectsTemplateRecords = await prisma.prospects.findMany({
        where: {
          workspaceId,
          OR: [
            { firstName: 'First' },
            { lastName: 'Last' },
            { fullName: 'First Last' }
          ]
        }
      });

      results.prospects.found = prospectsTemplateRecords.length;
      console.log(`🧹 [TEMPLATE CLEANUP] Found ${prospectsTemplateRecords.length} template prospect records`);

      if (!dryRun && prospectsTemplateRecords.length > 0) {
        const deletedProspects = await prisma.prospects.deleteMany({
          where: {
            workspaceId,
            OR: [
              { firstName: 'First' },
              { lastName: 'Last' },
              { fullName: 'First Last' }
            ]
          }
        });
        results.prospects.deleted = deletedProspects.count;
        console.log(`🧹 [TEMPLATE CLEANUP] Deleted ${deletedProspects.count} template prospect records`);
      }
    } catch (error) {
      console.log(`🧹 [TEMPLATE CLEANUP] Prospects table not found or accessible: ${error}`);
    }

    const totalFound = Object.values(results).reduce((sum, result) => sum + result.found, 0);
    const totalDeleted = Object.values(results).reduce((sum, result) => sum + result.deleted, 0);

    console.log(`🧹 [TEMPLATE CLEANUP] Cleanup completed. Found: ${totalFound}, Deleted: ${totalDeleted}`);

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          totalFound,
          totalDeleted,
          dryRun
        },
        message: dryRun 
          ? `Found ${totalFound} template records (dry run)` 
          : `Cleaned up ${totalDeleted} template records`
      }
    });

  } catch (error) {
    console.error('❌ [TEMPLATE CLEANUP] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { workspaceId } = context;

    console.log(`🧹 [TEMPLATE CLEANUP] Getting template record counts for workspace: ${workspaceId}`);

    const counts = {
      people: 0,
      companies: 0,
      leads: 0,
      prospects: 0
    };

    // Count People template records
    counts.people = await prisma.people.count({
      where: {
        workspaceId,
        OR: [
          { firstName: 'First' },
          { lastName: 'Last' },
          { fullName: 'First Last' },
          { firstName: 'Unknown' },
          { lastName: 'Unknown' },
          { fullName: 'Unknown Unknown' }
        ]
      }
    });

    // Count Companies template records
    counts.companies = await prisma.companies.count({
      where: {
        workspaceId,
        OR: [
          { name: 'First Last' },
          { name: 'Unknown' },
          { name: 'Template Company' },
          { name: 'Test Company' }
        ]
      }
    });

    // Count Leads template records (if table exists)
    try {
      counts.leads = await prisma.leads.count({
        where: {
          workspaceId,
          OR: [
            { firstName: 'First' },
            { lastName: 'Last' },
            { fullName: 'First Last' }
          ]
        }
      });
    } catch (error) {
      console.log(`🧹 [TEMPLATE CLEANUP] Leads table not found: ${error}`);
    }

    // Count Prospects template records (if table exists)
    try {
      counts.prospects = await prisma.prospects.count({
        where: {
          workspaceId,
          OR: [
            { firstName: 'First' },
            { lastName: 'Last' },
            { fullName: 'First Last' }
          ]
        }
      });
    } catch (error) {
      console.log(`🧹 [TEMPLATE CLEANUP] Prospects table not found: ${error}`);
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      data: {
        counts,
        total,
        message: `Found ${total} template records in workspace`
      }
    });

  } catch (error) {
    console.error('❌ [TEMPLATE CLEANUP] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
