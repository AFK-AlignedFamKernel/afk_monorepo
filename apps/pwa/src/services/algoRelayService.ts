// AlgoRelay API Service
// Handles all communication with the algo-relay backend

const API_BASE = process.env.NEXT_PUBLIC_ALGO_RELAY_URL || 'http://localhost:3334';
const WS_BASE = API_BASE.replace('http', 'ws').replace('https', 'wss');

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[AlgoRelay] ℹ️ ${message}`, data || '');
  },
  success: (message: string, data?: any) => {
    console.log(`[AlgoRelay] ✅ ${message}`, data || '');
  },
  warning: (message: string, data?: any) => {
    console.warn(`[AlgoRelay] ⚠️ ${message}`, data || '');
  },
  error: (message: string, data?: any) => {
    console.error(`[AlgoRelay] ❌ ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AlgoRelay] 🔍 ${message}`, data || '');
    }
  }
};

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
    const startTime = Date.now();
    
    log.info(`Making API request to: ${endpoint}`, { url, method: options?.method || 'GET' });
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        credentials: 'include', // Include credentials for CORS
        ...options,
      });

      const responseTime = Date.now() - startTime;
      log.debug(`Response received`, { 
        endpoint, 
        status: response.status, 
        statusText: response.statusText,
        responseTime: `${responseTime}ms`
      });

      if (!response.ok) {
        log.error(`API request failed`, { 
          endpoint, 
          status: response.status, 
          statusText: response.statusText 
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle null responses by returning empty arrays
      if (data === null || data === undefined) {
        log.warning(`API returned null/undefined data`, { endpoint });
        return [] as T;
      }
      
      log.success(`API request successful`, { 
        endpoint, 
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : 'N/A',
        responseTime: `${responseTime}ms`
      });
      
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      log.error(`API request failed`, { 
        endpoint, 
        error: error instanceof Error ? error.message : error,
        responseTime: `${responseTime}ms`
      });
      throw error;
    }
  }

  // Fetch trending notes
  async getTrendingNotes(limit: number = 20): Promise<TrendingNote[]> {
    log.info(`Fetching trending notes`, { limit });
    return this.makeRequest<TrendingNote[]>(`/api/trending-notes?limit=${limit}`);
  }

  // Fetch viral notes
  async getViralNotes(limit: number = 20): Promise<ViralNote[]> {
    log.info(`Fetching viral notes`, { limit });
    return this.makeRequest<ViralNote[]>(`/api/viral-notes?limit=${limit}`);
  }

  // Fetch viral notes from scraper
  async getViralNotesScraper(limit: number = 20): Promise<ViralNote[]> {
    log.info(`Fetching viral notes from scraper`, { limit });
    return this.makeRequest<ViralNote[]>(`/api/viral-notes-scraper?limit=${limit}`);
  }

  // Fetch top authors for a user
  async getTopAuthors(pubkey: string): Promise<TopAuthor[]> {
    log.info(`Fetching top authors`, { pubkey: pubkey.slice(0, 8) + '...' });
    return this.makeRequest<TopAuthor[]>(`/api/top-authors?pubkey=${pubkey}`);
  }

  // Fetch scraped notes with filters
  async getScrapedNotes(params: {
    limit?: number;
    kind?: number;
    since?: string;
  } = {}): Promise<ScrapedNote[]> {
    log.info(`Fetching scraped notes`, { params });
    
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.kind) searchParams.append('kind', params.kind.toString());
    if (params.since) searchParams.append('since', params.since);

    const queryString = searchParams.toString();
    return this.makeRequest<ScrapedNote[]>(`/api/scraped-notes${queryString ? `?${queryString}` : ''}`);
  }

  // Fetch user metrics
  async getUserMetrics(pubkey: string): Promise<UserMetrics> {
    log.info(`Fetching user metrics`, { pubkey: pubkey.slice(0, 8) + '...' });
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
    const wsUrl = `${WS_BASE}/ws`;
    log.info(`Connecting to WebSocket`, { url: wsUrl });
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      log.success(`WebSocket connected successfully`, { url: wsUrl });
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        log.debug(`WebSocket message received`, { 
          messageType: data.type,
          dataLength: JSON.stringify(data).length
        });
        onMessage(data);
      } catch (error) {
        log.error(`WebSocket message parsing error`, { 
          error: error instanceof Error ? error.message : error,
          rawData: event.data
        });
      }
    };

    ws.onerror = (error) => {
      log.error(`WebSocket error occurred`, { error });
      if (onError) {
        onError(error);
      }
    };

    ws.onclose = (event) => {
      log.warning(`WebSocket connection closed`, { 
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
    };

    return ws;
  }

  // Verify WebSocket connection
  async verifyWebSocketConnection(): Promise<{ connected: boolean; latency?: number; error?: string }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const wsUrl = `${WS_BASE}/ws`;
      
      log.info(`Verifying WebSocket connection`, { url: wsUrl });
      
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        log.error(`WebSocket connection timeout`, { url: wsUrl });
        ws.close();
        resolve({ connected: false, error: 'Connection timeout' });
      }, 5000); // 5 second timeout
      
      ws.onopen = () => {
        const latency = Date.now() - startTime;
        clearTimeout(timeout);
        log.success(`WebSocket verification successful`, { url: wsUrl, latency: `${latency}ms` });
        ws.close();
        resolve({ connected: true, latency });
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        log.error(`WebSocket verification failed`, { url: wsUrl, error });
        resolve({ connected: false, error: 'Connection failed' });
      };
    });
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