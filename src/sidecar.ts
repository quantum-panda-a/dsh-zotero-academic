/**
 * Python Sidecar Process Manager with Watchdog & Resilience.
 * Handles lifecycle (spawn, health-probe wait, auto-restart on unexpected crashes, graceful kill).
 */

import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import { PluginConfig } from './config';
import { ZoteroEngineClient } from './client';

export class SidecarManager {
  private proc: ChildProcess | null = null;
  private client: ZoteroEngineClient;
  private config: PluginConfig;
  private isIntentionallyStopped: boolean = false;
  private restartCount: number = 0;
  private maxRestarts: number = 3;
  private logger: any;

  constructor(config: PluginConfig, client: ZoteroEngineClient) {
    this.config = config;
    this.client = client;
  }

  getStatus() {
    return {
      running: this.proc !== null && !this.proc.killed,
      pid: this.proc?.pid,
      port: this.config.port,
      restartCount: this.restartCount,
    };
  }

  async start(logger: any): Promise<() => void> {
    this.logger = logger;
    this.isIntentionallyStopped = false;

    if (!this.config.autoStart) {
      this.logger.info?.('AutoStart is disabled; expecting existing Zotero Engine at port %d', this.config.port);
      return () => {};
    }

    // Check if already running and healthy
    if (await this.client.isHealthy()) {
      this.logger.info?.('Zotero Academic Engine is already running and healthy on port %d', this.config.port);
      return () => {};
    }

    await this.spawnProcess();

    // Return cleanup callback for Cordis ctx.effect()
    return () => {
      this.stop();
    };
  }

  private async spawnProcess(): Promise<boolean> {
    const engineDir = path.resolve(__dirname, '..');
    const pythonCmd = this.config.pythonPath || 'python';
    const args = ['-m', 'engine.server', '--port', String(this.config.port)];

    if (this.config.zoteroDbPath) {
      args.push('--db-path', this.config.zoteroDbPath);
    }

    this.logger.info?.(
      'Launching Zotero Academic Engine: %s %s (cwd: %s, port: %d)',
      pythonCmd,
      args.join(' '),
      engineDir,
      this.config.port
    );

    try {
      this.proc = spawn(pythonCmd, args, {
        cwd: engineDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          ZOTERO_EMBEDDING_MODEL: this.config.huggingfaceModel || 'Qwen/Qwen3-Embedding-0.6B',
        },
      });
    } catch (err) {
      this.logger.error?.('Failed to spawn Python process: %s', err);
      return false;
    }

    this.proc.stdout?.on('data', (chunk) => {
      this.logger.debug?.(`[AcademicEngine] ${chunk.toString().trim()}`);
    });

    this.proc.stderr?.on('data', (chunk) => {
      this.logger.warn?.(`[AcademicEngine] ${chunk.toString().trim()}`);
    });

    this.proc.on('exit', (code, sig) => {
      this.logger.info?.('Zotero Academic Engine exited with code %s / signal %s', code, sig);
      this.proc = null;

      // Watchdog: attempt auto-restart if unintended crash and within retry budget
      if (!this.isIntentionallyStopped && this.restartCount < this.maxRestarts) {
        this.restartCount++;
        const delayMs = this.restartCount * 1500;
        this.logger.warn?.(
          'Engine crashed unexpectedly. Watchdog restarting (attempt %d/%d) in %dms...',
          this.restartCount,
          this.maxRestarts,
          delayMs
        );
        setTimeout(() => {
          if (!this.isIntentionallyStopped) {
            this.spawnProcess();
          }
        }, delayMs);
      }
    });

    // Wait for health check up to 15 seconds
    const startMs = Date.now();
    let ready = false;
    while (Date.now() - startMs < 15000) {
      if (await this.client.isHealthy()) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    if (!ready) {
      this.logger.warn?.('Zotero Academic Engine did not report ready within 15s. Tools may fail if process crashed.');
      return false;
    } else {
      this.logger.info?.('Zotero Academic Engine is ready and accepting requests.');
      this.restartCount = 0; // Reset counter on successful ready state
      return true;
    }
  }

  stop() {
    this.isIntentionallyStopped = true;
    if (this.proc) {
      this.logger?.info?.('Stopping Zotero Academic Engine process (PID: %s)...', this.proc.pid);
      try {
        this.proc.kill('SIGTERM');
        // Force kill after 2.5s if still alive
        const currentProc = this.proc;
        setTimeout(() => {
          if (currentProc && !currentProc.killed) {
            currentProc.kill('SIGKILL');
          }
        }, 2500);
      } catch (e) {
        // Process might have already exited
      }
      this.proc = null;
    }
  }
}
