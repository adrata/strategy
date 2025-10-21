import { prisma } from '@/platform/database/prisma-client';

export interface AutoPopulationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: string[];
  duration: number;
}

export class AutoStrategyPopulationServicePeople {
  async populateStrategiesForTopPeople(workspaceId: string, limit: number = 50): Promise<AutoPopulationResult> {
    const startTime = Date.now();
    const result: AutoPopulationResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log(`🚀 [STRATEGY POPULATION] Starting strategy population for top ${limit} people in workspace ${workspaceId}`);

      // Query top people without strategy data, ordered by importance/ranking
      const peopleWithoutStrategy = await prisma.people.findMany({
        where: {
          workspaceId: workspaceId,
          OR: [
            { customFields: { path: ['strategySituation'], equals: null } },
            { customFields: { path: ['strategyComplication'], equals: null } },
            { customFields: { path: ['strategyFutureState'], equals: null } },
            { customFields: { path: ['strategySituation'], equals: undefined } },
            { customFields: { path: ['strategyComplication'], equals: undefined } },
            { customFields: { path: ['strategyFutureState'], equals: undefined } }
          ]
        },
        select: {
          id: true,
          fullName: true,
          jobTitle: true,
          companyName: true,
          customFields: true
        },
        orderBy: [
          { ranking: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      result.totalProcessed = peopleWithoutStrategy.length;
      console.log(`📊 [STRATEGY POPULATION] Found ${peopleWithoutStrategy.length} people without strategy data`);

      if (peopleWithoutStrategy.length === 0) {
        result.duration = Date.now() - startTime;
        console.log(`✅ [STRATEGY POPULATION] No people need strategy generation`);
        return result;
      }

      // Process people in batches with rate limiting
      const batchSize = 5;
      const delayBetweenBatches = 1000; // 1 second

      for (let i = 0; i < peopleWithoutStrategy.length; i += batchSize) {
        const batch = peopleWithoutStrategy.slice(i, i + batchSize);
        
        console.log(`🔄 [STRATEGY POPULATION] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(peopleWithoutStrategy.length / batchSize)}`);

        // Process batch concurrently
        const batchPromises = batch.map(person => this.generateStrategyForPerson(person.id, workspaceId));
        const batchResults = await Promise.allSettled(batchPromises);

        // Count results
        batchResults.forEach((promiseResult, index) => {
          if (promiseResult.status === 'fulfilled') {
            result.successful++;
            console.log(`✅ [STRATEGY POPULATION] Generated strategy for ${batch[index].fullName}`);
          } else {
            result.failed++;
            const error = promiseResult.reason?.message || 'Unknown error';
            result.errors.push(`Failed for ${batch[index].fullName}: ${error}`);
            console.error(`❌ [STRATEGY POPULATION] Failed for ${batch[index].fullName}:`, error);
          }
        });

        // Delay between batches (except for the last batch)
        if (i + batchSize < peopleWithoutStrategy.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      result.duration = Date.now() - startTime;
      
      console.log(`🎉 [STRATEGY POPULATION] Completed! Processed: ${result.totalProcessed}, Successful: ${result.successful}, Failed: ${result.failed}, Duration: ${result.duration}ms`);

      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.errors.push(`Service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('💥 [STRATEGY POPULATION] Service error:', error);
      return result;
    }
  }

  private async generateStrategyForPerson(personId: string, workspaceId: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/strategy/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personId: personId,
          recordType: 'person'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Strategy generation failed');
      }

    } catch (error) {
      throw new Error(`Strategy generation failed for person ${personId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async populateStrategiesForAllPeople(workspaceId: string): Promise<AutoPopulationResult> {
    console.log(`🚀 [STRATEGY POPULATION] Starting strategy population for ALL people in workspace ${workspaceId}`);
    return this.populateStrategiesForTopPeople(workspaceId, 1000); // Large limit for "all"
  }

  async getPopulationStats(workspaceId: string): Promise<{
    totalPeople: number;
    peopleWithStrategy: number;
    peopleWithoutStrategy: number;
    percentageComplete: number;
  }> {
    const totalPeople = await prisma.people.count({
      where: { workspaceId }
    });

    const peopleWithStrategy = await prisma.people.count({
      where: {
        workspaceId,
        AND: [
          { customFields: { path: ['strategySituation'], not: null } },
          { customFields: { path: ['strategyComplication'], not: null } },
          { customFields: { path: ['strategyFutureState'], not: null } }
        ]
      }
    });

    const peopleWithoutStrategy = totalPeople - peopleWithStrategy;
    const percentageComplete = totalPeople > 0 ? Math.round((peopleWithStrategy / totalPeople) * 100) : 0;

    return {
      totalPeople,
      peopleWithStrategy,
      peopleWithoutStrategy,
      percentageComplete
    };
  }
}

// Export singleton instance
export const autoStrategyPopulationServicePeople = new AutoStrategyPopulationServicePeople();
