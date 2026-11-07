import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString('base64');
const escapeUrl = moduleUrl(await readFile(new URL('../src/utils/escapeHtml.ts', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../src/components/Countdown.ts', import.meta.url), 'utf8')).replace('../utils/escapeHtml', escapeUrl);
const { calculateWeddingCountdown, renderMainCountdownMarkup, renderCoverCountdownMarkup } = await import(moduleUrl(source));
const config = { date: { isoDate: '2026-12-18', displayDate: '18 de diciembre de 2026', timezone: 'America/Tegucigalpa' }, time: { hour: '5:00', meridiem: 'PM' } };
const at = date => calculateWeddingCountdown(config, new Date(date));
const parts = result => [result.daysRemaining, result.hoursRemaining, result.minutesRemaining, result.secondsRemaining];
assert.deepEqual(parts(at('2026-11-07T23:00:00Z')), [41, 0, 0, 0]);
assert.deepEqual(parts(at('2026-11-07T23:00:01Z')), [40, 23, 59, 59]);
assert.deepEqual(parts(at('2026-12-18T22:59:59Z')), [0, 0, 0, 1]);
assert.equal(at('2026-12-18T22:59:59Z').status, 'upcoming');
assert.equal(at('2026-12-18T23:00:00Z').status, 'today');
assert.deepEqual(parts(at('2026-12-19T06:00:00Z')), [0, 0, 0, 0]);
assert.equal(at('2026-12-19T06:00:00Z').status, 'past');
assert.deepEqual(parts(calculateWeddingCountdown({ ...config, time: { hour: '12:00', meridiem: 'AM' } }, new Date('2026-12-18T05:59:59Z'))), [0, 0, 0, 1]);
assert.deepEqual(parts(calculateWeddingCountdown({ ...config, time: { hour: '12:00', meridiem: 'PM' } }, new Date('2026-12-18T17:59:59Z'))), [0, 0, 0, 1]);
for (const markup of [renderMainCountdownMarkup(at('2026-11-07T23:00:01Z')), renderCoverCountdownMarkup(config, at('2026-11-07T23:00:01Z'))]) {
  for (const label of ['Días', 'Horas', 'Minutos', 'Segundos']) assert.ok(markup.includes(label));
  assert.ok(markup.includes('aria-live="off"'));
}
console.log('OK: countdown ticks, Honduras timezone, AM/PM, wedding start, past dates and both displays.');
