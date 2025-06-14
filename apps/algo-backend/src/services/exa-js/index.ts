import Exa from 'exa-js';

export class ExaService {
  private exa: Exa;

  constructor(apiKey?: string) {
    this.exa = new Exa(apiKey || process.env.EXA_API_KEY!);
  }

  async search(query: string, options?: any) {
    return await this.exa.search(query, options);
  }

  async searchWithDateFilters(query: string, startDate: string, endDate: string) {
    return await this.exa.search(query, {
      startPublishedDate: startDate,
      endPublishedDate: endDate
    });
  }

  async searchWithDomainFilters(query: string, domains: string[]) {
    return await this.exa.search(query, {
      includeDomains: domains
    });
  }

  async searchAndContents(query: string, options?: any) {
    return await this.exa.searchAndContents(query, options);
  }

  async findSimilar(url: string, options?: any) {
    return await this.exa.findSimilar(url, options);
  }

  async findSimilarAndContents(url: string, options?: any) {
    return await this.exa.findSimilarAndContents(url, options);
  }

  async getContents(ids: string[], options?: any) {
    return await this.exa.getContents(ids, options);
  }

  async answer(question: string, options?: any) {
    return await this.exa.answer(question, options);
  }

  async *streamAnswer(question: string) {
    for await (const chunk of this.exa.streamAnswer(question)) {
      yield chunk;
    }
  }

  async getContentsWithOptions(urls: string[], options: {
    maxCharacters?: number;
    highlightQuery?: string;
    numSentences?: number;
  }) {
    return await this.exa.getContents(urls, {
      text: { maxCharacters: options.maxCharacters || 1000 },
      highlights: { 
        query: options.highlightQuery || "AI", 
        numSentences: options.numSentences || 2 
      }
    });
  }
}

export { ExaService as ExaClient };