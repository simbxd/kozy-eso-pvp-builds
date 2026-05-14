import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const cache = new Map<string, { publishedDate: string; updatedAt: string }>();

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function runGit(args: string): string {
  try {
    return execSync(`git ${args}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * Returns the git-derived creation and last-modified dates for a source file.
 *
 * publishedDate = date of the first commit that introduced the file
 *   (--diff-filter=A finds the "Added" commit; --follow traces through renames)
 * updatedAt = date of the most recent commit that touched the file
 *
 * Both are returned as YYYY-MM-DD strings.
 *
 * Fallback strategy (shallow clone / git unavailable):
 *   - updatedAt  → today's date  (safe: only fires if git is completely absent)
 *   - publishedDate → updatedAt  (avoids a misleading "today" when history is truncated)
 *
 * On Cloudflare Workers CI (shallow clone, depth=1): updatedAt will be correct
 * (last commit in the shallow history). publishedDate will equal updatedAt because
 * the creation commit is not in the shallow history. To fix publishedDate on CI,
 * add the following pre-build command in the Cloudflare dashboard:
 *   git fetch --unshallow || true
 */
export function getFileDates(filePath: string): { publishedDate: string; updatedAt: string } {
  const key = resolve(filePath);
  if (cache.has(key)) return cache.get(key)!;

  const updatedRaw  = runGit(`log -1 --format=%aI -- "${filePath}"`);
  const updatedAt   = updatedRaw ? updatedRaw.slice(0, 10) : today();

  // git log returns one ISO date per line, oldest last — we want the last line
  const publishedRaw  = runGit(`log --diff-filter=A --follow --format=%aI -- "${filePath}"`);
  const lines         = publishedRaw.split('\n').filter(Boolean);
  const publishedDate = lines.length > 0 ? lines[lines.length - 1].slice(0, 10) : updatedAt;

  const result = { publishedDate, updatedAt };
  cache.set(key, result);
  return result;
}
