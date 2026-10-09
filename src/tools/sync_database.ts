import { ZoteroEngineClient } from '../client';
import { AcademicJobRunner } from '../job-runner';

let defineTool: any;
try {
  defineTool = require('@deepseek-ai/dsh-tools').defineTool;
} catch {
  defineTool = (spec: any) => spec;
}

export function registerSyncDatabaseTool(
  ctx: any,
  client: ZoteroEngineClient,
  jobRunner: AcademicJobRunner
) {
  ctx.tools.register(
    defineTool({
      name: 'zotero_sync_database',
      description:
        'Inspect ChromaDB vector database index statistics, or trigger incremental vector indexing for new papers. Supports running as a background job.',
      parameters: {
        action: {
          type: 'string',
          enum: ['status', 'update'],
          required: false,
          description: '"status" to inspect indexed counts, or "update" to compute vector embeddings for unindexed papers (default: "status")',
        },
        run_in_background: {
          type: 'boolean',
          required: false,
          description: 'Execute as a background job with streaming progress to prevent blocking conversation turns',
        },
      },
      output: {
        schema: { type: 'object' },
        render: (_args: any, res: any) => {
          if (res?.background) {
            return [
              {
                type: 'text',
                text: `### Background Sync Job Started\n- **Job ID**: \`${res.jobId}\`\n- ${res.message}`,
              },
            ];
          }

          if (res?.status === 'ok') {
            if (res.stats) {
              return [
                {
                  type: 'text',
                  text:
                    `### Zotero Vector Database Status\n` +
                    `- **Indexed Documents**: ${res.stats.indexed_items ?? res.stats.total_documents ?? 'N/A'}\n` +
                    `- **Collection Name**: ${res.stats.collection_name ?? 'zotero'}\n` +
                    `- **Embedding Provider**: ${res.stats.embedding_provider ?? 'Default'}\n` +
                    `- **Status**: Active and ready for semantic queries.`,
                },
              ];
            } else if (res.result) {
              return [
                {
                  type: 'text',
                  text:
                    `### Vector Database Update Complete\n` +
                    `- **New Items Indexed**: ${res.result.newly_indexed ?? 0}\n` +
                    `- **Watermark Updated**: ${res.result.watermark ?? 'Yes'}`,
                },
              ];
            }
          }
          return [{ type: 'text', text: `Sync Response: ${JSON.stringify(res, null, 2)}` }];
        },
      },
      async execute(args: { action?: 'status' | 'update'; run_in_background?: boolean }) {
        const action = args.action || 'status';

        if (action === 'update' && (args.run_in_background || jobRunner.isAvailable)) {
          return await jobRunner.execute(
            {
              label: 'Zotero Vector Embedding Sync',
              run: async (_signal, onProgress, log) => {
                onProgress({ message: 'Triggering incremental vector indexing...' });
                log('Connecting to Zotero Academic Engine at port 23125');
                const result = await client.syncDatabase('update');
                log(`Indexing finished: ${JSON.stringify(result)}`);
                onProgress({ message: 'Vector indexing complete' });
                return result;
              },
            },
            args.run_in_background ?? false
          );
        }

        return await client.syncDatabase(action);
      },
    })
  );
}
