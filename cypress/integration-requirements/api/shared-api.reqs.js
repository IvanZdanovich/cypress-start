/**
 * @module shared
 * @description Shared constants imported by *.reqs.js module files.
 *   Import only the names your module uses — tree-shake the rest.
 *
 * @example
 *   import { HTTP_STATUS, HTTP_BODY, HTTP_METHODS } from './shared-api.reqs.js';
 *
 *   HTTP_STATUS.OK            // 200
 *   HTTP_BODY.FORBIDDEN       // 'Forbidden'
 *   HTTP_METHODS.POST         // 'POST'
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  SERVER_ERROR: 500,
};

export const HTTP_BODY = {
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  METHOD_NOT_ALLOWED: 'Method Not Allowed',
  SERVER_ERROR: 'Internal Server Error',
  BAD_CREDENTIALS: 'Bad credentials',
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

/** Testing urgency levels. Use in every requirement's `priority` field. */
export const PRIORITY = {
  /** Critical — must be tested before release. */
  P1: 'P1',
  /** Important — should be tested in each release cycle. */
  P2: 'P2',
  /** Nice-to-have — test when capacity allows. */
  P3: 'P3',
};
