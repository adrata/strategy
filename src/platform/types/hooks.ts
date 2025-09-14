/**
 * Hook-specific type definitions
 * Separated from main types to prevent circular dependencies
 */

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTypewriter?: boolean;
}

export interface ChatSessions {
  [key: string]: ChatMessage[];
}

export interface CRMRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: string;
  lastContact?: Date;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface FormField {
  id: string;
  name: string;
  type: "text" | "email" | "phone" | "select" | "textarea" | "date" | "number";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: {
    pattern?: string;
    message?: string;
  };
}

export interface FormData {
  [key: string]: any;
}

export interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
  lastUpdated: Date;
}
