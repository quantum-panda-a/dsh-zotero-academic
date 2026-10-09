/**
 * ZoteroAcademicService: Cordis Service for dsh-zotero-academic.
 * Registers as `ctx.zoteroAcademic` (and aliases `ctx.zotero` if available).
 * Manages dual-rail communication (Python Academic Engine + Zotero Local API)
 * and tools registration.
 */

import { Service, type Context } from '@deepseek-ai/cordis';
import { Config, PluginConfig } from './config';
import { ZoteroEngineClient } from './client';
import { ZoteroLocalApiClient } from './local-api';
import { SidecarManager } from './sidecar';
import { AcademicJobRunner } from './job-runner';

import { registerSemanticSearchTool } from './tools/semantic_search';
import { registerHybridSearchTool } from './tools/hybrid_search';
import { registerSearchTool } from './tools/search';
import { registerReadPaperTool } from './tools/read_paper';
import { registerAnnotationsTool } from './tools/annotations';
import { registerAddPaperTool } from './tools/add_paper';
import { registerSyncDatabaseTool } from './tools/sync_database';
import { registerExportTool } from './tools/export';
import { registerBrowseTool } from './tools/browse';

declare module '@deepseek-ai/cordis' {
  interface Context {
    zoteroAcademic: ZoteroAcademicService;
    zotero?: ZoteroAcademicService;
  }
}

export class ZoteroAcademicService extends Service {
  static inject = ['tools'];
  static Config = Config;

  readonly engineClient: ZoteroEngineClient;
  readonly localApi: ZoteroLocalApiClient;
  readonly sidecar: SidecarManager;
  readonly jobRunner: AcademicJobRunner;
  readonly pluginConfig: PluginConfig;

  constructor(ctx: Context, config: PluginConfig = Config as any) {
    super(ctx, 'zoteroAcademic');
    this.pluginConfig = config || ({} as any);

    const logger = ctx.logger ? ctx.logger('zotero-academic') : console;
    const enginePort = this.pluginConfig.port || 23125;
    const localApiPort = this.pluginConfig.localApiPort || 23119;

    this.engineClient = new ZoteroEngineClient(enginePort);
    this.localApi = new ZoteroLocalApiClient(localApiPort);
    this.sidecar = new SidecarManager(this.pluginConfig, this.engineClient);

    // Retrieve ctx.jobs if injected/available in the environment
    const jobsRegistry = (ctx as any).jobs;
    this.jobRunner = new AcademicJobRunner(jobsRegistry, logger);

    // Provide ctx.zotero alias if not occupied
    if (!(ctx as any).zotero) {
      (ctx as any).zotero = this;
    }

    // Manage Python sidecar process lifecycle via Cordis ctx.effect()
    if (typeof ctx.effect === 'function') {
      ctx.effect(() => {
        let cleanupFn: (() => void) | undefined;
        this.sidecar.start(logger).then((cleanup) => {
          cleanupFn = cleanup;
        });

        return () => {
          if (cleanupFn) {
            cleanupFn();
          } else {
            this.sidecar.stop();
          }
        };
      });
    }

    // Register all 9 academic & literature tools
    registerHybridSearchTool(ctx, this.engineClient);
    registerSemanticSearchTool(ctx, this.engineClient);
    registerSearchTool(ctx, this.engineClient);
    registerReadPaperTool(ctx, this.engineClient);
    registerAnnotationsTool(ctx, this.engineClient);
    registerAddPaperTool(ctx, this.engineClient);
    registerSyncDatabaseTool(ctx, this.engineClient, this.jobRunner);
    registerExportTool(ctx, this.localApi);
    registerBrowseTool(ctx, this.localApi);

    logger.info?.('[zotero-academic] Zotero Academic Service loaded with dual-rail architecture.');
  }

  /**
   * Check aggregated connectivity of both the Python Academic Engine and Zotero Desktop.
   */
  async getStatus() {
    const [engineOnline, localApiOnline] = await Promise.all([
      this.engineClient.isHealthy(),
      this.localApi.isAvailable(),
    ]);

    return {
      name: 'dsh-zotero-academic',
      sidecar: {
        ...this.sidecar.getStatus(),
        online: engineOnline,
      },
      localApi: {
        port: this.pluginConfig.localApiPort || 23119,
        online: localApiOnline,
      },
      jobRunner: {
        available: this.jobRunner.isAvailable,
      },
    };
  }
}
