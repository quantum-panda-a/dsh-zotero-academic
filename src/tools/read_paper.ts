import { ZoteroEngineClient, ReadPaperResult } from '../client';

let defineTool: any;
try {
  defineTool = require('@deepseek-ai/dsh-tools').defineTool;
} catch {
  defineTool = (spec: any) => spec;
}

export function registerReadPaperTool(ctx: any, client: ZoteroEngineClient) {
  ctx.tools.register(
    defineTool({
      name: 'zotero_read_paper',
      description:
        'Read the detailed metadata and extracted PDF text of a specific Zotero item. Supports reading specific page ranges to inspect sections or proofs without overflowing context.',
      parameters: {
        item_key: {
          type: 'string',
          required: true,
          description: 'The 8-character Zotero item key (e.g. "ABCD1234")',
        },
        start_page: {
          type: 'number',
          required: false,
          description: 'Optional 1-based start page number to begin reading from',
        },
        end_page: {
          type: 'number',
          required: false,
          description: 'Optional 1-based end page number to read up to',
        },
      },
      output: {
        schema: { type: 'object' },
        render: (_args: any, res: ReadPaperResult) => {
          if (res.error) {
            return [{ type: 'text', text: `Error: ${res.error}` }];
          }
          const pageInfo =
            res.start_page || res.end_page
              ? ` (Pages ${res.start_page || 1} - ${res.end_page || 'end'})`
              : '';
          const metaSection =
            `# ${res.title}\n` +
            `- **Item Key**: \`${res.key}\`\n` +
            `- **Date**: ${res.date || 'n.d.'} | **Authors**: ${res.creators || 'Unknown'}\n` +
            (res.doi ? `- **DOI**: ${res.doi}\n` : '') +
            (res.abstract ? `\n### Abstract\n${res.abstract}\n` : '');

          const textSection =
            `\n### Extracted Document Content${pageInfo}\n` +
            (res.pdf_text ? res.pdf_text : '[No document content extracted]');

          return [{ type: 'text', text: `${metaSection}\n---\n${textSection}` }];
        },
      },
      async execute(args: { item_key: string; start_page?: number; end_page?: number }) {
        return await client.readPaper(args.item_key, args.start_page, args.end_page);
      },
    })
  );
}
