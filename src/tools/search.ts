import { ZoteroEngineClient, ZoteroItemSummary } from '../client';

let defineTool: any;
try {
  defineTool = require('@deepseek-ai/dsh-tools').defineTool;
} catch {
  defineTool = (spec: any) => spec;
}

export function registerSearchTool(ctx: any, client: ZoteroEngineClient) {
  ctx.tools.register(
    defineTool({
      name: 'zotero_search',
      description:
        'Fast keyword search in your Zotero library across titles, creators, and metadata fields. Returns matched item keys and basic information.',
      parameters: {
        query: {
          type: 'string',
          required: true,
          description: 'Search keywords, paper title words, or author names',
        },
        limit: {
          type: 'number',
          required: false,
          description: 'Maximum number of items to return (default: 10)',
        },
      },
      output: {
        schema: { type: 'array' },
        render: (_args: any, items: ZoteroItemSummary[]) => [
          {
            type: 'text',
            text:
              items.length === 0
                ? 'No items found matching the query in your Zotero library.'
                : items
                    .map(
                      (it, idx) =>
                        `**[${idx + 1}]** \`${it.key}\` - **${it.title}** (${it.date || 'n.d.'})\n` +
                        `  *Authors*: ${it.creators || 'Unknown'} | *Type*: ${it.item_type}\n` +
                        (it.abstract ? `  *Abstract preview*: ${it.abstract}...\n` : '')
                    )
                    .join('\n'),
          },
        ],
      },
      async execute(args: { query: string; limit?: number }) {
        return await client.searchItems(args.query, args.limit || 10);
      },
    })
  );
}
