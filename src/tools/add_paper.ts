import { ZoteroEngineClient } from '../client';

let defineTool: any;
try {
  defineTool = require('@deepseek-ai/dsh-tools').defineTool;
} catch {
  defineTool = (spec: any) => spec;
}

export function registerAddPaperTool(ctx: any, client: ZoteroEngineClient) {
  ctx.tools.register(
    defineTool({
      name: 'zotero_add_paper',
      description:
        'Import a research paper into Zotero by DOI, arXiv ID/URL, or BibTeX. Automatically resolves metadata and attaches available open-access PDFs.',
      parameters: {
        identifier: {
          type: 'string',
          required: true,
          description: 'DOI (e.g. "10.1145/3372278.3390678"), arXiv ID (e.g. "1706.03762"), or BibTeX snippet',
        },
      },
      output: {
        schema: { type: 'object' },
        render: (_args: any, res: any) => [
          {
            type: 'text',
            text:
              res.error
                ? `Failed to add paper: ${res.error}`
                : `Successfully added paper to Zotero!\n- **Title**: ${res.title || res.data?.title || 'Unknown'}\n- **Key**: \`${res.key || res.data?.key || 'N/A'}\`\n${res.pdf_attached ? '✓ Open-access PDF attached.' : ''}`,
          },
        ],
      },
      async execute(args: { identifier: string }) {
        return await client.addPaper(args.identifier);
      },
    })
  );
}
