/**
 * @module Common — API Constraints
 * @description Shared HTTP status codes and error messages used across all API modules.
 *
 *   Import in specs and test data:
 *     import { HTTP_STATUS, ERROR_MESSAGE } from '../../constants/api/common.api.constraints';
 */

/** Standard HTTP status codes. */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
};

/** Standard HTTP error messages. */
export const ERROR_MESSAGE = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  NOT_FOUND: 'Not Found',
  FORBIDDEN: 'Forbidden',
  METHOD_NOT_ALLOWED: 'Method Not Allowed',
  BAD_CREDENTIALS: 'Bad credentials',
};
