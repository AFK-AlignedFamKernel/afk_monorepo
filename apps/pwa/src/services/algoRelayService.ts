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
  interaction_score: number;
  viral_score: number;
  trending_score: number;
  is_viral: boolean;
  is_trending: boolean;
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

export interface TrendingTopAuthor {
  pubkey: string;
  name?: string;
  picture?: string;
  total_interactions: number;
  reactions_received: number;
  zaps_received: number;
  replies_received: number;
  notes_count: number;
  engagement_score: number;
  last_activity: number;
}

// Backend data structures (from Go backend)
export interface BackendScrapedNote {
  id: string;
  author_id: string;
  kind: number;
  content: string;
  raw_json: string;
  created_at: string;
  scraped_at: string;
  interaction_score: number;
  viral_score: number;
  trending_score: number;
  is_viral: boolean;
  is_trending: boolean;
}

export interface BackendViralNote {
  Event: {
    kind: number;
    id: string;
    pubkey: string;
    created_at: number;
    tags: string[][];
    content: string;
    sig: string;
  };
  Score: number;
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

  // Data transformation utilities
  private transformBackendScrapedNote(backendNote: BackendScrapedNote): ScrapedNote {
    const rawJson = JSON.parse(backendNote.raw_json);
    const createdAt = new Date(backendNote.created_at).getTime() / 1000;
    const scrapedAt = new Date(backendNote.scraped_at).getTime() / 1000;
    
    return {
      id: backendNote.id,
      pubkey: backendNote.author_id,
      content: backendNote.content,
      created_at: createdAt,
      kind: backendNote.kind,
      tags: rawJson.tags || [],
      sig: rawJson.sig || '',
      author_name: undefined, // Will be populated by getAuthorDisplayName
      author_picture: undefined, // Will be populated by getAuthorAvatar
      reaction_count: 0, // Will be calculated from tags
      zap_count: 0, // Will be calculated from tags
      reply_count: 0, // Will be calculated from tags
      scraped_at: scrapedAt,
      interaction_score: backendNote.interaction_score,
      viral_score: backendNote.viral_score,
      trending_score: backendNote.trending_score,
      is_viral: backendNote.is_viral,
      is_trending: backendNote.is_trending
    };
  }

  private transformBackendViralNote(backendNote: BackendViralNote): ViralNote {
    const event = backendNote.Event;
    
    return {
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      created_at: event.created_at,
      kind: event.kind,
      tags: event.tags,
      sig: event.sig,
      author_name: undefined, // Will be populated by getAuthorDisplayName
      author_picture: undefined, // Will be populated by getAuthorAvatar
      reaction_count: 0, // Will be calculated from tags
      zap_count: 0, // Will be calculated from tags
      reply_count: 0, // Will be calculated from tags
      viral_score: backendNote.Score
    };
  }

  private transformBackendScrapedNoteToViralNote(backendNote: BackendScrapedNote): ViralNote {
    let rawJson: any = {};
    try {
      rawJson = JSON.parse(backendNote.raw_json);
    } catch (error) {
      console.warn(`Failed to parse raw_json for note ${backendNote.id}:`, error);
      rawJson = {};
    }
    
    const createdAt = new Date(backendNote.created_at).getTime() / 1000;
    
    return {
      id: backendNote.id,
      pubkey: backendNote.author_id,
      content: backendNote.content,
      created_at: createdAt,
      kind: backendNote.kind,
      tags: rawJson.tags || [],
      sig: rawJson.sig || '',
      author_name: undefined, // Will be populated by getAuthorDisplayName
      author_picture: undefined, // Will be populated by getAuthorAvatar
      reaction_count: 0, // Will be calculated from tags
      zap_count: 0, // Will be calculated from tags
      reply_count: 0, // Will be calculated from tags
      viral_score: backendNote.viral_score
    };
  }

  private transformToTrendingNote(note: ScrapedNote | ViralNote): TrendingNote {
    return {
      id: note.id,
      pubkey: note.pubkey,
      content: note.content,
      created_at: note.created_at,
      kind: note.kind,
      tags: note.tags,
      sig: note.sig,
      author_name: note.author_name,
      author_picture: note.author_picture,
      reaction_count: note.reaction_count,
      zap_count: note.zap_count,
      reply_count: note.reply_count,
      score: 'trending_score' in note ? note.trending_score : note.viral_score
    };
  }



