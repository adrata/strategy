import { prisma } from '@/platform/database/prisma-client';

/**
 * OpportunityStatusService
 * 
 * Handles status management for companies and people when opportunities are created or deleted.
 * - When an opportunity is created: Sets company and people to OPPORTUNITY status
 * - When an opportunity is deleted: Reverts company and people to PROSPECT if no other opportunities exist
 */
export class OpportunityStatusService {
  /**
   * Revert company and people to PROSPECT status when an opportunity is deleted
   * Only reverts if the company has no other active opportunities
   * 
   * @param opportunityId - The ID of the opportunity being deleted
   * @param workspaceId - The workspace ID
   * @returns Object with counts of updated records
   */
  static async revertCompanyAndPeopleToProspect(
    opportunityId: string,
    workspaceId: string
  ): Promise<{ companyUpdated: boolean; peopleUpdated: number }> {
    try {
      // Get the opportunity to find the company
      const opportunity = await prisma.opportunities.findFirst({
        where: {
          id: opportunityId,
          workspaceId,
          deletedAt: null
        },
        select: {
          companyId: true
        }
      });

      if (!opportunity) {
        console.log(`⚠️ [OPPORTUNITY STATUS] Opportunity ${opportunityId} not found`);
        return { companyUpdated: false, peopleUpdated: 0 };
      }

      // Check if company has other active opportunities
      const otherOpportunities = await prisma.opportunities.findFirst({
        where: {
          companyId: opportunity.companyId,
          workspaceId,
          deletedAt: null,
          id: { not: opportunityId }
        }
      });

      let companyUpdated = false;
      let peopleUpdated = 0;

      // Only revert if no other opportunities exist
      if (!otherOpportunities) {
        // Update company status to PROSPECT
        const companyUpdate = await prisma.companies.update({
          where: { id: opportunity.companyId },
          data: { status: 'PROSPECT' }
        });

        if (companyUpdate) {
          companyUpdated = true;
          console.log(`✅ [OPPORTUNITY STATUS] Reverted company ${opportunity.companyId} to PROSPECT`);
        }

        // Update all people at this company to PROSPECT (if they were OPPORTUNITY)
        const peopleUpdate = await prisma.people.updateMany({
          where: {
            companyId: opportunity.companyId,
            workspaceId,
            deletedAt: null,
            status: 'OPPORTUNITY'
          },
          data: {
            status: 'PROSPECT',
            statusUpdateDate: new Date()
          }
        });

        peopleUpdated = peopleUpdate.count;
        if (peopleUpdated > 0) {
          console.log(`✅ [OPPORTUNITY STATUS] Reverted ${peopleUpdated} people to PROSPECT`);
        }
      } else {
        console.log(`ℹ️ [OPPORTUNITY STATUS] Company ${opportunity.companyId} has other opportunities, keeping OPPORTUNITY status`);
      }

      return { companyUpdated, peopleUpdated };
    } catch (error) {
      console.error(`❌ [OPPORTUNITY STATUS] Error reverting status for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  /**
   * Set company and people to OPPORTUNITY status when an opportunity is created
   * 
   * @param companyId - The ID of the company
   * @param workspaceId - The workspace ID
   * @returns Object with counts of updated records
   */
  static async setCompanyAndPeopleToOpportunity(
    companyId: string,
    workspaceId: string
  ): Promise<{ companyUpdated: boolean; peopleUpdated: number }> {
    try {
      // Check if company is already OPPORTUNITY
      const company = await prisma.companies.findFirst({
        where: {
          id: companyId,
          workspaceId,
          deletedAt: null
        },
        select: {
          status: true
        }
      });

      let companyUpdated = false;
      let peopleUpdated = 0;

      // Update company status to OPPORTUNITY if not already
      if (company && company.status !== 'OPPORTUNITY') {
        await prisma.companies.update({
          where: { id: companyId },
          data: { status: 'OPPORTUNITY' }
        });
        companyUpdated = true;
        console.log(`✅ [OPPORTUNITY STATUS] Updated company ${companyId} to OPPORTUNITY`);
      }

      // Update all people at this company to OPPORTUNITY (if they're not CLIENT or higher)
      const peopleUpdate = await prisma.people.updateMany({
        where: {
          companyId,
          workspaceId,
          deletedAt: null,
          status: { not: 'CLIENT' } // Don't downgrade clients
        },
        data: {
          status: 'OPPORTUNITY',
          statusUpdateDate: new Date()
        }
      });

      peopleUpdated = peopleUpdate.count;
      if (peopleUpdated > 0) {
        console.log(`✅ [OPPORTUNITY STATUS] Updated ${peopleUpdated} people to OPPORTUNITY`);
      }

      return { companyUpdated, peopleUpdated };
    } catch (error) {
      console.error(`❌ [OPPORTUNITY STATUS] Error setting status for company ${companyId}:`, error);
      throw error;
    }
  }
}

