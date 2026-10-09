/**
 * Error definitions and structured error codes for dsh-zotero-academic.
 */

export const ERROR_CODES = {
  ENGINE_OFFLINE: 'ZOTERO_ACADEMIC_ENGINE_OFFLINE',
  ENGINE_REQUEST_FAILED: 'ZOTERO_ACADEMIC_ENGINE_REQUEST_FAILED',
  LOCAL_API_UNAVAILABLE: 'ZOTERO_LOCAL_API_UNAVAILABLE',
  ITEM_NOT_FOUND: 'ZOTERO_ITEM_NOT_FOUND',
  ATTACHMENT_NOT_FOUND: 'ZOTERO_ATTACHMENT_NOT_FOUND',
  INDEXING_IN_PROGRESS: 'ZOTERO_INDEXING_IN_PROGRESS',
  INVALID_ARGUMENT: 'ZOTERO_INVALID_ARGUMENT',
  EXPORT_FAILED: 'ZOTERO_EXPORT_FAILED',
} as const;

export type ZoteroErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export class ZoteroAcademicError extends Error {
  readonly code: ZoteroErrorCode;
  readonly details?: any;

  constructor(message: string, code: ZoteroErrorCode, details?: any) {
    super(message);
    this.name = 'ZoteroAcademicError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
