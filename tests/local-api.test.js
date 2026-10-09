import test from 'node:test';
import assert from 'node:assert/strict';
import { ZoteroLocalApiClient } from '../dist/local-api.js';
import { ZoteroAcademicError } from '../dist/errors.js';

test('ZoteroLocalApiClient returns false when desktop is unreachable', async () => {
  // Port 9999 is unallocated
  const client = new ZoteroLocalApiClient(9999);
  const available = await client.isAvailable();
  assert.equal(available, false);
});

test('ZoteroLocalApiClient throws INVALID_ARGUMENT when item keys array is empty', async () => {
  const client = new ZoteroLocalApiClient(23119);
  await assert.rejects(
    async () => {
      await client.exportItems([], 'bibtex');
    },
    (err) => {
      assert.ok(err instanceof ZoteroAcademicError);
      assert.equal(err.code, 'ZOTERO_INVALID_ARGUMENT');
      return true;
    }
  );
});
