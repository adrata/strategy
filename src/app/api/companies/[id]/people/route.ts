import { NextRequest, NextResponse } from 'next/server';
import { authFetch } from '@/platform/api-fetch';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    const body = await request.json();
    
    // Check if we're linking an existing person or creating a new one
    if (body.personId) {
      // Link existing person to company
      return await linkExistingPersonToCompany(companyId, body.personId);
    } else {
      // Create new person and link to company
      return await createNewPersonForCompany(companyId, body);
    }
  } catch (error) {
    console.error('Error in POST /api/companies/[id]/people:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function linkExistingPersonToCompany(companyId: string, personId: string) {
  try {
    // First, get the person to verify they exist
    const personResponse = await authFetch(`/api/v1/people/${personId}`);
    if (!personResponse.success) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }
    
    const person = personResponse.data;
    
    // Update the person with the company information
    const updateResponse = await authFetch(`/api/v1/people/${personId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...person,
        companyId: companyId,
        company: person.company || 'Unknown Company' // Keep existing company name or set default
      })
    });
    
    if (!updateResponse.success) {
      return NextResponse.json(
        { error: updateResponse.error || 'Failed to link person to company' },
        { status: 500 }
      );
    }
    
    const updatedPerson = updateResponse.data;
    
    return NextResponse.json({
      success: true,
      data: updatedPerson,
      message: 'Person successfully linked to company'
    });
    
  } catch (error) {
    console.error('Error linking person to company:', error);
    return NextResponse.json(
      { error: 'Failed to link person to company' },
      { status: 500 }
    );
  }
}

async function createNewPersonForCompany(companyId: string, personData: any) {
  try {
    // Get company information to include in person data
    const companyResponse = await authFetch(`/api/v1/companies/${companyId}`);
    let companyName = 'Unknown Company';
    
    if (companyResponse.success) {
      const company = companyResponse.data;
      companyName = company.name || companyName;
    }
    
    // Create the person with company association
    const createPersonData = {
      ...personData,
      companyId: companyId,
      company: companyName,
      status: personData.status || 'LEAD',
      source: personData.source || 'Manual Entry'
    };
    
    const createResponse = await authFetch('/api/v1/people', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPersonData)
    });
    
    if (!createResponse.success) {
      return NextResponse.json(
        { error: createResponse.error || 'Failed to create person' },
        { status: 500 }
      );
    }
    
    const newPerson = createResponse.data;
    
    return NextResponse.json({
      success: true,
      data: newPerson,
      message: 'Person successfully created and linked to company'
    });
    
  } catch (error) {
    console.error('Error creating person for company:', error);
    return NextResponse.json(
      { error: 'Failed to create person' },
      { status: 500 }
    );
  }
}
