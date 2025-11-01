import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, language, projectId } = body;

    if (!code || !language) {
      return NextResponse.json({ error: 'Code and language are required' }, { status: 400 });
    }

    // For now, simulate code execution
    // TODO: Integrate with actual Daytona service
    const executionResult = await simulateCodeExecution(code, language);

    return NextResponse.json(executionResult);
  } catch (error) {
    console.error('Failed to execute code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function simulateCodeExecution(code: string, language: string) {
  // Simulate execution delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simple simulation based on language
  let output = '';
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      if (code.includes('console.log')) {
        output = 'Hello from JavaScript!\n';
      } else {
        output = 'Code executed successfully (JavaScript)\n';
      }
      break;
    case 'python':
      if (code.includes('print')) {
        output = 'Hello from Python!\n';
      } else {
        output = 'Code executed successfully (Python)\n';
      }
      break;
    case 'java':
      output = 'Code executed successfully (Java)\n';
      break;
    default:
      output = `Code executed successfully (${language})\n`;
  }

  return {
    id: Date.now().toString(),
    status: 'completed',
    output,
    exitCode: 0,
    duration: 1000,
    createdAt: new Date().toISOString(),
  };
}
