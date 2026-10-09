/**
 * HTTP Client to communicate with the Zotero Academic & Semantic Engine.
 */

export interface SemanticSearchResult {
  item_key: string;
  title: string;
  date: string;
  creators: string;
  passage: string;
  page_number?: number;
  score: number;
  doi?: string;
  match_type?: 'hybrid' | 'semantic' | 'keyword';
}

export type HybridSearchResult = SemanticSearchResult;

export interface ZoteroItemSummary {
  key: string;
  title: string;
  date: string;
  creators: string;
  item_type: string;
  abstract: string;
}

export interface ReadPaperResult {
  key: string;
  title: string;
  date: string;
  creators: string;
  abstract: string;
  doi?: string;
  pdf_text: string;
  start_page?: number;
  end_page?: number;
  error?: string;
}

export interface AnnotationItem {
  type: string;
  text: string;
  comment: string;
  page?: number;
}

export class ZoteroEngineClient {
  private baseUrl: string;

  constructor(port: number = 23125, host: string = '127.0.0.1') {
    this.baseUrl = `http://${host}:${port}`;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async postJson<T>(endpoint: string, payload: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Zotero Engine request to ${endpoint} failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.ok === false) {
      throw new Error(data.error || 'Unknown engine error');
    }
    return data;
  }

  async hybridSearch(
    query: string,
    limit: number = 5,
    mode: 'hybrid' | 'semantic' | 'keyword' = 'hybrid'
  ): Promise<HybridSearchResult[]> {
    const data = await this.postJson<{ results: HybridSearchResult[] }>('/api/hybrid_search', {
      query,
      limit,
      mode,
    });
    return data.results || [];
  }

  async semanticSearch(query: string, limit: number = 5): Promise<SemanticSearchResult[]> {
    const data = await this.postJson<{ results: SemanticSearchResult[] }>('/api/semantic_search', { query, limit });
    return data.results || [];
  }

  async searchItems(query: string, limit: number = 10): Promise<ZoteroItemSummary[]> {
    const data = await this.postJson<{ items: ZoteroItemSummary[] }>('/api/search', { query, limit });
    return data.items || [];
  }

  async readPaper(itemKey: string, startPage?: number, endPage?: number): Promise<ReadPaperResult> {
    const data = await this.postJson<{ data: ReadPaperResult }>('/api/read_paper', {
      item_key: itemKey,
      start_page: startPage,
      end_page: endPage,
    });
    return data.data;
  }

  async getAnnotations(itemKey: string): Promise<AnnotationItem[]> {
    const data = await this.postJson<{ annotations: AnnotationItem[] }>('/api/annotations', {
      item_key: itemKey,
    });
    return data.annotations || [];
  }

  async addPaper(identifier: string): Promise<any> {
    const data = await this.postJson<{ data: any }>('/api/add_paper', { identifier });
    return data.data;
  }

  async syncDatabase(action: 'status' | 'update' = 'status'): Promise<any> {
    const data = await this.postJson<{ data: any }>('/api/sync_database', { action });
    return data.data;
  }
}
