/**
 * 🏢 SBI SINGLE COMPANY API
 * 
 * Endpoint for managing individual company data
 */

import { NextRequest } from 'next/server';
import { DatabaseService } from '@/platform/services/sbi/database-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    
    if (!companyId) {
      return Response.json({
        success: false,
        error: 'Company ID is required'
      }, { status: 400 });
    }

    const dbService = new DatabaseService();
    const company = await dbService.getCompanyById(companyId);

    if (!company) {
      return Response.json({
        success: false,
        error: 'Company not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('❌ Company GET error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    const body = await request.json();

    if (!companyId) {
      return Response.json({
        success: false,
        error: 'Company ID is required'
      }, { status: 400 });
    }

    const dbService = new DatabaseService();
    
    // Update company data
    const updatedCompany = await dbService.updateCompany(companyId, {
      ...body,
      lastVerified: new Date()
    });

    return Response.json({
      success: true,
      data: updatedCompany,
      message: 'Company updated successfully'
    });

  } catch (error) {
    console.error('❌ Company PUT error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;

    if (!companyId) {
      return Response.json({
        success: false,
        error: 'Company ID is required'
      }, { status: 400 });
    }

    const dbService = new DatabaseService();
    await dbService.deleteCompany(companyId);

    return Response.json({
      success: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('❌ Company DELETE error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
