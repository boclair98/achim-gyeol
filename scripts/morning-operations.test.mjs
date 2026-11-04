import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = (await readFile(new URL('../.github/workflows/morning-briefing.yml', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const step = name => {
  const marker = `      - name: ${name}\n`;
  const start = workflow.indexOf(marker);
  assert.ok(start >= 0, `Missing step: ${name}`);
  const end = workflow.indexOf('\n      - name:', start + marker.length);
  return workflow.slice(start, end < 0 ? undefined : end);
};

test('regeneration-only is an explicit operation, separate from broadcast', () => {
  assert.match(workflow, /- regenerate-only\s/);
  const generation = step('Wake service and run morning operation');
  assert.match(generation, /OPERATION" == "regenerate-only" \|\| "\$OPERATION" == "regenerate-all"/);
  const regenerate = generation.slice(generation.indexOf('elif [[ "$OPERATION" == "regenerate-only"'), generation.indexOf('elif [[ "$OPERATION" == "generate"'));
  assert.match(regenerate, /\/api\/admin\/briefings\/regenerate"/);
  assert.doesNotMatch(regenerate, /dispatch|--retry/);
});

test('only explicitly selected broadcast operations can fan out', () => {
  const forced = step('Dispatch regenerated briefing to every active device');
  assert.match(forced, /if: steps\.operation\.outputs\.operation == 'regenerate-all'\n/);
  assert.doesNotMatch(forced, /regenerate-only/);
  const regular = step('Dispatch after recovered generation');
  assert.match(regular, /if: steps\.operation\.outputs\.operation == 'run'\n/);
  assert.doesNotMatch(regular, /regenerate-only/);
});

test('forced regeneration waits for its new result, not the previous ready edition', () => {
  const wait = step('Wait for AI briefing generation');
  assert.match(wait, /outputs\.operation == 'regenerate-only'/);
  const start = wait.indexOf('if [[ "$OPERATION" == "regenerate-only"');
  const forceBranch = wait.slice(start, wait.indexOf('\n            stories=', start));
  assert.match(forceBranch, /state" == "FAILED"/);
  assert.match(forceBranch, /state" == "COMPLETED"/);
  assert.match(forceBranch, /result_date" == "\$today"/);
});

test('scheduled delivery remains weekday-only at 07:30 and manual preview is not final delivery', () => {
  assert.match(workflow, /- cron: "15 21 \* \* 0-4"/);
  assert.match(workflow, /07:30:00/);
  const operation = step('Choose operation');
  assert.match(operation, /if \[\[ "\$REQUESTED_OPERATION" == "run" \]\]; then\s+final_delivery=true\s+else\s+final_delivery=false/);
});
