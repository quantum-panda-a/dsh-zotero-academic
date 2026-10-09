import test from 'node:test';
import assert from 'node:assert/strict';
import { ZoteroAcademicError, ERROR_CODES } from '../dist/errors.js';

test('ZoteroAcademicError attaches error code and message correctly', () => {
  const err = new ZoteroAcademicError('Engine is offline', ERROR_CODES.ENGINE_OFFLINE, { port: 23125 });
  assert.equal(err.name, 'ZoteroAcademicError');
  assert.equal(err.code, 'ZOTERO_ACADEMIC_ENGINE_OFFLINE');
  assert.equal(err.message, 'Engine is offline');
  assert.deepEqual(err.details, { port: 23125 });
});

test('ERROR_CODES contains all necessary domain failure codes', () => {
  assert.ok(ERROR_CODES.ENGINE_OFFLINE);
  assert.ok(ERROR_CODES.LOCAL_API_UNAVAILABLE);
  assert.ok(ERROR_CODES.EXPORT_FAILED);
  assert.ok(ERROR_CODES.ITEM_NOT_FOUND);
});
