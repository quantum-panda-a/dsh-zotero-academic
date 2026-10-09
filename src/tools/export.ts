/**
 * zotero_export: Formatted academic citations, bibliography, and raw BibTeX/RIS/CSL-JSON export.
 */

import { ZoteroLocalApiClient } from '../local-api';

let defineTool: any;
try {
  defineTool = require('@deepseek-ai/dsh-tools').defineTool;
} catch {
  defineTool = (spec: any) => spec;
}

export function registerExportTool(ctx: any, localApi: ZoteroLocalApiClient) {
  ctx.tools.register(
    defineTool({
      name: 'zotero_export',
      description:
        'Export selected Zotero literature into academic citation formats (APA, IEEE HTML citations or bibliography) or bibliographic data files (BibTeX, BibLaTeX, RIS, CSL-JSON).',
      parameters: {
        item_keys: {
          type: 'array',
          items: { type: 'string' },
          required: true,
          description: 'Array of Zotero item keys to export (e.g. ["ABCD1234", "EFGH5678"])',
        },
        format: {
          type: 'string',
          enum: ['citation', 'bibliography', 'bibtex', 'biblatex', 'ris', 'csljson'],
          required: true,
          description:
            'Export format: "citation" (per-item inline citations), "bibliography" (CSL combined reference list), or standard data formats: "bibtex", "biblatex", "ris", "csljson"',
        },
        style: {
          type: 'string',
          required: false,
          description: 'CSL citation style id for citation/bibliography (e.g. "apa", "ieee", "nature", "chicago-author-date")',
        },
        locale: {
          type: 'string',
          required: false,
          description: 'Language locale for citations (e.g. "en-US", "zh-CN")',
        },
      },
      output: {
        schema: { type: 'object' },
        render: (_args: any, result: any) => {
          if (!result || !result.content) {
            return [{ type: 'text', text: 'No citation output generated.' }];
          }

          if (result.format === 'citation' || result.format === 'bibliography') {
            return [
              {
                type: 'text',
                text: `### Academic ${result.format === 'citation' ? 'Citations' : 'Bibliography'}${result.style ? ` (${result.style})` : ''}\n\n${result.content}`,
              },
            ];
          }

          // Code block for bibtex, ris, csljson
          const lang = result.format === 'csljson' ? 'json' : 'bibtex';
          return [
            {
              type: 'text',
              text: `### Exported ${result.format.toUpperCase()} (${result.items?.length || 'Items'})\n\n\`\`\`${lang}\n${result.content}\n\`\`\``,
            },
          ];
        },
      },
      async execute(args: {
        item_keys: string[];
        format: 'citation' | 'bibliography' | 'bibtex' | 'biblatex' | 'ris' | 'csljson';
        style?: string;
        locale?: string;
      }) {
        return await localApi.exportItems(args.item_keys, args.format, args.style, args.locale);
      },
    })
  );
}
