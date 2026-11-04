import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Non-interactive Podman/Buildah must not depend on host short-name aliases.
for (const file of ['frontend/Dockerfile', 'backend/Dockerfile']) {
  const text = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const stages = new Set();
  let count = 0;
  for (const line of text.split(/\r?\n/)) {
    const from = line.match(/^\s*FROM\s+(?:--platform=\S+\s+)?(\S+)(?:\s+AS\s+(\S+))?\s*$/i);
    if (!from) continue;
    const [, image, stage] = from;
    if (image.toLowerCase() !== 'scratch' && !stages.has(image.toLowerCase())) {
      const [registry, ...path] = image.split('/');
      assert.ok(
        (registry.includes('.') || registry.includes(':') || registry === 'localhost')
          && path.length >= 2 && /(?::[^/]+|@sha256:[a-f0-9]{64})$/.test(path.at(-1)),
        `${file}: FROM ${image} needs an explicit registry, namespace and tag/digest`,
      );
    }
    if (stage) stages.add(stage.toLowerCase());
    count++;
  }
  assert.ok(count > 0, `${file}: no FROM instructions validated`);
  console.log(`${file}: ${count} explicit base-image references validated`);
}
