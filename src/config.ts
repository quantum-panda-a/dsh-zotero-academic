/**
 * Configuration schema for dsh-zotero-academic.
 * Uses Schemastery/Cordis Schema for type validation and Web UI rendering.
 */

let Schema: any;
try {
  const cordis = require('@deepseek-ai/cordis');
  Schema = cordis.Schema;
} catch {
  Schema = {
    object: (props: any) => ({
      ...props,
      description: (d: string) => props,
      default: (val: any) => val,
    }),
    string: () => ({ default: (v: string) => v, description: (d: string) => d }),
    number: () => ({ default: (v: number) => v, description: (d: string) => d }),
    boolean: () => ({ default: (v: boolean) => v, description: (d: string) => d }),
  };
}

export interface PluginConfig {
  pythonPath: string;
  port: number;
  autoStart: boolean;
  zoteroDbPath?: string;
  huggingfaceModel?: string;
  localApiPort: number;
  enableJobs: boolean;
}

export const Config = Schema.object({
  pythonPath: Schema.string()
    .default('python')
    .description('Path to the Python executable with zotero dependencies (or uv run python)'),
  port: Schema.number()
    .default(23125)
    .description('Port number for the internal Python Academic & Semantic Engine daemon'),
  autoStart: Schema.boolean()
    .default(true)
    .description('Automatically start and stop the Python backend process with the plugin lifecycle'),
  zoteroDbPath: Schema.string()
    .description('Optional explicit path to zotero.sqlite (leave empty for auto-discovery)'),
  huggingfaceModel: Schema.string()
    .default('Qwen/Qwen3-Embedding-0.6B')
    .description('Local HuggingFace model name for sentence-transformers embedding (default: Qwen/Qwen3-Embedding-0.6B)'),
  localApiPort: Schema.number()
    .default(23119)
    .description('Port of Zotero Desktop built-in Local API (default: 23119)'),
  enableJobs: Schema.boolean()
    .default(true)
    .description('Enable Harness ctx.jobs background task runner for long indexing operations'),
});
