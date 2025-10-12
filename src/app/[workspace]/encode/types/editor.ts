export interface EditorState {
  content: string;
  language: string;
  cursorPosition: CursorPosition;
  selection: Selection;
  isDirty: boolean;
  lastSaved?: Date;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface Selection {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface EditorSettings {
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  tabSize: number;
  insertSpaces: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
}

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  isDirty: boolean;
  isActive: boolean;
  language: string;
  file: any; // EncodeFile reference
}

export interface MonacoEditorInstance {
  getValue(): string;
  setValue(value: string): void;
  getPosition(): CursorPosition;
  setPosition(position: CursorPosition): void;
  getSelection(): Selection;
  setSelection(selection: Selection): void;
  focus(): void;
  dispose(): void;
  updateOptions(options: any): void;
  addCommand(keybinding: number, handler: () => void): void;
  onDidChangeModelContent(callback: () => void): any;
  onDidChangeCursorPosition(callback: (e: any) => void): any;
  onDidChangeSelection(callback: (e: any) => void): any;
}

export interface CodeExecutionResult {
  id: string;
  status: 'running' | 'completed' | 'error' | 'timeout';
  output: string;
  error?: string;
  exitCode?: number;
  duration?: number;
  createdAt: Date;
}

export interface LanguageConfig {
  id: string;
  name: string;
  extensions: string[];
  monacoLanguage: string;
  runtime?: string;
  executable?: boolean;
}
