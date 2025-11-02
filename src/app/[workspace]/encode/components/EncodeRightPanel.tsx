"use client";

import React, { useState, useCallback } from "react";
import { useEncode } from "../layout";
import { DaytonaService } from "../services/DaytonaService";
import { 
  PlayIcon,
  StopIcon,
  DocumentPlusIcon,
  CodeBracketIcon,
  LightBulbIcon,
  BugAntIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasCode?: boolean;
  code?: string;
  language?: string;
}

export function EncodeRightPanel() {
  const {
    activeFile,
    editorContent,
    language,
    createFile,
    currentProject,
  } = useEncode();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. I can help you with code generation, debugging, optimization, and more. Try these commands:\n\n• `/explain` - Explain selected code\n• `/review` - Code review and suggestions\n• `/fix` - Debug and fix errors\n• `/generate` - Generate code from description\n• `/test` - Generate test cases\n• `/optimize` - Performance optimization',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState('');

  const daytonaService = DaytonaService.getInstance();

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Process command-based requests
      const response = await processCommand(inputValue);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        hasCode: response.hasCode,
        code: response.code,
        language: response.language,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, activeFile, editorContent, language]);

  const processCommand = async (input: string) => {
    const command = input.toLowerCase().trim();
    
    if (command.startsWith('/explain')) {
      return await handleExplainCommand();
    } else if (command.startsWith('/review')) {
      return await handleReviewCommand();
    } else if (command.startsWith('/fix')) {
      return await handleFixCommand();
    } else if (command.startsWith('/generate')) {
      return await handleGenerateCommand(input);
    } else if (command.startsWith('/test')) {
      return await handleTestCommand();
    } else if (command.startsWith('/optimize')) {
      return await handleOptimizeCommand();
    } else {
      return await handleGeneralQuery(input);
    }
  };

  const handleExplainCommand = async () => {
    if (!activeFile || !editorContent) {
      return {
        content: 'Please select a file with code to explain.',
        hasCode: false,
      };
    }

    // Simulate AI explanation
    return {
      content: `Here's an explanation of the selected code:\n\nThis code appears to be written in ${language}. The main functionality includes...`,
      hasCode: false,
    };
  };

  const handleReviewCommand = async () => {
    if (!activeFile || !editorContent) {
      return {
        content: 'Please select a file with code to review.',
        hasCode: false,
      };
    }

    // Simulate code review
    return {
      content: `Code Review for ${activeFile.name}:\n\n✅ Good practices:\n• Code structure is clear\n• Variable names are descriptive\n\n⚠️ Suggestions:\n• Consider adding error handling\n• Add comments for complex logic\n• Consider breaking down large functions`,
      hasCode: false,
    };
  };

  const handleFixCommand = async () => {
    if (!activeFile || !editorContent) {
      return {
        content: 'Please select a file with code that needs fixing.',
        hasCode: false,
      };
    }

    // Simulate code fixing
    const fixedCode = editorContent + '\n// TODO: Add proper error handling';
    
    return {
      content: 'I\'ve identified some issues and provided fixes:',
      hasCode: true,
      code: fixedCode,
      language: language,
    };
  };

  const handleGenerateCommand = async (input: string) => {
    const description = input.replace('/generate', '').trim();
    
    if (!description) {
      return {
        content: 'Please provide a description of the code you want me to generate.',
        hasCode: false,
      };
    }

    // Simulate code generation
    const generatedCode = `// Generated code for: ${description}\nfunction generatedFunction() {\n  // Implementation here\n  console.log('Hello from generated code!');\n}\n\ngeneratedFunction();`;
    
    return {
      content: `Here's the generated code for "${description}":`,
      hasCode: true,
      code: generatedCode,
      language: language,
    };
  };

  const handleTestCommand = async () => {
    if (!activeFile || !editorContent) {
      return {
        content: 'Please select a file with code to generate tests for.',
        hasCode: false,
      };
    }

    // Simulate test generation
    const testCode = `// Tests for ${activeFile.name}\ndescribe('${activeFile.name}', () => {\n  it('should work correctly', () => {\n    // Test implementation\n    expect(true).toBe(true);\n  });\n});`;
    
    return {
      content: `Here are some test cases for ${activeFile.name}:`,
      hasCode: true,
      code: testCode,
      language: language,
    };
  };

  const handleOptimizeCommand = async () => {
    if (!activeFile || !editorContent) {
      return {
        content: 'Please select a file with code to optimize.',
        hasCode: false,
      };
    }

    // Simulate optimization
    const optimizedCode = editorContent + '\n// Optimized version with better performance';
    
    return {
      content: 'Here\'s an optimized version of your code:',
      hasCode: true,
      code: optimizedCode,
      language: language,
    };
  };

  const handleGeneralQuery = async (input: string) => {
    // Simulate general AI response
    return {
      content: `I understand you're asking about: "${input}". As your coding assistant, I can help with code generation, debugging, optimization, and more. Try using specific commands like /generate, /fix, or /review for better results.`,
      hasCode: false,
    };
  };

  const handleExecuteCode = useCallback(async (code: string, codeLanguage: string) => {
    if (!daytonaService.isLanguageSupported(codeLanguage)) {
      setExecutionOutput('Error: Language not supported for execution');
      return;
    }

    setIsExecuting(true);
    setExecutionOutput('Executing code...\n');

    try {
      await daytonaService.executeCodeStream(
        { code, language: codeLanguage },
        (chunk) => {
          setExecutionOutput(prev => prev + chunk);
        },
        (error) => {
          setExecutionOutput(prev => prev + `Error: ${error}\n`);
        },
        (result) => {
          setExecutionOutput(prev => prev + `\nExecution completed with status: ${result.status}\n`);
          setIsExecuting(false);
        }
      );
    } catch (error) {
      setExecutionOutput(prev => prev + `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      setIsExecuting(false);
    }
  }, [daytonaService]);

  const handleApplyCode = useCallback(async (code: string, fileName?: string) => {
    if (!currentProject) {
      alert('No project selected');
      return;
    }

    try {
      const finalFileName = fileName || `generated_${Date.now()}.${language}`;
      await createFile('/', finalFileName, code);
      alert(`Code applied to new file: ${finalFileName}`);
    } catch (error) {
      alert('Failed to create file');
      console.error('Failed to apply code:', error);
    }
  }, [currentProject, createFile, language]);

  const getCommandIcon = (command: string) => {
    switch (command) {
      case '/explain':
        return <LightBulbIcon className="w-4 h-4" />;
      case '/review':
        return <ChartBarIcon className="w-4 h-4" />;
      case '/fix':
        return <BugAntIcon className="w-4 h-4" />;
      case '/generate':
        return <CodeBracketIcon className="w-4 h-4" />;
      case '/test':
        return <BeakerIcon className="w-4 h-4" />;
      case '/optimize':
        return <WrenchScrewdriverIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-panel-background">
        <h3 className="text-sm font-semibold text-foreground">AI Coding Assistant</h3>
        <p className="text-xs text-muted mt-1">
          Powered by Daytona.ai for secure code execution
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-panel-background text-foreground border border-border'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              
              {message.hasCode && message.code && (
                <div className="mt-3">
                  <div className="bg-background border border-border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted">
                        {message.language} Code
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleExecuteCode(message.code!, message.language!)}
                          disabled={isExecuting}
                          className="p-1 hover:bg-hover rounded transition-colors"
                          title="Run in Sandbox"
                        >
                          {isExecuting ? (
                            <StopIcon className="w-3 h-3 text-red-500" />
                          ) : (
                            <PlayIcon className="w-3 h-3 text-green-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleApplyCode(message.code!)}
                          className="p-1 hover:bg-hover rounded transition-colors"
                          title="Apply to File"
                        >
                          <DocumentPlusIcon className="w-3 h-3 text-blue-500" />
                        </button>
                      </div>
                    </div>
                    <pre className="text-xs font-mono text-foreground overflow-x-auto">
                      <code>{message.code}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-panel-background border border-border rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Execution Output */}
      {executionOutput && (
        <div className="border-t border-border bg-panel-background">
          <div className="px-4 py-2 border-b border-border">
            <h4 className="text-xs font-medium text-foreground">Execution Output</h4>
          </div>
          <div className="p-3">
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
              {executionOutput}
            </pre>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything or use commands like /generate, /fix, /review..."
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-gray-400 bg-background text-foreground"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        
        {/* Quick Commands */}
        <div className="mt-2 flex flex-wrap gap-1">
          {['/explain', '/review', '/fix', '/generate', '/test', '/optimize'].map((command) => (
            <button
              key={command}
              onClick={() => setInputValue(command + ' ')}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-hover hover:bg-panel-background rounded transition-colors"
            >
              {getCommandIcon(command)}
              {command}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
