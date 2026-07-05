export interface Booklet {
  name: string;
  title: string;
  path: string;
  group: string;
  tags: string[];
  description: string;
  iconName: string;
  audience: string;
  year: string;
}

export type BookletGroup = 
  | "All"
  | "Core and Support"
  | "Launch Materials"
  | "Industry Booklets"
  | "Young and General"
  | "Indigenous and Remote";

export type BookletYear = "All" | "2026" | "2027" | "Both";

export interface BookletsFilter {
  searchQuery: string;
  group: BookletGroup;
  year: BookletYear;
  selectedTag: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
