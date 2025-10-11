export interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  pages: DocPage[];
}

export interface DocPage {
  id: string;
  title: string;
  description: string;
  content: string;
  lastUpdated: string;
  tags?: string[];
}

export interface DocsContextType {
  selectedPage: DocPage | null;
  setSelectedPage: (page: DocPage | null) => void;
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