  // Fetch viral notes from scraper
  async getViralNotesScraper(limit: number = 20): Promise<ViralNote[]> {
    log.info(`Fetching viral notes from scraper`, { limit });
    
    try {
      // The backend now returns ScrapedNote objects directly, not BackendViralNote objects
      const viralData = await this.makeRequest<BackendScrapedNote[]>(`/api/viral-notes-scraper?limit=${limit}`);
      
      if (viralData && viralData.length > 0) {
        log.success(`Found ${viralData.length} viral notes from scraper`);
        return viralData.map(note => this.transformBackendScrapedNoteToViralNote(note));
      }
      
      log.warning(`No viral notes from scraper available`);
      return [];
    } catch (error) {
      log.error(`Error fetching viral notes from scraper`, { error });
      return [];
    }
  }

  // Fetch top authors for a user
  async getTopAuthors(pubkey: string): Promise<TopAuthor[]> {
    log.info(`Fetching top authors`, { pubkey: pubkey.slice(0, 8) + '...' });
    return this.makeRequest<TopAuthor[]>(`/api/top-authors?pubkey=${pubkey}`);
  }

  // Fetch trending top authors
  async getTrendingTopAuthors(params: {
    limit?: number;
    timeRange?: '1h' | '6h' | '24h' | '1d' | '7d' | '30d';
  } = {}): Promise<TrendingTopAuthor[]> {
    const { limit = 20, timeRange = '7d' } = params;
    
    try {
      const response = await this.makeRequest<TrendingTopAuthor[]>(
        `/api/trending-top-authors?limit=${limit}&time_range=${timeRange}`
      );
      
      log.success(`Fetched ${response?.length || 0} trending top authors`, { limit, timeRange });
      return response || [];
    } catch (error) {
      log.error('Failed to fetch trending top authors', error);
      throw error;
    }
  }

  // Get diagnostic information about the database
  async getDiagnosticInfo(): Promise<{
    total_scraped_notes: number;
    viral_notes: number;
    notes_with_viral_score: number;
    recent_notes_7d: number;
    sample_viral_scores: Array<{
      viral_score: number;
      is_viral: boolean;
      interaction_score: number;
      created_at: string;
    }>;
    timestamp: string;
  }> {
    log.info(`Fetching diagnostic information`);
    
    try {
      const diagnostic = await this.makeRequest<{
        total_scraped_notes: number;
        viral_notes: number;
        notes_with_viral_score: number;
        recent_notes_7d: number;
        sample_viral_scores: Array<{
          viral_score: number;
          is_viral: boolean;
          interaction_score: number;
          created_at: string;
        }>;
        timestamp: string;
      }>('/api/diagnostic');
      
      log.success(`Diagnostic info retrieved`, { 
        totalNotes: diagnostic.total_scraped_notes,
        viralNotes: diagnostic.viral_notes,
        recentNotes: diagnostic.recent_notes_7d
      });
      
      return diagnostic;
    } catch (error) {
      log.error(`Error fetching diagnostic info`, { error });
      throw error;
    }
  }

  // Trigger data setup to populate the database
  async triggerDataSetup(): Promise<{ status: string; message: string }> {
    log.info(`Triggering data setup`);
    
    try {
      const response = await this.makeRequest<{ status: string; message: string }>('/api/trigger-data-setup', {
        method: 'POST',
      });
      
      log.success(`Data setup triggered successfully`);
      return response;
    } catch (error) {
      log.error(`Error triggering data setup`, { error });
      throw error;
    }
  }

  // Sync existing notes to scraped_notes table
  async syncNotes(): Promise<{ status: string; message: string }> {
    log.info(`Triggering note sync`);
    
    try {
      const response = await this.makeRequest<{ status: string; message: string }>('/api/sync-notes', {
        method: 'POST',
      });
      
      log.success(`Note sync triggered successfully`);
      return response;
    } catch (error) {
      log.error(`Error triggering note sync`, { error });
      throw error;
    }
  }

  // Enhanced getScrapedNotes with better error handling and fallback
  async getScrapedNotes(params: {
    limit?: number;
    offset?: number;
    kind?: number;
    since?: string;
  } = {}): Promise<ScrapedNote[]> {
    log.info(`Fetching scraped notes`, { params });
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());
      if (params.kind) searchParams.append('kind', params.kind.toString());
      if (params.since) searchParams.append('since', params.since);

