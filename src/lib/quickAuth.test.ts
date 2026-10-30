import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateQuickEntryInput,
  safeParseApiJson,
  buildLocalQuickSession,
} from './quickAuth';

test('QuickAuth: validateQuickEntryInput rejects empty first name and formats full name', () => {
  const emptyAr = validateQuickEntryInput('   ', 'أنيس', 'ar');
  assert.equal(emptyAr.valid, false);
  assert.equal(Boolean(emptyAr.error), true);

  const validFull = validateQuickEntryInput('Billel', 'Anisse', 'en');
  assert.equal(validFull.valid, true);
  assert.equal(validFull.error, null);
  assert.equal(validFull.fullName, 'Billel Anisse');

  const validFirstOnly = validateQuickEntryInput('قدور', '', 'ar');
  assert.equal(validFirstOnly.valid, true);
  assert.equal(validFirstOnly.fullName, 'قدور');
});

test('QuickAuth: safeParseApiJson never throws on <!DOCTYPE html> static host responses', async () => {
  const htmlResponse = new Response('<!DOCTYPE html><html><body>SPA</body></html>', {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const parsedHtml = await safeParseApiJson(htmlResponse);
  assert.equal(parsedHtml, null);

  const jsonResponse = new Response(JSON.stringify({ token: 'abc', ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const parsedJson = await safeParseApiJson<{ token: string; ok: boolean }>(jsonResponse);
  assert.deepEqual(parsedJson, { token: 'abc', ok: true });
});

test('QuickAuth: buildLocalQuickSession creates deterministic student session', () => {
  const session = buildLocalQuickSession({
    firstName: 'Billel',
    lastName: 'Anisse',
    uiLang: 'ar',
    goalMinutes: 10,
    learningReason: 'university',
  });
  assert.equal(session.dashboard.profile.displayName, 'Billel Anisse');
  assert.equal(session.dashboard.profile.firstName, 'Billel');
  assert.equal(session.dashboard.profile.lastName, 'Anisse');
  assert.equal(session.dashboard.profile.uiLang, 'ar');
  assert.equal(session.token.startsWith('local_token_'), true);
});
