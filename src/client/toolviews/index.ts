/**
 * Academic toolview cards registration for tool.call.toolview slot.
 */

import { HybridSearchToolView } from './HybridSearchToolView';
import { ReadPaperToolView } from './ReadPaperToolView';
import { ExportToolView } from './ExportToolView';

export const REGISTRATIONS = [
  ['zotero_hybrid_search', HybridSearchToolView],
  ['zotero_semantic_search', HybridSearchToolView],
  ['zotero_read_paper', ReadPaperToolView],
  ['zotero_export', ExportToolView],
] as const;

export function registerZoteroAcademicToolviews(ctx: any): void {
  if (!ctx.slots?.inject) return;
  ctx.slots.inject('tool.call.toolview', function* () {
    for (const [key, component] of REGISTRATIONS) {
      yield ctx.slots.register({ name: 'tool.call.toolview', key, locale: 'zotero' }, component);
    }
  });
}
