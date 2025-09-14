import { NextRequest, NextResponse } from 'next/server';
import { UniversalDocumentParser } from '@/platform/services/universal-document-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsStr = formData.get('options') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    const options = optionsStr ? JSON.parse(optionsStr) : {};
    
    // Parse the PDF using the server-side method
    const result = await UniversalDocumentParser.parseDocument(file, options);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('PDF parsing API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
