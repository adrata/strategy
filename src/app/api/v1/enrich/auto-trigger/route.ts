/**
 * Auto-Trigger Enrichment System
 * 
 * Automatically triggers enrichment when:
 * - Person created with email, LinkedIn, or at a company
 * - Company created with website or LinkedIn
 * 
 * Called from POST/PATCH endpoints after record creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/enrich/auto-trigger
 * 
 * Body:
 * {
 *   type: 'person' | 'company',
 *   entityId: string,
 *   trigger: 'create' | 'update',
 *   changes?: string[] // Fields that changed
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, entityId, trigger, changes = [] } = body;

    console.log(`🤖 Auto-trigger enrichment:`, { type, entityId, trigger, changes });

    // Check if enrichment should be triggered
    const shouldEnrich = await shouldTriggerEnrichment(type, entityId, trigger, changes);
    
    if (!shouldEnrich.trigger) {
      return NextResponse.json({
        triggered: false,
        reason: shouldEnrich.reason
      });
    }

    // Queue enrichment job (async, non-blocking)
    queueEnrichmentJob(type, entityId, shouldEnrich.enrichmentType);

    return NextResponse.json({
      triggered: true,
      enrichmentType: shouldEnrich.enrichmentType,
      message: 'Enrichment queued for processing',
      estimatedDuration: shouldEnrich.estimatedDuration
    });

  } catch (error) {
    console.error('❌ Auto-trigger error:', error);
    return NextResponse.json(
      { error: 'Auto-trigger failed' },
      { status: 500 }
    );
  }
}

/**
 * Determine if enrichment should be triggered
 */
async function shouldTriggerEnrichment(
  type: string,
  entityId: string,
  trigger: string,
  changes: string[]
) {
  if (type === 'person') {
    const person = await prisma.people.findUnique({
      where: { id: entityId },
      select: {
        email: true,
        linkedinUrl: true,
        companyId: true,
        emailVerified: true,
        phoneVerified: true,
        lastEnriched: true
      }
    });

    if (!person) {
      return { trigger: false, reason: 'Person not found' };
    }

    // Trigger if:
    // 1. New person with email or LinkedIn
    // 2. Email/LinkedIn added to existing person
    // 3. Not enriched in last 30 days
    
    const hasContact = person.email || person.linkedinUrl || person.companyId;
    const needsVerification = !person.emailVerified || !person.phoneVerified;
    const isStale = !person.lastEnriched || 
      (Date.now() - person.lastEnriched.getTime()) > 30 * 24 * 60 * 60 * 1000; // 30 days
    
    const shouldTrigger = hasContact && (trigger === 'create' || needsVerification || isStale);
    
    if (shouldTrigger) {
      return {
        trigger: true,
        enrichmentType: 'person-verification',
        estimatedDuration: '10-15 seconds',
        reason: trigger === 'create' ? 'New person with contact info' : 'Verification needed'
      };
    }
    
    return { trigger: false, reason: 'No enrichment needed' };
  }

  if (type === 'company') {
    const company = await prisma.companies.findUnique({
      where: { id: entityId },
      select: {
        website: true,
        linkedinUrl: true,
        customFields: true,
        lastEnriched: true
      }
    });

    if (!company) {
      return { trigger: false, reason: 'Company not found' };
    }

    const hasIdentifier = company.website || company.linkedinUrl;
    const isEnriched = company.customFields?.coresignalId;
    const isStale = !company.lastEnriched || 
      (Date.now() - company.lastEnriched.getTime()) > 90 * 24 * 60 * 60 * 1000; // 90 days
    
    const shouldTrigger = hasIdentifier && (!isEnriched || isStale);
    
    if (shouldTrigger) {
      return {
        trigger: true,
        enrichmentType: 'company-intelligence',
        estimatedDuration: '30-45 seconds',
        reason: trigger === 'create' ? 'New company with identifier' : 'Intelligence update needed'
      };
    }
    
    return { trigger: false, reason: 'No enrichment needed' };
  }

  return { trigger: false, reason: 'Unknown type' };
}

/**
 * Queue enrichment job for background processing
 */
function queueEnrichmentJob(type: string, entityId: string, enrichmentType: string) {
  // In production, this would queue to a job system (BullMQ, etc.)
  // For now, log that job was queued
  console.log(`📋 Queued ${enrichmentType} for ${type}:${entityId}`);
  
  // Could trigger serverless function or background worker here
  // Example: await fetch('/api/workers/enrich', { method: 'POST', body: JSON.stringify({ type, entityId }) });
}

/**
 * GET /api/v1/enrich/capabilities
 * 
 * Returns available enrichment capabilities for AI panel
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      capabilities: {
        person: {
          name: 'Person Enrichment',
          description: 'Verify and enrich contact information for people',
          features: [
            '4-layer email verification',
            '4-source phone verification',
            'LinkedIn profile enrichment',
            'Email discovery if missing'
          ],
          estimatedTime: '10-15 seconds',
          estimatedCost: '$0.03 per person'
        },
        company: {
          name: 'Company Intelligence',
          description: 'Enrich company data and discover key contacts',
          features: [
            'Company profile enrichment',
            'Key contact discovery (5 contacts)',
            'Email/phone verification for contacts',
            'Industry and firmographic data'
          ],
          estimatedTime: '30-45 seconds',
          estimatedCost: '$0.17 per company'
        },
        'buyer-group': {
          name: 'Buyer Group Discovery',
          description: 'Discover and verify complete buyer groups',
          features: [
            'AI-powered buyer group identification',
            'Role assignment and scoring',
            'Email/phone verification for all members',
            'Cohesion and coverage analysis'
          ],
          estimatedTime: '1-2 minutes',
          estimatedCost: '$5-12 per company'
        },
        role: {
          name: 'Role Finder',
          description: 'Find specific roles at companies',
          features: [
            'AI-generated role variations',
            'Hierarchical search (C-level → Director → Manager)',
            'Contact verification for matches',
            'Confidence scoring'
          ],
          estimatedTime: '30-60 seconds',
          estimatedCost: '$0.05 per role search'
        },
        'optimal-buyer-group': {
          name: 'Optimal Buyer Qualification',
          description: 'Find and qualify best buyer companies',
          features: [
            'AI buyer readiness scoring',
            'Firmographic and growth signal analysis',
            'Buyer group quality sampling',
            'Contact verification for top candidates'
          ],
          estimatedTime: '3-5 minutes',
          estimatedCost: '$5-10 per search'
        }
      },
      autoTriggers: {
        person: {
          onCreate: 'If email, LinkedIn, or company present',
          onUpdate: 'If email/LinkedIn added or changed',
          frequency: 'Immediate (queued)'
        },
        company: {
          onCreate: 'If website or LinkedIn URL present',
          onUpdate: 'If website/LinkedIn added',
          frequency: 'Immediate (queued)'
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch capabilities' },
      { status: 500 }
    );
  }
}

