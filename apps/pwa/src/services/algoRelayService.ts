// AlgoRelay API Service
// Handles all communication with the algo-relay backend

const API_BASE = process.env.NEXT_PUBLIC_ALGO_RELAY_URL || 'http://localhost:3334';

export interface TrendingNote {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  kind: number;
  tags: string[][];
  sig: string;
  author_name?: string;
  author_picture?: string;
  reaction_count?: number;
  zap_count?: number;
  reply_count?: number;
  score?: number;
}

export interface TopAuthor {
  pubkey: string;
  name?: string;
  picture?: string;
  interaction_count: number;
  last_interaction: number;
}

export interface ViralNote {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  kind: number;
  tags: string[][];
  sig: string;
  author_name?: string;
  author_picture?: string;
  reaction_count?: number;
  zap_count?: number;
  reply_count?: number;
  viral_score?: number;
}

export interface ScrapedNote {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  kind: number;
  tags: string[][];
  sig: string;
  author_name?: string;
  author_picture?: string;
  reaction_count?: number;
  zap_count?: number;
  reply_count?: number;
  scraped_at: number;
}

export interface UserMetrics {
  total_notes: number;
  total_reactions: number;
  total_zaps: number;
  total_replies: number;
  engagement_rate: number;
  top_tags: string[];
  activity_timeline: Array<{
    date: string;
    notes: number;
    reactions: number;
    zaps: number;
  }>;
}

class AlgoRelayService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        credentials: 'include', // Include credentials for CORS
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle null responses by returning empty arrays
      if (data === null || data === undefined) {
        return [] as T;
      }
      
      return data;
    } catch (error) {
      console.error(`AlgoRelay API error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Fetch trending notes
  async getTrendingNotes(limit: number = 20): Promise<TrendingNote[]> {
    return this.makeRequest<TrendingNote[]>(`/api/trending-notes?limit=${limit}`);
  }

  // Fetch viral notes
  async getViralNotes(limit: number = 20): Promise<ViralNote[]> {
    return this.makeRequest<ViralNote[]>(`/api/viral-notes?limit=${limit}`);
  }

  // Fetch viral notes from scraper
  async getViralNotesScraper(limit: number = 20): Promise<ViralNote[]> {
    return this.makeRequest<ViralNote[]>(`/api/viral-notes-scraper?limit=${limit}`);
  }

  // Fetch top authors for a user
  async getTopAuthors(pubkey: string): Promise<TopAuthor[]> {
    return this.makeRequest<TopAuthor[]>(`/api/top-authors?pubkey=${pubkey}`);
  }

  // Fetch scraped notes with filters
  async getScrapedNotes(params: {
    limit?: number;
    kind?: number;
    since?: string;
  } = {}): Promise<ScrapedNote[]> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.kind) searchParams.append('kind', params.kind.toString());
    if (params.since) searchParams.append('since', params.since);

    const queryString = searchParams.toString();
    return this.makeRequest<ScrapedNote[]>(`/api/scraped-notes${queryString ? `?${queryString}` : ''}`);
  }

  // Fetch user metrics
  async getUserMetrics(pubkey: string): Promise<UserMetrics> {
    return this.makeRequest<UserMetrics>(`/api/user-metrics?pubkey=${pubkey}`);
  }

  // Trigger data setup (admin function)
  async triggerDataSetup(): Promise<{ status: string; message: string }> {
    return this.makeRequest<{ status: string; message: string }>('/api/trigger-data-setup', {
      method: 'POST',
    });
  }

  // Sync notes (admin function)
  async syncNotes(): Promise<{ status: string; message: string }> {
    return this.makeRequest<{ status: string; message: string }>('/api/sync-notes', {
      method: 'POST',
    });
  }

  // Get notes with filters
  async getNotes(params: {
    limit?: number;
    kinds?: number[];
    authors?: string[];
    since?: number;
    until?: number;
    tags?: string[][];
  } = {}): Promise<TrendingNote[]> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.kinds) searchParams.append('kinds', params.kinds.join(','));
    if (params.authors) searchParams.append('authors', params.authors.join(','));
    if (params.since) searchParams.append('since', params.since.toString());
    if (params.until) searchParams.append('until', params.until.toString());
    if (params.tags) {
      params.tags.forEach(tag => {
        searchParams.append('tags', tag.join(':'));
      });
    }

    const queryString = searchParams.toString();
    return this.makeRequest<TrendingNote[]>(`/api/get-notes${queryString ? `?${queryString}` : ''}`);
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void): WebSocket {
    const ws = new WebSocket(`${API_BASE.replace('http', 'ws')}/ws`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    if (onError) {
      ws.onerror = onError;
    }

    return ws;
  }

  // Utility function to format timestamps
  formatTimestamp(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
    return `${Math.floor(diff / 2592000)}mo`;
  }

  // Utility function to get author display name
  getAuthorDisplayName(note: TrendingNote | ViralNote | ScrapedNote): string {
    return note.author_name || note.pubkey.slice(0, 8) + '...' + note.pubkey.slice(-8);
  }

  // Utility function to get author avatar
  getAuthorAvatar(note: TrendingNote | ViralNote | ScrapedNote | TopAuthor): string {
    if ('author_picture' in note) {
      return note.author_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${note.pubkey}`;
    }
    if ('picture' in note) {
      return note.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${note.pubkey}`;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${note.pubkey}`;
  }
}

// Export singleton instance
export const algoRelayService = new AlgoRelayService(); 