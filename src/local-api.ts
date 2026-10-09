/**
 * Zotero Desktop Local API Client.
 * Connects to Zotero 7/10 built-in REST endpoint at 127.0.0.1:23119/api.
 * Provides fast collection browsing, item details, and formatted academic citation exports.
 */

import { ZoteroAcademicError, ERROR_CODES } from './errors.js';

export interface LocalApiExportResult {
  format: string;
  style?: string;
  locale?: string;
  content: string;
  items?: Array<{ key: string; citation: string }>;
}

export interface ZoteroCollectionInfo {
  key: string;
  name: string;
  parentCollection?: string | false;
  numCollections: number;
  numItems: number;
}

export class ZoteroLocalApiClient {
  private baseUrl: string;

  constructor(port: number = 23119, host: string = '127.0.0.1') {
    this.baseUrl = `http://${host}:${port}/api`;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/users/0/items?limit=1`, {
        method: 'GET',
        headers: { 'Zotero-API-Version': '3' },
        signal: AbortSignal.timeout(1500),
      });
      return res.ok || res.status === 403; // 403 may mean permissions needed, but server is alive
    } catch {
      return false;
    }
  }

  /**
   * Export items in academic formats: bibtex, biblatex, ris, csljson, citation, bibliography.
   */
  async exportItems(
    itemKeys: string[],
    format: 'citation' | 'bibliography' | 'bibtex' | 'biblatex' | 'ris' | 'csljson',
    style?: string,
    locale?: string
  ): Promise<LocalApiExportResult> {
    if (!itemKeys || itemKeys.length === 0) {
      throw new ZoteroAcademicError('No item keys provided for export', ERROR_CODES.INVALID_ARGUMENT);
    }

    const keyList = itemKeys.join(',');
    const params = new URLSearchParams();
    params.set('itemKey', keyList);

    if (format === 'citation') {
      params.set('include', 'citation');
      if (style) params.set('style', style);
      if (locale) params.set('locale', locale);
    } else if (format === 'bibliography') {
      params.set('format', 'bib');
      if (style) params.set('style', style);
      if (locale) params.set('locale', locale);
    } else {
      // Direct translator formats: bibtex, biblatex, ris, csljson
      params.set('format', format);
    }

    const url = `${this.baseUrl}/users/0/items?${params.toString()}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Zotero-API-Version': '3' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new ZoteroAcademicError(
          `Local API export failed (${res.status}): ${errorText}`,
          ERROR_CODES.EXPORT_FAILED
        );
      }

      if (format === 'citation') {
        const json = await res.json();
        const items = (Array.isArray(json) ? json : []).map((it: any) => ({
          key: it.key || it.data?.key,
          citation: (it.citation || '').replace(/<[^>]+>/g, '').trim(),
        }));
        const joinedContent = items.map((it) => `- [${it.key}] ${it.citation}`).join('\n');
        return {
          format,
          style,
          locale,
          content: joinedContent,
          items,
        };
      } else {
        const text = await res.text();
        return {
          format,
          style,
          locale,
          content: text.trim(),
        };
      }
    } catch (err: any) {
      if (err instanceof ZoteroAcademicError) throw err;
      throw new ZoteroAcademicError(
        `Unable to export citations from Zotero Local API: ${err?.message || err}`,
        ERROR_CODES.LOCAL_API_UNAVAILABLE,
        err
      );
    }
  }

  /**
   * Fetch hierarchical collections list.
   */
  async getCollections(): Promise<ZoteroCollectionInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/users/0/collections`, {
        method: 'GET',
        headers: { 'Zotero-API-Version': '3' },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch collections (${res.status})`);
      }

      const list = await res.json();
      return (Array.isArray(list) ? list : []).map((col: any) => ({
        key: col.key || col.data?.key,
        name: col.data?.name || col.name || 'Untitled Collection',
        parentCollection: col.data?.parentCollection || col.parentCollection || false,
        numCollections: col.meta?.numCollections || 0,
        numItems: col.meta?.numItems || 0,
      }));
    } catch (err: any) {
      throw new ZoteroAcademicError(
        `Failed to retrieve collections from Local API: ${err?.message || err}`,
        ERROR_CODES.LOCAL_API_UNAVAILABLE,
        err
      );
    }
  }
}
