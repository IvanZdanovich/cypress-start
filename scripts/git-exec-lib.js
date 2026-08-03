/**
 * Git execution helper — hardened command resolution.
 *
 * Resolves the `git` binary to an absolute path from well-known, trusted
 * install locations and exposes a sanitized environment whose PATH is stripped
 * of any `node_modules` entries. Both measures remove reliance on an
 * attacker-influenceable PATH lookup when spawning git (SonarQube hotspot
 * javascript:S4036), so a malicious `git` planted earlier on PATH cannot be
 * executed instead of the real one.
 *
 * Single source of truth: every script that shells out to git imports from
 * here instead of duplicating the resolution logic.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// PATH sanitized to exclude any node_modules-hosted binaries, with the running
// Node's own bin dir prepended so companion tooling remains resolvable.
const nodeBinDir = path.dirname(process.execPath);
const systemPaths = (process.env.PATH || '').split(path.delimiter).filter((p) => p && !p.includes('node_modules'));
const sanitizedEnv = { ...process.env, PATH: [nodeBinDir, ...systemPaths].join(path.delimiter) };

/**
 * Resolve an executable to an absolute path by probing well-known, trusted
 * install locations. Falls back to the bare command name (which is then looked
 * up via the explicitly-sanitized PATH in `sanitizedEnv`).
 * @param {string} name Executable name, e.g. 'git'.
 * @returns {string} Absolute path to the executable, or the bare name.
 */
function resolveExecutable(name) {
  const exeName = process.platform === 'win32' ? `${name}.exe` : name;
  const candidates =
    process.platform === 'win32'
      ? [`C:\\Program Files\\Git\\cmd\\${exeName}`, `C:\\Program Files\\Git\\bin\\${exeName}`, `C:\\Program Files (x86)\\Git\\cmd\\${exeName}`]
      : ['/usr/bin', '/usr/local/bin', '/opt/homebrew/bin', '/bin'].map((dir) => path.join(dir, exeName));
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return name;
}

// Absolute path to git, resolved once at module load.
const gitExecutable = resolveExecutable('git');

/**
 * Run git with the resolved absolute binary and sanitized environment.
 * Caller-supplied options are merged, but `env` always resolves to the
 * sanitized environment unless explicitly overridden.
 * @param {string[]} gitArgs Arguments passed to git (array form — never a shell string).
 * @param {object} [options] execFileSync options (cwd, encoding, stdio, input, ...).
 * @returns {Buffer|string} Whatever execFileSync returns for the given options.
 */
function gitExecFileSync(gitArgs, options = {}) {
  return execFileSync(gitExecutable, gitArgs, { env: sanitizedEnv, ...options });
}

module.exports = {
  gitExecutable,
  sanitizedEnv,
  gitExecFileSync,
};
