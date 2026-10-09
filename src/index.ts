/**
 * dsh-zotero-academic: DeepSeek Harness Academic Research & Literature Companion.
 *
 * Provides DeepSeek Agents with:
 * - Local vector semantic search over papers and research passages (ChromaDB + Sentence-Transformers)
 * - Deep PDF reading with page-range slicing (PyMuPDF)
 * - Automated paper intake from DOI, arXiv, and BibTeX
 * - Formatted academic citation and bibliography exports (Local API / CSL)
 * - Hierarchical library collection browsing
 */

import { Context } from '@deepseek-ai/cordis';
import { Config, PluginConfig } from './config';
import { ZoteroAcademicService } from './service';

export const name = 'zotero-academic';
export const inject = ['tools'];
export { Config, PluginConfig };
export { ZoteroAcademicService };
export * from './errors';
export * from './client';
export * from './local-api';
export * from './job-runner';

/**
 * Standard Cordis apply entry point (compatible with functional plugin loaders).
 */
export function apply(ctx: Context, config: PluginConfig = Config as any) {
  return new ZoteroAcademicService(ctx, config);
}

export default ZoteroAcademicService;
