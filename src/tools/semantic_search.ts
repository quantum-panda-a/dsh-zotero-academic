import { ZoteroEngineClient, SemanticSearchResult } from '../client';

let defineTool: any;
try {
  defineTool = require('@deepseek-ai/dsh-tools').defineTool;
} catch {
  defineTool = (spec: any) => spec;
}

export function registerSemanticSearchTool(ctx: any, client: ZoteroEngineClient) {
  ctx.tools.register(
    defineTool({
      name: 'zotero_semantic_search',
      description:
        'Perform semantic vector search over your Zotero research papers using natural language queries or research questions. Returns the most relevant passage extracts with citations and page numbers.',
      parameters: {
        query: {
          type: 'string',
          required: true,
          description: 'Natural language search query, concept, or research question',
        },
        limit: {
          type: 'number',
          required: false,
          description: 'Number of relevant paper passages to retrieve (default: 5, max: 20)',
        },
      },
      output: {
        schema: { type: 'array' },
        render: (_args: any, results: SemanticSearchResult[]) => [
          {
            type: 'text',
            text:
              results.length === 0
                ? 'No semantically relevant paper passages found. Make sure the database is indexed via zotero_sync_database.'
                : results
                    .map(
                      (r, idx) =>
                        `### [${idx + 1}] ${r.title} (${r.date || 'n.d.'})\n` +
                        `- **Item Key**: \`${r.item_key}\` | **Authors**: ${r.creators || 'Unknown'}${r.doi ? ` | **DOI**: ${r.doi}` : ''}\n` +
                        `- **Relevant Passage${r.page_number ? ` (Page ${r.page_number})` : ''}**:\n` +
                        `> ${r.passage.trim().replace(/\n+/g, '\n> ')}`
                    )
                    .join('\n\n---\n\n'),
          },
        ],
      },
      async execute(args: { query: string; limit?: number }) {
        return await client.semanticSearch(args.query, args.limit || 5);
      },
    })
  );
}
