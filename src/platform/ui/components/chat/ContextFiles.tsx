"use client";

import React from "react";
import { 
  XMarkIcon, 
  DocumentIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

interface ContextFile {
  id: string;
  name: string;
  size?: number;
  type?: string;
}

interface ContextFilesProps {
  files: ContextFile[];
  onRemoveFile: (fileId: string) => void;
  onAddFiles?: () => void;
  className?: string;
}

export function ContextFiles({ files, onRemoveFile, onAddFiles, className = "" }: ContextFilesProps) {
  const getContextIcon = (file: ContextFile) => {
    if (file['type'] === 'file' || !file.type) return DocumentIcon;
    
    // Map data types to icons
    const iconMap = {
      lead: UserIcon,
      leads: UserIcon,
      opportunity: CurrencyDollarIcon,
      opportunities: CurrencyDollarIcon,
      person: UserGroupIcon,
      people: UserGroupIcon,
      company: BuildingOfficeIcon,
      companies: BuildingOfficeIcon,
      account: BriefcaseIcon,
      accounts: BriefcaseIcon,
      contact: PhoneIcon,
      contacts: PhoneIcon,
      competitor: ShieldCheckIcon,
      competitors: ShieldCheckIcon,
      activity: ChartBarIcon,
      activities: ChartBarIcon,
      email: EnvelopeIcon,
      emails: EnvelopeIcon,
    };
    
    return iconMap[file.type as keyof typeof iconMap] || DocumentIcon;
  };

  const getContextLabel = (file: ContextFile) => {
    if (file['type'] === 'file' || !file.type) return 'File';
    
    // Map data types to display labels
    const labelMap = {
      lead: 'Lead',
      leads: 'Lead',
      opportunity: 'Deal',
      opportunities: 'Deal',
      person: 'Person',
      people: 'Person',
      company: 'Company',
      companies: 'Company',
      account: 'Account',
      accounts: 'Account',
      contact: 'Contact',
      contacts: 'Contact',
      competitor: 'Competitor',
      competitors: 'Competitor',
      activity: 'Activity',
      activities: 'Activity',
      email: 'Email',
      emails: 'Email',
    };
    
    return labelMap[file.type as keyof typeof labelMap] || 'Context';
  };

  const isDataContext = (file: ContextFile) => {
    return file['type'] && file.type !== 'file';
  };

  // Show "Add Files" pill when no files
  if (files['length'] === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={onAddFiles}
          className="relative flex items-center gap-2 bg-panel-background text-foreground rounded-lg px-3 py-1.5 text-sm border border-border hover:border-border hover:bg-hover transition-colors cursor-pointer"
        >
          {/* File icon */}
          <DocumentIcon className="w-4 h-4" />
          <span className="font-medium text-xs">Add Files</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {files.map((file, index) => {
        const IconComponent = getContextIcon(file);
        const label = getContextLabel(file);
        const isData = isDataContext(file);
        
        return (
          <div
            key={file.id}
            className={`relative flex items-center gap-2 rounded-xl px-2 py-0.5 text-sm ${
              isData 
                ? 'bg-foreground text-background border border-border' 
                : 'bg-background text-foreground border border-border'
            }`}
            style={{
              borderRadius: '12px', // Squircle-like rounded corners
            }}
          >
            {/* Context indicator */}
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
              isData 
                ? 'bg-error text-white' 
                : 'bg-muted-light text-muted'
            }`}>
              {isData ? '@' : (index + 1)}
            </div>
            
            {/* Icon and label */}
            <IconComponent className="w-4 h-4" />
            <span className="font-medium">{label}</span>
            
            {/* Data context name */}
            {isData && (
              <span className="text-xs text-muted max-w-24 truncate">
                {file.name}
              </span>
            )}
            
            {/* Remove button */}
            <button
              onClick={() => onRemoveFile(file.id)}
              className={`ml-1 p-0.5 rounded-full transition-colors ${
                isData 
                  ? 'hover:bg-foreground/20' 
                  : 'hover:bg-hover'
              }`}
              aria-label={`Remove ${file.name}`}
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
