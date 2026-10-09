import { ZoteroEngineClient, AnnotationItem } from '../client';

let defineTool: any;
try {
  defineTool = require('@deepseek-ai/dsh-tools').defineTool;
} catch {
  defineTool = (spec: any) => spec;
}

export function registerAnnotationsTool(ctx: any, client: ZoteroEngineClient) {
  ctx.tools.register(
    defineTool({
      name: 'zotero_get_annotations',
      description:
        'Retrieve all user annotations, highlights, tags, and reading notes for a specific Zotero item. Helps understand key points already noted by the reader.',
      parameters: {
        item_key: {
          type: 'string',
          required: true,
          description: 'The 8-character Zotero item key',
        },
      },
      output: {
        schema: { type: 'array' },
        render: (_args: any, annots: AnnotationItem[]) => [
          {
            type: 'text',
            text:
              annots.length === 0
                ? 'No annotations or notes found for this item.'
                : annots
                    .map((a, idx) => {
                      const prefix = a.page ? `[Page ${a.page}] ` : '';
                      const typeLabel = a.type === 'note' ? '📝 Note' : '🖍️ Highlight';
                      let body = `${typeLabel}: ${prefix}"${a.text.trim()}"`;
                      if (a.comment) {
                        body += `\n   *Comment*: ${a.comment.trim()}`;
                      }
                      return `**${idx + 1}.** ${body}`;
                    })
                    .join('\n\n'),
          },
        ],
      },
      async execute(args: { item_key: string }) {
        return await client.getAnnotations(args.item_key);
      },
    })
  );
}
