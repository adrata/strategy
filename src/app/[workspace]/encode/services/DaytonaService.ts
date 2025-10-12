import { CodeExecutionResult } from '../types/editor';

export interface DaytonaExecutionRequest {
  code: string;
  language: string;
  projectId?: string;
  timeout?: number;
  environment?: string;
}

export interface DaytonaSandbox {
  id: string;
  status: 'creating' | 'ready' | 'running' | 'stopped' | 'error';
  environment: string;
  createdAt: Date;
  lastActivity: Date;
}

export class DaytonaService {
  private static instance: DaytonaService;
  private baseUrl: string;
  private apiKey: string;
  
  public static getInstance(): DaytonaService {
    if (!DaytonaService.instance) {
      DaytonaService.instance = new DaytonaService();
    }
    return DaytonaService.instance;
  }

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_DAYTONA_API_URL || 'https://api.daytona.io';
    this.apiKey = process.env.DAYTONA_API_KEY || '';
  }

  // Sandbox management
  async createSandbox(environment: string = 'node'): Promise<DaytonaSandbox> {
    const response = await fetch(`${this.baseUrl}/sandboxes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        environment,
        timeout: 300 // 5 minutes default
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create Daytona sandbox');
    }

    return response.json();
  }

  async getSandbox(sandboxId: string): Promise<DaytonaSandbox> {
    const response = await fetch(`${this.baseUrl}/sandboxes/${sandboxId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sandbox status');
    }

    return response.json();
  }

  async deleteSandbox(sandboxId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sandboxes/${sandboxId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete sandbox');
    }
  }

  // Code execution
  async executeCode(request: DaytonaExecutionRequest): Promise<CodeExecutionResult> {
    const { code, language, timeout = 30000 } = request;
    
    // Create sandbox first
    const sandbox = await this.createSandbox(this.getEnvironmentForLanguage(language));
    
    // Wait for sandbox to be ready
    await this.waitForSandboxReady(sandbox.id);
    
    // Execute code
    const response = await fetch(`${this.baseUrl}/sandboxes/${sandbox.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        code,
        language,
        timeout
      })
    });

    if (!response.ok) {
      throw new Error('Failed to execute code');
    }

    const result = await response.json();
    
    // Clean up sandbox
    await this.deleteSandbox(sandbox.id);
    
    return {
      id: result.id,
      status: result.status,
      output: result.output || '',
      error: result.error,
      exitCode: result.exitCode,
      duration: result.duration,
      createdAt: new Date()
    };
  }

  // Stream execution (for long-running processes)
  async executeCodeStream(
    request: DaytonaExecutionRequest,
    onOutput: (chunk: string) => void,
    onError: (error: string) => void,
    onComplete: (result: CodeExecutionResult) => void
  ): Promise<void> {
    const { code, language, timeout = 30000 } = request;
    
    try {
      // Create sandbox
      const sandbox = await this.createSandbox(this.getEnvironmentForLanguage(language));
      
      // Wait for sandbox to be ready
      await this.waitForSandboxReady(sandbox.id);
      
      // Start execution
      const response = await fetch(`${this.baseUrl}/sandboxes/${sandbox.id}/execute/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          code,
          language,
          timeout
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start code execution');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let output = '';
      let error = '';
      let status: 'running' | 'completed' | 'error' = 'running';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('OUTPUT:')) {
            const outputChunk = line.substring(7);
            output += outputChunk;
            onOutput(outputChunk);
          } else if (line.startsWith('ERROR:')) {
            const errorChunk = line.substring(6);
            error += errorChunk;
            onError(errorChunk);
            status = 'error';
          } else if (line.startsWith('STATUS:')) {
            const statusChunk = line.substring(7);
            if (statusChunk === 'completed' || statusChunk === 'error') {
              status = statusChunk as 'completed' | 'error';
            }
          }
        }
      }

      // Clean up sandbox
      await this.deleteSandbox(sandbox.id);
      
      // Complete execution
      onComplete({
        id: sandbox.id,
        status,
        output,
        error: error || undefined,
        exitCode: status === 'error' ? 1 : 0,
        createdAt: new Date()
      });
      
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unknown error occurred');
      onComplete({
        id: 'error',
        status: 'error',
        output: '',
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        exitCode: 1,
        createdAt: new Date()
      });
    }
  }

  // Utility methods
  private getEnvironmentForLanguage(language: string): string {
    const environmentMap: Record<string, string> = {
      'javascript': 'node',
      'typescript': 'node',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'dotnet',
      'go': 'go',
      'rust': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'shell': 'bash',
      'powershell': 'powershell'
    };

    return environmentMap[language] || 'node';
  }

  private async waitForSandboxReady(sandboxId: string, maxWaitTime: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const sandbox = await this.getSandbox(sandboxId);
      
      if (sandbox.status === 'ready') {
        return;
      }
      
      if (sandbox.status === 'error') {
        throw new Error('Sandbox failed to initialize');
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Sandbox initialization timeout');
  }

  // Language support
  getSupportedLanguages(): string[] {
    return [
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'c',
      'csharp',
      'go',
      'rust',
      'php',
      'ruby',
      'swift',
      'kotlin',
      'shell',
      'powershell'
    ];
  }

  // Check if language is supported
  isLanguageSupported(language: string): boolean {
    return this.getSupportedLanguages().includes(language);
  }

  // Get language runtime info
  getLanguageInfo(language: string): { runtime: string; version: string; executable: boolean } {
    const languageInfo: Record<string, { runtime: string; version: string; executable: boolean }> = {
      'javascript': { runtime: 'Node.js', version: '18.x', executable: true },
      'typescript': { runtime: 'Node.js', version: '18.x', executable: true },
      'python': { runtime: 'Python', version: '3.11', executable: true },
      'java': { runtime: 'Java', version: '17', executable: true },
      'cpp': { runtime: 'GCC', version: '11', executable: true },
      'c': { runtime: 'GCC', version: '11', executable: true },
      'csharp': { runtime: '.NET', version: '7.0', executable: true },
      'go': { runtime: 'Go', version: '1.21', executable: true },
      'rust': { runtime: 'Rust', version: '1.75', executable: true },
      'php': { runtime: 'PHP', version: '8.2', executable: true },
      'ruby': { runtime: 'Ruby', version: '3.2', executable: true },
      'swift': { runtime: 'Swift', version: '5.9', executable: true },
      'kotlin': { runtime: 'Kotlin', version: '1.9', executable: true },
      'shell': { runtime: 'Bash', version: '5.1', executable: true },
      'powershell': { runtime: 'PowerShell', version: '7.3', executable: true }
    };

    return languageInfo[language] || { runtime: 'Unknown', version: 'Unknown', executable: false };
  }
}
