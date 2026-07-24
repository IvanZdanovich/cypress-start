const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Shared filesystem-scan cache with mtime-based invalidation.
//
// The ESLint plugin is loaded once by long-lived hosts (the JetBrains ESLint
// language service, `eslint --cache` daemons, editor servers). Module-scope
// caches therefore live for the whole IDE session. A plain "compute once" latch
// makes project-wide scans cheap but serves STALE results forever — e.g. an
// example stays flagged as unused after a spec starts using it.
//
// These helpers keep the "pay I/O at most once" benefit while re-validating
// against the filesystem via mtime, so freshly edited/added/removed files are
// picked up without a full rescan.
// ---------------------------------------------------------------------------

/**
 * @param {Map<string, number>} dirMtimes
 * @returns {boolean} true when every recorded directory still has its cached mtime.
 */
function dirsUnchanged(dirMtimes) {
  for (const [dir, mtimeMs] of dirMtimes) {
    let current;
    try {
      current = fs.statSync(dir).mtimeMs;
    } catch {
      return false; // Directory removed
    }
    if (current !== mtimeMs) {
      return false;
    }
  }
  return true;
}

/**
 * Walk `rootDirs` and return every matching file path.
 *
 * The result is cached on the caller-owned `state` object and re-used until any
 * walked directory changes (a file added, removed, or renamed bumps that
 * directory's mtime; new nested directories bump their parent's mtime, so deep
 * changes are detected transitively). Pure content edits do NOT change a
 * directory's mtime — they are handled per-file by {@link readParsedCached}.
 *
 * @param {{paths: string[]|null, dirMtimes: Map<string, number>|null}} state
 * @param {string[]} rootDirs
 * @param {(fileName: string) => boolean} fileFilter
 * @returns {string[]}
 */
function walkCached(state, rootDirs, fileFilter) {
  if (state.paths !== null && state.dirMtimes !== null && dirsUnchanged(state.dirMtimes)) {
    return state.paths;
  }

  const paths = [];
  const dirMtimes = new Map();

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
      dirMtimes.set(dir, fs.statSync(dir).mtimeMs);
    } catch {
      return; // Unreadable directory — skip
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && fileFilter(entry.name)) {
        paths.push(fullPath);
      }
    }
  }

  for (const dir of rootDirs) {
    if (fs.existsSync(dir)) {
      walk(dir);
    }
  }

  state.paths = paths;
  state.dirMtimes = dirMtimes;
  return paths;
}

/**
 * Read and parse a file, caching the parsed value keyed by the file's mtime.
 *
 * When the file is unchanged the cached value is returned with a single `stat`
 * (no re-read, no re-parse). When it changes on disk the entry is rebuilt. An
 * unreadable file caches `null` to avoid repeated failing reads, yet is retried
 * once it becomes readable again (mtime reappears).
 *
 * @template T
 * @param {Map<string, {mtimeMs: number, value: T}>} cache
 * @param {string} filePath
 * @param {(content: string, filePath: string) => T} parse
 * @returns {T|null}
 */
function readParsedCached(cache, filePath, parse) {
  let mtimeMs;
  try {
    mtimeMs = fs.statSync(filePath).mtimeMs;
  } catch {
    cache.delete(filePath);
    return null;
  }

  const cached = cache.get(filePath);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.value;
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    cache.delete(filePath);
    return null;
  }

  const value = parse(content, filePath);
  cache.set(filePath, { mtimeMs, value });
  return value;
}

module.exports = { walkCached, readParsedCached };
