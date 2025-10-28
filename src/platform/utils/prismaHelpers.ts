/**
 * 🛡️ PRISMA SOFT DELETE HELPERS
 * 
 * Utility functions to ensure consistent soft delete filtering across the application
 * These helpers prevent accidental exposure of soft-deleted records
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Safe Prisma operations that automatically filter soft-deleted records
 * Use these instead of direct prisma calls to ensure consistency
 */
export const safePrisma = {
  // LEADS (now using people table with status filter)
  lead: {
    findMany: (args: any = {}) => prisma.people.findMany({
      ...args,
      where: {
        ...args.where,
        status: 'LEAD',
        deletedAt: null
      }
    }),
    
    findFirst: (args: any = {}) => prisma.people.findFirst({
      ...args,
      where: {
        ...args.where,
        status: 'LEAD',
        deletedAt: null
      }
    }),
    
    findUnique: (args: any = {}) => prisma.people.findFirst({
      ...args,
      where: {
        ...args.where,
        status: 'LEAD',
        deletedAt: null
      }
    }),
    
    count: (args: any = {}) => prisma.people.count({
      ...args,
      where: {
        ...args.where,
        status: 'LEAD',
        deletedAt: null
      }
    })
  },

  // PROSPECTS
  prospect: {
    findMany: (args: any = {}) => prisma.prospect.findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    findFirst: (args: any = {}) => prisma.prospect.findFirst({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    findUnique: (args: any = {}) => prisma.prospect.findFirst({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    count: (args: any = {}) => prisma.prospect.count({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    })
  },

  // CONTACTS
  contact: {
    findMany: (args: any = {}) => prisma.contacts.findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    findFirst: (args: any = {}) => prisma.contacts.findFirst({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    findUnique: (args: any = {}) => prisma.contacts.findFirst({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    count: (args: any = {}) => prisma.contacts.count({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    })
  },

  // OPPORTUNITIES
  opportunity: {
    findMany: (args: any = {}) => prisma.opportunities.findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    findFirst: (args: any = {}) => prisma.opportunities.findFirst({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    findUnique: (args: any = {}) => prisma.opportunities.findFirst({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    count: (args: any = {}) => prisma.opportunities.count({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    })
  },

  // ACCOUNTS
  account: {
    findMany: (args: any = {}) => prisma.accounts.findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    findFirst: (args: any = {}) => prisma.accounts.findFirst({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    findUnique: (args: any = {}) => prisma.accounts.findFirst({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    }),
    
    count: (args: any = {}) => prisma.accounts.count({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    })
  }
};

/**
 * Utility to add soft delete filtering to any where clause
 */
export function withSoftDeleteFilter(where: any = {}, includeDeleted = false): any {
  if (includeDeleted) {
    return where;
  }
  
  return {
    ...where,
    deletedAt: null
  };
}

/**
 * Utility to get only soft-deleted records (for recovery/admin purposes)
 */
export const deletedRecords = {
  lead: {
    findMany: (args: any = {}) => prisma.people.findMany({
      ...args,
      where: {
        ...args.where,
        status: 'LEAD',
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: 'desc' }
    }),
    
    count: (args: any = {}) => prisma.people.count({
      ...args,
      where: {
        ...args.where,
        status: 'LEAD',
        deletedAt: { not: null }
      }
    })
  },
  
  prospect: {
    findMany: (args: any = {}) => prisma.prospect.findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: 'desc' }
    }),
    
    count: (args: any = {}) => prisma.prospect.count({
      ...args,
      where: {
        ...args.where,
        deletedAt: { not: null }
      }
    })
  },
  
  contact: {
    findMany: (args: any = {}) => prisma.contacts.findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: 'desc' }
    }),
    
    count: (args: any = {}) => prisma.contacts.count({
      ...args,
      where: {
        ...args.where,
        deletedAt: { not: null }
      }
    })
  },
  
  opportunity: {
    findMany: (args: any = {}) => prisma.opportunities.findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: 'desc' }
    }),
    
    count: (args: any = {}) => prisma.opportunities.count({
      ...args,
      where: {
        ...args.where,
        deletedAt: { not: null }
      }
    })
  },
  
  account: {
    findMany: (args: any = {}) => prisma.accounts.findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: 'desc' }
    }),
    
    count: (args: any = {}) => prisma.accounts.count({
      ...args,
      where: {
        ...args.where,
        deletedAt: { not: null }
      }
    })
  }
};

/**
 * Migration helper: Check if a service needs soft delete filtering
 * Returns true if any of the provided queries would return different results with soft delete filtering
 */
export async function auditSoftDeleteCompliance(queries: Array<{ model: string; where?: any }>): Promise<{
  needsUpdate: boolean;
  affectedQueries: Array<{ model: string; activeCount: number; deletedCount: number; totalCount: number }>;
}> {
  const affectedQueries = [];
  let needsUpdate = false;
  
  for (const query of queries) {
    const model = query.model.toLowerCase();
    const where = query.where || {};
    
    let activeCount = 0;
    let deletedCount = 0;
    let totalCount = 0;
    
    try {
      switch (model) {
        case 'lead':
          activeCount = await prisma.people.count({ where: { ...where, status: 'LEAD', deletedAt: null } });
          deletedCount = await prisma.people.count({ where: { ...where, status: 'LEAD', deletedAt: { not: null } } });
          totalCount = await prisma.people.count({ where: { ...where, status: 'LEAD' } });
          break;
        case 'prospect':
          activeCount = await prisma.prospect.count({ where: { ...where, deletedAt: null } });
          deletedCount = await prisma.prospect.count({ where: { ...where, deletedAt: { not: null } } });
          totalCount = await prisma.prospect.count({ where });
          break;
        case 'contact':
          activeCount = await prisma.contacts.count({ where: { ...where, deletedAt: null } });
          deletedCount = await prisma.contacts.count({ where: { ...where, deletedAt: { not: null } } });
          totalCount = await prisma.contacts.count({ where });
          break;
        case 'opportunity':
          activeCount = await prisma.opportunities.count({ where: { ...where, deletedAt: null } });
          deletedCount = await prisma.opportunities.count({ where: { ...where, deletedAt: { not: null } } });
          totalCount = await prisma.opportunities.count({ where });
          break;
        case 'account':
          activeCount = await prisma.accounts.count({ where: { ...where, deletedAt: null } });
          deletedCount = await prisma.accounts.count({ where: { ...where, deletedAt: { not: null } } });
          totalCount = await prisma.accounts.count({ where });
          break;
      }
      
      if (deletedCount > 0) {
        needsUpdate = true;
        affectedQueries.push({
          model: query.model,
          activeCount,
          deletedCount,
          totalCount
        });
      }
    } catch (error) {
      console.error(`Error auditing ${model}:`, error);
    }
  }
  
  return { needsUpdate, affectedQueries };
}
