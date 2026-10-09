/**
 * Background Task Runner adapter connecting long-running Zotero operations
 * (e.g. database vector indexing, bulk PDF parsing) to Harness ctx.jobs.
 */

export interface JobProgressEvent {
  message: string;
  percent?: number;
}

export interface AcademicJobTask<T> {
  label: string;
  run: (
    signal: AbortSignal,
    onProgress: (event: JobProgressEvent) => void,
    log: (text: string) => void
  ) => Promise<T>;
  renderResult?: (value: T) => string;
}

export class AcademicJobRunner {
  private registry?: any;
  private logger?: any;

  constructor(registry?: any, logger?: any) {
    this.registry = registry;
    this.logger = logger;
  }

  get isAvailable(): boolean {
    return this.registry !== undefined && typeof this.registry.start === 'function';
  }

  /**
   * Run task in background with ctx.jobs if available, otherwise run in-process.
   */
  async execute<T>(
    task: AcademicJobTask<T>,
    runInBackground: boolean = false,
    signal?: AbortSignal
  ): Promise<any> {
    if (runInBackground && this.isAvailable) {
      const abortController = new AbortController();
      const jobId = this.registry.start({
        kind: 'zotero-academic',
        label: task.label,
        run: (job: any) => {
          (async () => {
            try {
              const res = await task.run(
                abortController.signal,
                (evt) => {
                  if (job.updateProgress) job.updateProgress(evt.message);
                  if (job.append) job.append(`[progress] ${evt.message}\n`, { channel: 'log' });
                },
                (logText) => {
                  if (job.append) job.append(logText.endsWith('\n') ? logText : `${logText}\n`, { channel: 'log' });
                }
              );
              if (job.complete) job.complete(task.renderResult ? task.renderResult(res) : JSON.stringify(res));
            } catch (err: any) {
              if (job.fail) job.fail(err?.message || String(err));
            }
          })();

          return {
            abort: () => abortController.abort(),
          };
        },
      });

      return {
        background: true,
        jobId,
        message: `Task "${task.label}" promoted to background job (ID: ${jobId}). Monitor logs via session header.`,
      };
    }

    // Direct in-process execution fallback
    const directAbort = signal || new AbortController().signal;
    return await task.run(
      directAbort,
      (evt) => this.logger?.info?.(`[TaskProgress] ${evt.message}`),
      (text) => this.logger?.debug?.(`[TaskLog] ${text}`)
    );
  }
}
