/**
 * zotero_hybrid_search: Reciprocal Rank Fusion (RRF) search
 * combining SQLite keyword/metadata matching with ChromaDB vector semantic search.
 */

import { ZoteroEngineClient, HybridSearchResult } from '../client';

let defineTool: any;
try {
  defineTool = require('@deepseek-ai/dsh-tools').defineTool;
} catch {
  defineTool = (spec: any) => spec;
}

export function registerHybridSearchTool(ctx: any, client: ZoteroEngineClient) {
  ctx.tools.register(
    defineTool({
      name: 'zotero_hybrid_search',
      description:
        'Perform Reciprocal Rank Fusion (RRF) hybrid search across your Zotero research papers, fusing exact keyword matches with vector semantic similarity for optimal recall and precision.',
      parameters: {
        query: {
          type: 'string',
          required: true,
          description: 'Natural language search query, research hypothesis, or technical keywords',
        },
        limit: {
          type: 'number',
          required: false,
          description: 'Number of relevant paper passages to retrieve (default: 5, max: 20)',
        },
        mode: {
          type: 'string',
          enum: ['hybrid', 'semantic', 'keyword'],
          required: false,
          description:
            'Retrieval mode: "hybrid" (fused RRF, recommended), "semantic" (vector only), or "keyword" (exact keywords only)',
        },
      },
      output: {
        schema: { type: 'array' },
        render: (_args: any, results: HybridSearchResult[]) => [
          {
            type: 'text',
            text:
              results.length === 0
                ? 'No relevant paper passages found. Make sure papers are indexed via zotero_sync_database.'
                : results
                    .map((r, idx) => {
                      const badge =
                        r.match_type === 'hybrid'
                          ? '🌟 [Hybrid: Keyword + Vector]'
                          : r.match_type === 'semantic'
                          ? '🧠 [Vector Semantic]'
                          : '🔍 [Keyword Match]';
                      const pageStr = r.page_number ? ` (Page ${r.page_number})` : '';
                      const passageClean = (r.passage || '').trim().replace(/\n+/g, '\n> ');

                      return (
                        `### [${idx + 1}] ${r.title} (${r.date || 'n.d.'})\n` +
                        `- **Badge**: ${badge} | **Score**: \`${r.score}\` | **Item Key**: \`${r.item_key}\`\n` +
                        `- **Authors**: ${r.creators || 'Unknown'}${r.doi ? ` | **DOI**: ${r.doi}` : ''}\n` +
                        `- **Relevant Evidence${pageStr}**:\n` +
                        `> ${passageClean || '[No passage snippet available]'}`
                      );
                    })
                    .join('\n\n---\n\n'),
          },
        ],
      },
      async execute(args: {
        query: string;
        limit?: number;
        mode?: 'hybrid' | 'semantic' | 'keyword';
      }) {
        return await client.hybridSearch(args.query, args.limit || 5, args.mode || 'hybrid');
      },
    })
  );
}
