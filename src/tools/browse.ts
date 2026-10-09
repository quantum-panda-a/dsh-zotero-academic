/**
 * zotero_browse: Browse library collections hierarchy.
 */

import { ZoteroLocalApiClient } from '../local-api';

let defineTool: any;
try {
  defineTool = require('@deepseek-ai/dsh-tools').defineTool;
} catch {
  defineTool = (spec: any) => spec;
}

export function registerBrowseTool(ctx: any, localApi: ZoteroLocalApiClient) {
  ctx.tools.register(
    defineTool({
      name: 'zotero_browse',
      description:
        'Browse the structure and collections tree of your personal Zotero library, including collection keys, sub-collections, and item counts.',
      parameters: {
        target: {
          type: 'string',
          enum: ['collections'],
          required: false,
          description: 'Browse target: "collections" for collection hierarchy (default: "collections")',
        },
      },
      output: {
        schema: { type: 'array' },
        render: (_args: any, collections: any[]) => {
          if (!collections || collections.length === 0) {
            return [{ type: 'text', text: 'No collections found in this library.' }];
          }

          const lines = collections.map((col) => {
            const parent = col.parentCollection ? ` (Sub-collection of \`${col.parentCollection}\`)` : ' (Top-level)';
            return `- **${col.name}** [Key: \`${col.key}\`]${parent}: ${col.numItems} items, ${col.numCollections} sub-collections`;
          });

          return [
            {
              type: 'text',
              text: `### Zotero Library Collections (${collections.length})\n\n${lines.join('\n')}`,
            },
          ];
        },
      },
      async execute(_args: { target?: 'collections' }) {
        return await localApi.getCollections();
      },
    })
  );
}
