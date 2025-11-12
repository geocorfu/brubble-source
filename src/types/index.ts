// Core types for Brubble platform

export interface Persona {
  id: string;
  name: string;
  category: 'political' | 'generational' | 'geographic';
  attributes: {
    age?: string;
    location?: string;
    political_leaning?: 'progressive' | 'centrist' | 'conservative';
    interests?: string[];
  };
  color: string;
  icon?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  timestamp?: Date;
  sentiment?: number;
  relevance_score?: number;
  platform: 'google' | 'bing' | 'duckduckgo' | 'reddit' | 'youtube' | 'twitter' | 'news';
}

export interface PersonaResults {
  persona: Persona;
  results: SearchResult[];
  summary_stats: {
    total_results: number;
    unique_sources: number;
    avg_sentiment: number;
    top_sources: string[];
  };
}

export interface ComparisonMetrics {
  echo_score: number;
  overlap_percentage: number;
  unique_to_a: SearchResult[];
  unique_to_b: SearchResult[];
  common_results: SearchResult[];
  sentiment_divergence: number;
  source_diversity_score: number;
}

export interface BrubbleAnalysis {
  query: string;
  timestamp: Date;
  personas: Persona[];
  results: PersonaResults[];
  metrics: ComparisonMetrics[];
  insights: string[];
  visualization_data: {
    venn_diagram: any;
    sentiment_map: any;
    word_clouds: any;
    timeline: any;
  };
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  api_endpoint?: string;
  rate_limit?: number;
}

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'progressive',
    name: 'Progressive',
    category: 'political',
    attributes: { political_leaning: 'progressive' },
    color: '#3B82F6',
  },
  {
    id: 'conservative',
    name: 'Conservative',
    category: 'political',
    attributes: { political_leaning: 'conservative' },
    color: '#EF4444',
  },
  {
    id: 'centrist',
    name: 'Centrist',
    category: 'political',
    attributes: { political_leaning: 'centrist' },
    color: '#8B5CF6',
  },
  {
    id: 'gen_z',
    name: 'Gen Z',
    category: 'generational',
    attributes: { age: '18-25' },
    color: '#10B981',
  },
  {
    id: 'millennial',
    name: 'Millennial',
    category: 'generational',
    attributes: { age: '26-40' },
    color: '#F59E0B',
  },
  {
    id: 'gen_x_plus',
    name: 'Gen X+',
    category: 'generational',
    attributes: { age: '40+' },
    color: '#6366F1',
  },
  {
    id: 'urban_us',
    name: 'Urban US',
    category: 'geographic',
    attributes: { location: 'US Urban' },
    color: '#EC4899',
  },
  {
    id: 'rural_us',
    name: 'Rural US',
    category: 'geographic',
    attributes: { location: 'US Rural' },
    color: '#84CC16',
  },
  {
    id: 'european',
    name: 'European',
    category: 'geographic',
    attributes: { location: 'Europe' },
    color: '#06B6D4',
  },
];

export const PLATFORMS: Platform[] = [
  { id: 'google', name: 'Google Search', icon: '🔍', enabled: true },
  { id: 'youtube', name: 'YouTube', icon: '📹', enabled: true },
  { id: 'reddit', name: 'Reddit', icon: '💬', enabled: true },
  { id: 'news', name: 'News', icon: '📰', enabled: true },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', enabled: true },
];