/**
 * Browser client entry point for dsh-zotero-academic.
 * Injected into DeepSeek Harness Web UI runtime.
 */

import { registerZoteroAcademicToolviews } from './toolviews/index';
import { zh, en } from './locales';

export const name = 'zotero-academic-client';
export const inject = ['locale', 'slots'];

export function apply(ctx: any) {
  // Register internationalization dictionaries
  if (ctx.locale?.register) {
    ctx.locale.register('zotero', { zh, en });
  }

  // Register interactive ToolView cards
  registerZoteroAcademicToolviews(ctx);
}

export default {
  name,
  inject,
  apply,
};
