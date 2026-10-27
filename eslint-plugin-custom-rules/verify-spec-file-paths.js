const path = require('path');
const { walkCached } = require('./_scan-cache.js');

/**
 * ESLint rule: verify-spec-file-paths
 *
 * Every file under `cypress/integration/` and `cypress/e2e/` must sit in the folder that matches its spec type and
 * carry the matching extension, so that the Cypress `specPattern` (see `config/cypress.base.config.js`) picks it up:
 *
 *   - cypress/integration/api/**  →  <name>.api.spec.js
 *   - cypress/integration/ui/**   →  <name>.ui.spec.js
 *   - cypress/e2e/ui/**           →  <name>.ui.spec.js
 *
 * Exclusions:
 *   - Files ending with `.spec.skip.js` are intentionally disabled specs and are allowed anywhere inside the roots.
 *   - Hidden files (e.g. `.DS_Store`, `.gitkeep`) are ignored.
 *
 * Linted `.js` files are validated directly. Files ESLint never lints (non-`.js` files such as `.ts`, `.json`, `.md`)
 * are discovered by a cached directory scan and reported on the first linted `.js` file (sorted by path) inside the
 * roots, so each one is reported exactly once per lint run.
 *
 * Invalid examples:
 *   cypress/integration/ui/audit.api.spec.js      — API spec in the UI folder
 *   cypress/integration/api/audit.spec.js         — missing `.api` type segment
 *   cypress/e2e/ui/audit-flow.ui.spec.skip.js    — unsupported extension
 *   cypress/integration/audit.ui.spec.js          — file outside a type folder
 *   cypress/integration/ui/notes.md               — non-spec file
 *
 * Valid examples:
 *   cypress/integration/api/audits/audit.api.spec.js
 *   cypress/integration/ui/audit.ui.spec.js
 *   cypress/e2e/ui/audit-flow.ui.spec.js
 *   cypress/e2e/ui/audit-flow.ui.spec.skip.js
 */

const SKIP_SUFFIX = '.spec.skip.js';

/** Allowed `<root>/<typeFolder>` locations and the extension required inside each (nested folders allowed). */
const LOCATIONS = [
  { dir: 'cypress/integration/api', extension: '.api.spec.js' },
  { dir: 'cypress/integration/ui', extension: '.ui.spec.js' },
  { dir: 'cypress/e2e/ui', extension: '.ui.spec.js' },
];

const ROOTS = ['cypress/integration', 'cypress/e2e'];

/** @type {{paths: string[]|null, dirMtimes: Map<string, number>|null}} */
const fileListState = { paths: null, dirMtimes: null };

const toPosix = (p) => p.split(path.sep).join('/');

const isHidden = (relPath) => path.posix.basename(relPath).startsWith('.');

const isUnderRoot = (relPath) => ROOTS.some((root) => relPath.startsWith(`${root}/`));

/**
 * @param {string} relPath POSIX path relative to the workspace root.
 * @returns {string|null} Error message, or null when the path is valid.
 */
function validate(relPath) {
  const fileName = path.posix.basename(relPath);

  if (fileName.endsWith(SKIP_SUFFIX)) {
    return null;
  }

  const location = LOCATIONS.find(({ dir }) => relPath.startsWith(`${dir}/`));
  if (!location) {
    const allowed = LOCATIONS.map(({ dir, extension }) => `${dir}/**/*${extension}`).join(', ');
    return `File "${relPath}" is in an unsupported folder. Allowed: ${allowed} (or *${SKIP_SUFFIX}).`;
  }

  const stem = fileName.slice(0, -location.extension.length);
  if (!fileName.endsWith(location.extension) || stem.length === 0 || stem.endsWith('.')) {
    return `File "${relPath}" must use the "${location.extension}" extension in "${location.dir}/" (or "${SKIP_SUFFIX}" to disable it).`;
  }

  return null;
}

/**
 * Validate every file under the roots, independent of which files ESLint lints.
 * The pre-commit hook lints only staged JS files, so it calls this directly to
 * catch a misplaced or non-spec file in any commit.
 * @param {string} cwd Workspace root.
 * @returns {string[]} One message per invalid file, sorted by path.
 */
function findInvalidSpecPaths(cwd) {
  return walkCached(
    fileListState,
    ROOTS.map((root) => path.join(cwd, root)),
    (name) => !name.startsWith('.'),
  )
    .map((abs) => toPosix(path.relative(cwd, abs)))
    .toSorted((a, b) => a.localeCompare(b))
    .map(validate)
    .filter(Boolean);
}

module.exports = {
  findInvalidSpecPaths,
  meta: {
    type: 'problem',
    docs: {
      description: 'Files in cypress/integration and cypress/e2e must use the extension matching their folder (*.api.spec.js, *.ui.spec.js); *.spec.skip.js is excluded',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    const cwd = context.cwd || context.getCwd?.() || process.cwd();
    const filename = context.filename || context.getFilename?.();
    if (!filename) {
      return {};
    }

    const relPath = toPosix(path.relative(cwd, filename));
    if (!isUnderRoot(relPath) || isHidden(relPath)) {
      return {};
    }

    return {
      Program(node) {
        const ownError = validate(relPath);
        if (ownError) {
          context.report({ node, message: ownError });
        }

        const allFiles = walkCached(
          fileListState,
          ROOTS.map((root) => path.join(cwd, root)),
          (name) => !name.startsWith('.'),
        )
          .map((abs) => toPosix(path.relative(cwd, abs)))
          .sort((a, b) => a.localeCompare(b));

        // Report files ESLint never lints only once — on the first linted .js file in the roots.
        const anchor = allFiles.find((p) => p.endsWith('.js'));
        if (anchor !== relPath) {
          return;
        }

        allFiles
          .filter((p) => !p.endsWith('.js'))
          .map(validate)
          .filter(Boolean)
          .forEach((message) => context.report({ node, message }));
      },
    };
  },
};
