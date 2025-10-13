export interface ActionGuideSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  pages: ActionGuidePage[];
}

export interface ActionGuidePage {
  id: string;
  title: string;
  description: string;
  content: string;
  lastUpdated: string;
  tags?: string[];
}

export interface ActionGuideContextType {
  selectedPage: ActionGuidePage | null;
  setSelectedPage: (page: ActionGuidePage | null) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  children?: TableOfContentsItem[];
}
