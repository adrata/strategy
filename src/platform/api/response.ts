import { NextResponse } from 'next/server';

export function createSuccessResponse(data: any, message?: string, status = 200) {
  return NextResponse.json({
    success: true,
    data,
    message: message || 'Success'
  }, { status });
}

export function createErrorResponse(message: string, status = 400, error?: any) {
  return NextResponse.json({
    success: false,
    message,
    error: error || null
  }, { status });
}