      const queryString = searchParams.toString();
      const scrapedData = await this.makeRequest<BackendScrapedNote[]>(`/api/scraped-notes${queryString ? `?${queryString}` : ''}`);
      
      if (scrapedData && scrapedData.length > 0) {
        log.success(`Found ${scrapedData.length} scraped notes`);
        return scrapedData.map(note => this.transformBackendScrapedNote(note));
      }
      
      // If no data found, check if database is empty
      log.warning(`No scraped notes found - checking if database is empty`);
      try {
        const diagnostic = await this.getDiagnosticInfo();
        if (diagnostic.total_scraped_notes === 0) {
          log.warning(`Database is empty - suggesting data setup`);
          // You could trigger data setup here automatically, but for now just log
          log.info(`Consider calling triggerDataSetup() to populate the database`);
        }
      } catch (diagnosticError) {
        log.error(`Could not check diagnostic info`, { diagnosticError });
      }
      
      log.warning(`No scraped notes available`);
      return [];
    } catch (error) {
      log.error(`Error fetching scraped notes`, { error });
      return [];
    }
  }

  // Enhanced trending notes with better error handling
  async getTrendingNotes(limit: number = 20, offset: number = 0, minInteractionCount: number = 1): Promise<TrendingNote[]> {
    log.info(`Fetching trending notes`, { limit, offset, minInteractionCount });
    
    try {
      // First try the trending notes endpoint with pagination and interaction filter
      const trendingData = await this.makeRequest<BackendScrapedNote[]>(`/api/trending-notes?limit=${limit}&offset=${offset}&min_interaction_count=${minInteractionCount}`);
      
      if (trendingData && trendingData.length > 0) {
        log.success(`Found ${trendingData.length} trending notes with min ${minInteractionCount} interactions`);
        return trendingData.map(note => this.transformToTrendingNote(this.transformBackendScrapedNote(note)));
      }
      
      // Fallback to scraped notes with trending filter and pagination
      log.info(`No trending notes found, falling back to scraped notes`);
      const scrapedData = await this.makeRequest<BackendScrapedNote[]>(`/api/scraped-notes?limit=${limit}&offset=${offset}`);
      
      if (scrapedData && scrapedData.length > 0) {
        const trendingNotes = scrapedData
          .filter(note => note.is_trending || note.trending_score > 0)
          .sort((a, b) => b.trending_score - a.trending_score)
          .slice(0, limit);
        
        log.success(`Found ${trendingNotes.length} trending notes from scraped data`);
        return trendingNotes.map(note => this.transformToTrendingNote(this.transformBackendScrapedNote(note)));
      }
      
      // If still no data, check if database is empty
      log.warning(`No trending notes available - checking database status`);
      try {
        const diagnostic = await this.getDiagnosticInfo();
        if (diagnostic.total_scraped_notes === 0) {
          log.warning(`Database is empty - data setup may be needed`);
        }
      } catch (diagnosticError) {
        log.error(`Could not check diagnostic info`, { diagnosticError });
      }
      
      log.warning(`No trending notes available`);
      return [];
    } catch (error) {
      log.error(`Error fetching trending notes`, { error });
      return [];
    }
  }

  // Enhanced viral notes with better error handling
  async getViralNotes(limit: number = 20, offset: number = 0): Promise<ViralNote[]> {
    log.info(`Fetching viral notes`, { limit, offset });
    
    try {
      // The backend now returns ScrapedNote objects directly, not BackendViralNote objects
      const viralData = await this.makeRequest<BackendScrapedNote[]>(`/api/viral-notes?limit=${limit}&offset=${offset}`);
      
      if (viralData && viralData.length > 0) {
        log.success(`Found ${viralData.length} viral notes`);
        return viralData.map(note => this.transformBackendScrapedNoteToViralNote(note));
      }
      
      // If no viral notes, check if database is empty
      log.warning(`No viral notes available - checking database status`);
      try {
        const diagnostic = await this.getDiagnosticInfo();
        if (diagnostic.total_scraped_notes === 0) {
          log.warning(`Database is empty - data setup may be needed`);
        }
      } catch (diagnosticError) {
        log.error(`Could not check diagnostic info`, { diagnosticError });
      }
      
      log.warning(`No viral notes available`);
      return [];
    } catch (error) {
      log.error(`Error fetching viral notes`, { error });
      return [];
    }
  }

  // Fetch user metrics
  async getUserMetrics(pubkey: string): Promise<UserMetrics> {
    log.info(`Fetching user metrics`, { pubkey: pubkey.slice(0, 8) + '...' });
    return this.makeRequest<UserMetrics>(`/api/user-metrics?pubkey=${pubkey}`);
  }

  // Additional utility functions for all available endpoints

  // Get notes with advanced filtering
  async getNotes(params: {
    limit?: number;
    kinds?: number[];
    authors?: string[];
    since?: number;
    until?: number;
    tags?: string[][];
  } = {}): Promise<TrendingNote[]> {
    log.info(`Fetching notes with filters`, { params });
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.kinds) searchParams.append('kinds', params.kinds.join(','));
      if (params.authors) searchParams.append('authors', params.authors.join(','));
      if (params.since) searchParams.append('since', params.since.toString());
      if (params.until) searchParams.append('until', params.until.toString());

      const queryString = searchParams.toString();
      const notesData = await this.makeRequest<BackendScrapedNote[]>(`/api/get-notes${queryString ? `?${queryString}` : ''}`);
      
      if (notesData && notesData.length > 0) {
        log.success(`Found ${notesData.length} notes`);
        return notesData.map(note => this.transformToTrendingNote(this.transformBackendScrapedNote(note)));
      }
      
      log.warning(`No notes found with given filters`);
      return [];
    } catch (error) {
      log.error(`Error fetching notes`, { error });
      return [];
    }
  }

  // Get viral notes with different algorithms
  async getViralNotesByAlgorithm(algorithm: 'default' | 'scraper' = 'default', limit: number = 20): Promise<ViralNote[]> {
    log.info(`Fetching viral notes with algorithm`, { algorithm, limit });
    
    if (algorithm === 'scraper') {
      return this.getViralNotesScraper(limit);
    } else {
      return this.getViralNotes(limit);
    }
  }

  // Get trending notes with different time ranges
  async getTrendingNotesByTimeRange(timeRange: '1h' | '6h' | '24h' | '7d' = '24h', limit: number = 20, minInteractionCount: number = 1): Promise<TrendingNote[]> {
    log.info(`Fetching trending notes by time range`, { timeRange, limit, minInteractionCount });
    
    const now = new Date();
    let since: Date;
    
    switch (timeRange) {
      case '1h':
        since = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        since = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default: // 24h
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    try {
      const scrapedData = await this.getScrapedNotes({
        limit,
        since: since.toISOString()
      });
      
      const trendingNotes = scrapedData
        .filter(note => note.is_trending || note.trending_score > 0)
        .sort((a, b) => b.trending_score - a.trending_score)
        .slice(0, limit);
      
      log.success(`Found ${trendingNotes.length} trending notes for ${timeRange} time range`);
      return trendingNotes.map(note => this.transformToTrendingNote(note));
    } catch (error) {
      log.error(`Error fetching trending notes by time range`, { error });
      return [];
    }
  }

  // Get trending notes with different interaction thresholds
  async getTrendingNotesByInteractionLevel(interactionLevel: 'low' | 'medium' | 'high' = 'medium', limit: number = 20): Promise<TrendingNote[]> {
    log.info(`Fetching trending notes by interaction level`, { interactionLevel, limit });
    
    let minInteractionCount: number;
    switch (interactionLevel) {
      case 'high':
        minInteractionCount = 10; // At least 10 interactions
        break;
      case 'medium':
        minInteractionCount = 3; // At least 3 interactions
        break;
      default: // low
        minInteractionCount = 1; // At least 1 interaction
    }
    
    return this.getTrendingNotes(limit, 0, minInteractionCount);
  }

  // Search notes by topic tag
  async searchNotesByTopic(params: {
    topic: string;
    limit?: number;
    offset?: number;
    kinds?: number[];
    timeRange?: '1h' | '6h' | '24h' | '1d' | '7d' | '30d';
    minInteractionCount?: number;
    sortOrder?: 'created_at_asc' | 'created_at_desc' | 'interaction_score_desc' | 'viral_score_desc' | 'trending_score_desc' | 'reactions_desc' | 'comments_desc' | 'zaps_desc';
  }): Promise<TrendingNote[]> {
    const { 
      topic, 
      limit = 20, 
      offset = 0, 
      kinds = [], 
      timeRange = '7d', 
      minInteractionCount = 0,
      sortOrder = 'created_at_desc'
    } = params;
    
    log.info(`Searching notes by topic`, { topic, limit, offset, kinds, timeRange, minInteractionCount, sortOrder });
    
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('topic', topic);
      searchParams.append('limit', limit.toString());
      searchParams.append('offset', offset.toString());
      searchParams.append('time_range', timeRange);
      searchParams.append('min_interaction_count', minInteractionCount.toString());
      searchParams.append('sort', sortOrder);
      
      if (kinds.length > 0) {
        searchParams.append('kinds', kinds.join(','));
      }

      const queryString = searchParams.toString();
      const topicData = await this.makeRequest<BackendScrapedNote[]>(`/api/search/topics?${queryString}`);
      
      if (topicData && topicData.length > 0) {
        log.success(`Found ${topicData.length} notes for topic "${topic}"`);
        return topicData.map(note => this.transformToTrendingNote(this.transformBackendScrapedNote(note)));
      }
      
      log.warning(`No notes found for topic "${topic}"`);
      return [];
    } catch (error) {
      log.error(`Error searching notes by topic`, { error, topic });
      return [];
    }
  }

  // Get popular topics
  async getPopularTopics(params: {
    limit?: number;
    timeRange?: '1h' | '6h' | '24h' | '1d' | '7d' | '30d';
    minUsageCount?: number;
  } = {}): Promise<Array<{
    tag: string;
    usage_count: number;
    unique_authors: number;
    last_used: number;
  }>> {
    const { limit = 50, timeRange = '7d', minUsageCount = 1 } = params;
    
    log.info(`Fetching popular topics`, { limit, timeRange, minUsageCount });
    
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('limit', limit.toString());
      searchParams.append('time_range', timeRange);
      searchParams.append('min_usage_count', minUsageCount.toString());

      const queryString = searchParams.toString();
      const topicsData = await this.makeRequest<Array<{
        tag: string;
        usage_count: number;
        unique_authors: number;
        last_used: number;
      }>>(`/api/search/tags?${queryString}`);
      
      if (topicsData && topicsData.length > 0) {
        log.success(`Found ${topicsData.length} popular topics`);
        return topicsData;
      }
      
      log.warning(`No popular topics found`);
      return [];
    } catch (error) {
      log.error(`Error fetching popular topics`, { error });
      return [];
    }
  }

  // Get notes by content type
  async getNotesByContentType(contentType: 'text' | 'image' | 'article' | 'video' = 'text', limit: number = 20): Promise<ScrapedNote[]> {
    log.info(`Fetching notes by content type`, { contentType, limit });
    
    const kindMap = {
      text: 1,
      image: 6,
      article: 30023,
      video: 34236
    };
    
    try {
      const scrapedData = await this.getScrapedNotes({
        limit,
        kind: kindMap[contentType]
      });
      
      log.success(`Found ${scrapedData.length} ${contentType} notes`);
      return scrapedData;
    } catch (error) {
      log.error(`Error fetching notes by content type`, { error });
      return [];
    }
  }

  // Get notes by author
  async getNotesByAuthor(pubkey: string, limit: number = 20): Promise<ScrapedNote[]> {
    log.info(`Fetching notes by author`, { pubkey: pubkey.slice(0, 8) + '...', limit });
    
    try {
      const notesData = await this.getNotes({
        limit,
        authors: [pubkey]
      });
      
      // Convert TrendingNote back to ScrapedNote for consistency
      const scrapedNotes: ScrapedNote[] = notesData.map(note => ({
        id: note.id,
        pubkey: note.pubkey,
        content: note.content,
        created_at: note.created_at,
        kind: note.kind,
        tags: note.tags,
        sig: note.sig,
        author_name: note.author_name,
        author_picture: note.author_picture,
        reaction_count: note.reaction_count || 0,
        zap_count: note.zap_count || 0,
        reply_count: note.reply_count || 0,
        scraped_at: note.created_at, // Use created_at as fallback
        interaction_score: 0,
        viral_score: note.score || 0,
        trending_score: note.score || 0,
        is_viral: false,
        is_trending: false
      }));
      
      log.success(`Found ${scrapedNotes.length} notes by author`);
      return scrapedNotes;
    } catch (error) {
      log.error(`Error fetching notes by author`, { error });
      return [];
    }
  }

  // Get notes by tags
  async getNotesByTags(tags: string[], limit: number = 20): Promise<ScrapedNote[]> {
    log.info(`Fetching notes by tags`, { tags, limit });
    
    try {
      const scrapedData = await this.getScrapedNotes({ limit });
      
      const filteredNotes = scrapedData.filter(note => {
        const noteTags = note.tags.map(tag => tag[1]?.toLowerCase()).filter(Boolean);
        return tags.some(tag => noteTags.includes(tag.toLowerCase()));
      });
      
      log.success(`Found ${filteredNotes.length} notes with tags ${tags.join(', ')}`);
      return filteredNotes;
    } catch (error) {
      log.error(`Error fetching notes by tags`, { error });
      return [];
    }
  }

  // Get notes by engagement level
  async getNotesByEngagement(engagementLevel: 'low' | 'medium' | 'high' = 'medium', limit: number = 20): Promise<ScrapedNote[]> {
    log.info(`Fetching notes by engagement level`, { engagementLevel, limit });
    
    try {
      const scrapedData = await this.getScrapedNotes({ limit: limit * 2 }); // Get more to filter
      
      let filteredNotes: ScrapedNote[];
      
      switch (engagementLevel) {
        case 'high':
          filteredNotes = scrapedData
            .filter(note => note.interaction_score > 100)
            .sort((a, b) => b.interaction_score - a.interaction_score);
          break;
        case 'medium':
          filteredNotes = scrapedData
            .filter(note => note.interaction_score > 10 && note.interaction_score <= 100)
            .sort((a, b) => b.interaction_score - a.interaction_score);
          break;
        default: // low
          filteredNotes = scrapedData
            .filter(note => note.interaction_score <= 10)
            .sort((a, b) => b.interaction_score - a.interaction_score);
      }
      
      const result = filteredNotes.slice(0, limit);
      log.success(`Found ${result.length} notes with ${engagementLevel} engagement`);
      return result;
    } catch (error) {
      log.error(`Error fetching notes by engagement level`, { error });
      return [];
    }
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

// Transform backend data to NDKEvent format for PostEventCard
export const transformScrapedNoteToNDKEvent = (note: ScrapedNote): any => {
  // Create NDKEvent-like structure
  const ndkEvent = {
    id: note.id,
    pubkey: note.pubkey || '',
    kind: note.kind || 1,
    content: note.content || '',
    created_at: note.created_at || Math.floor(Date.now() / 1000),
    tags: note.tags || [],
    sig: note.sig || '',
    
    // Add our custom properties
    interaction_score: note.interaction_score,
    viral_score: note.viral_score,
    trending_score: note.trending_score,
    is_viral: note.is_viral,
    is_trending: note.is_trending,
    
    // Add profile information if available
    profile: {
      name: note.author_name || '',
      displayName: note.author_name || '',
      picture: note.author_picture || '',
      about: '',
    }
  };

  return ndkEvent;
};

export const transformTrendingNoteToNDKEvent = (note: TrendingNote): any => {
  return {
    id: note.id,
    pubkey: note.pubkey || '',
    kind: 1,
    content: note.content || '',
    created_at: note.created_at || Math.floor(Date.now() / 1000),
    tags: [],
    sig: '',
    
    // Add our custom properties
    interaction_score: note.reaction_count || 0,
    viral_score: 0,
    trending_score: note.score || 0,
    is_viral: false,
    is_trending: true,
    
    // Add profile information if available
    profile: {
      name: note.author_name || '',
      displayName: note.author_name || '',
      picture: note.author_picture || '',
      about: '',
    }
  };
};

export const transformViralNoteToNDKEvent = (note: ViralNote): any => {
  return {
    id: note.id,
    pubkey: note.pubkey || '',
    kind: 1,
    content: note.content || '',
    created_at: note.created_at || Math.floor(Date.now() / 1000),
    tags: [],
    sig: '',
    
    // Add our custom properties
    interaction_score: note.reaction_count || 0,
    viral_score: note.viral_score || 0,
    trending_score: 0,
    is_viral: true,
    is_trending: false,
    
    // Add profile information if available
    profile: {
      name: note.author_name || '',
      displayName: note.author_name || '',
      picture: note.author_picture || '',
      about: '',
    }
  };
};

// Export singleton instance
export const algoRelayService = new AlgoRelayService(); 