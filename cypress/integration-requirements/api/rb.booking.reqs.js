/**
 * @module RestfulBooker.Booking
 * @description Requirements for the RestfulBooker API — Booking module.
 *   Single source of truth for every verifiable rule in the Booking module.
 *   Import in test data and spec files — no build step, always in sync.
 *
 * @owner QA Team
 * @reviewed 2026-04-08
 * @prefix rb
 *
 * @example
 *   import rb from '../../support/requirements/rb.booking.reqs';
 *
 *   rb.create.success.statusCode           // 200
 *   rb.create.success.id                   // 'REQ-RB-010'
 *   rb.create.minimalPrice.minValue        // 1
 *   rb.update.success.preconditions        // ['REQ-RB-001', 'REQ-RB-010']
 *   rb.create.missingRequiredField.bugs    // ['BUG-BOOKING-002']
 */

import { HTTP_BODY, HTTP_METHODS, HTTP_STATUS } from './shared-api.reqs.js';

// ─── Module-level constants ───────────────────────────────────────────────────
// Edit here — every requirement referencing these updates automatically.

/** Price constraints for totalprice validation. */
const PRICE = {
  MIN: 1, // AT_MIN is valid; anything below is rejected (BUG-BOOKING-004: not enforced)
  MAX: 100_000, // AT_MAX is valid
  ZERO: 0, // valid for promotional bookings
};

/** Minimum contiguous stay length (days) for the "long stay" edge case. */
const LONG_STAY_MIN_DAYS = 90;

/** Expected date format for checkin/checkout fields. */
const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Fields required for a valid booking payload.
 * Shared by create.missingRequiredField, create.invalidDataType, create.emptyStringField.
 */
const REQUIRED_FIELDS = ['firstname', 'lastname', 'totalPrice', 'depositPaid', 'bookingDates.checkin', 'bookingDates.checkout'];

// ─── Auth ─────────────────────────────────────────────────────────────────────

const auth = {
  validLogin: {
    id: 'REQ-RB-001',
    rule: 'POST /auth with valid credentials returns 200 OK and a non-empty token string.',
    priority: 'P1',
    method: HTTP_METHODS.POST,
    path: '/auth',
    statusCode: HTTP_STATUS.OK,
  },
  invalidCredentials: {
    id: 'REQ-RB-002',
    rule: `POST /auth with invalid credentials returns ${HTTP_STATUS.OK} OK with body { reason: "${HTTP_BODY.BAD_CREDENTIALS}" }.`,
    priority: 'P1',
    method: HTTP_METHODS.POST,
    path: '/auth',
    statusCode: HTTP_STATUS.OK,
    reason: HTTP_BODY.BAD_CREDENTIALS,
    bugs: ['BUG-AUTH-001'],
  },
};

// ─── Create ───────────────────────────────────────────────────────────────────

const create = {
  success: {
    id: 'REQ-RB-010',
    rule: 'POST /booking with a valid, complete payload returns 200 OK and a numeric bookingid.',
    priority: 'P1',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
  },
  withoutAdditionalNeeds: {
    id: 'REQ-RB-011',
    rule: 'additionalneeds is optional; omitting it still returns 200 OK.',
    priority: 'P2',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
  },
  minimalPrice: {
    id: 'REQ-RB-012',
    rule: `totalprice minimum valid value is ${PRICE.MIN}; booking at that boundary is accepted.`,
    priority: 'P2',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    minValue: PRICE.MIN,
  },
  maximalPrice: {
    id: 'REQ-RB-013',
    rule: `totalprice maximum valid value is ${PRICE.MAX}; booking at that boundary is accepted.`,
    priority: 'P2',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    maxValue: PRICE.MAX,
  },
  sameDayCheckout: {
    id: 'REQ-RB-014',
    rule: 'A booking where checkin equals checkout (same-day checkout) is accepted.',
    priority: 'P2',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
  },
  longStay: {
    id: 'REQ-RB-015',
    rule: `A long stay (≥ ${LONG_STAY_MIN_DAYS} days between checkin and checkout) is accepted.`,
    priority: 'P3',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    minStayDays: LONG_STAY_MIN_DAYS,
  },
  depositNotPaid: {
    id: 'REQ-RB-016',
    rule: 'depositpaid: false is a valid state; booking is accepted.',
    priority: 'P2',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
  },
  missingRequiredField: {
    id: 'REQ-RB-017',
    rule: `POST /booking with a missing required field returns ${HTTP_STATUS.SERVER_ERROR} ${HTTP_BODY.SERVER_ERROR}.`,
    priority: 'P1',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.SERVER_ERROR,
    body: HTTP_BODY.SERVER_ERROR,
    requiredFields: REQUIRED_FIELDS,
    bugs: ['BUG-BOOKING-002'],
  },
  invalidDataType: {
    id: 'REQ-RB-018',
    rule: `POST /booking with coercible invalid types (string price, string deposit) returns ${HTTP_STATUS.OK}; non-coercible types (number firstname, boolean lastname) return ${HTTP_STATUS.SERVER_ERROR}.`,
    priority: 'P1',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCodeCoercible: HTTP_STATUS.OK,
    statusCodeNonCoercible: HTTP_STATUS.SERVER_ERROR,
    affectedFields: REQUIRED_FIELDS,
    bugs: ['BUG-BOOKING-003'],
  },
  negativePrice: {
    id: 'REQ-RB-019',
    rule: `POST /booking with a negative totalprice returns ${HTTP_STATUS.SERVER_ERROR} ${HTTP_BODY.SERVER_ERROR}.`,
    priority: 'P1',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.SERVER_ERROR,
    bugs: ['BUG-BOOKING-004'],
  },
  zeroPrice: {
    id: 'REQ-RB-020',
    rule: `POST /booking with totalprice: ${PRICE.ZERO} is accepted (promotional bookings).`,
    priority: 'P2',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    value: PRICE.ZERO,
  },
  invalidDateFormat: {
    id: 'REQ-RB-021',
    rule: `POST /booking with a date not matching ${DATE_FORMAT} format returns ${HTTP_STATUS.OK} OK.`,
    priority: 'P1',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    expectedFormat: DATE_FORMAT,
    bugs: ['BUG-BOOKING-009'],
  },
  checkoutBeforeCheckin: {
    id: 'REQ-RB-022',
    rule: 'POST /booking with checkout before checkin returns 200 OK (date logic not validated).',
    priority: 'P1',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    bugs: ['BUG-BOOKING-005'],
  },
  emptyStringField: {
    id: 'REQ-RB-023',
    rule: 'POST /booking with an empty string for a required field returns 200 OK.',
    priority: 'P1',
    method: HTTP_METHODS.POST,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    affectedFields: REQUIRED_FIELDS,
    bugs: ['BUG-BOOKING-006'],
  },
};

// ─── Retrieve ─────────────────────────────────────────────────────────────────

const retrieve = {
  allIds: {
    id: 'REQ-RB-030',
    rule: 'GET /booking returns 200 OK with a non-empty array of { bookingid } objects.',
    priority: 'P1',
    method: HTTP_METHODS.GET,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    preconditions: [create.success.id],
  },
  filterByFirstname: {
    id: 'REQ-RB-031',
    rule: 'GET /booking?firstname={value} returns 200 OK and includes only matching bookings.',
    priority: 'P2',
    method: HTTP_METHODS.GET,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    preconditions: [create.success.id],
  },
  filterByLastname: {
    id: 'REQ-RB-032',
    rule: 'GET /booking?lastname={value} returns 200 OK and includes only matching bookings.',
    priority: 'P2',
    method: HTTP_METHODS.GET,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    preconditions: [create.success.id],
  },
  filterByFullName: {
    id: 'REQ-RB-033',
    rule: 'GET /booking?firstname=&lastname= combined filter returns 200 OK and includes only matching bookings.',
    priority: 'P2',
    method: HTTP_METHODS.GET,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
    preconditions: [create.success.id],
  },
  filterByDateRange: {
    id: 'REQ-RB-034',
    rule: 'GET /booking?checkin=&checkout= returns 200 OK with an array response.',
    priority: 'P3',
    method: HTTP_METHODS.GET,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
  },
  filterNoResults: {
    id: 'REQ-RB-035',
    rule: 'GET /booking with a non-existing name filter returns 200 OK with an empty array.',
    priority: 'P2',
    method: HTTP_METHODS.GET,
    path: '/booking',
    statusCode: HTTP_STATUS.OK,
  },
  byExistingId: {
    id: 'REQ-RB-036',
    rule: 'GET /booking/{id} with an existing ID returns 200 OK with the full booking object.',
    priority: 'P1',
    method: HTTP_METHODS.GET,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.OK,
    preconditions: [create.success.id],
  },

  byNonExistingId: {
    id: 'REQ-RB-037',
    rule: `GET /booking/{id} with a non-existing ID returns ${HTTP_STATUS.NOT_FOUND} ${HTTP_BODY.NOT_FOUND}.`,
    priority: 'P1',
    method: HTTP_METHODS.GET,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.NOT_FOUND,
    body: HTTP_BODY.NOT_FOUND,
  },

  byInvalidId: {
    id: 'REQ-RB-038',
    rule: `GET /booking/{id} with invalid ID formats returns ${HTTP_STATUS.NOT_FOUND}; float IDs are truncated and may return ${HTTP_STATUS.OK} or ${HTTP_STATUS.NOT_FOUND}.`,
    priority: 'P2',
    method: HTTP_METHODS.GET,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusCodeFloat: [HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND],
    body: HTTP_BODY.NOT_FOUND,
    bugs: ['BUG-BOOKING-011'],
  },
};

// ─── Update ───────────────────────────────────────────────────────────────────

const update = {
  success: {
    id: 'REQ-RB-040',
    rule: 'PUT /booking/{id} with a valid auth token and complete payload returns 200 OK with the updated booking.',
    priority: 'P1',
    method: HTTP_METHODS.PUT,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.OK,
    preconditions: [auth.validLogin.id, create.success.id],
  },

  unauthorized: {
    id: 'REQ-RB-041',
    rule: `PUT /booking/{id} without a valid auth token returns ${HTTP_STATUS.FORBIDDEN} ${HTTP_BODY.FORBIDDEN}.`,
    priority: 'P1',
    method: HTTP_METHODS.PUT,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.FORBIDDEN,
    body: HTTP_BODY.FORBIDDEN,
    preconditions: [create.success.id],
  },

  nonExistingId: {
    id: 'REQ-RB-042',
    rule: `PUT /booking/{nonExisting} with a valid auth token returns ${HTTP_STATUS.METHOD_NOT_ALLOWED} ${HTTP_BODY.METHOD_NOT_ALLOWED}.`,
    priority: 'P1',
    method: HTTP_METHODS.PUT,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.METHOD_NOT_ALLOWED,
    body: HTTP_BODY.METHOD_NOT_ALLOWED,
    preconditions: [auth.validLogin.id],
    bugs: ['BUG-BOOKING-007'],
  },
};

// ─── Partial Update ───────────────────────────────────────────────────────────

const partialUpdate = {
  singleField: {
    id: 'REQ-RB-050',
    rule: 'PATCH /booking/{id} with a single field and valid auth returns 200 OK; only the specified field changes.',
    priority: 'P1',
    method: HTTP_METHODS.PATCH,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.OK,
    preconditions: [auth.validLogin.id, create.success.id],
  },

  partialDateUpdate: {
    id: 'REQ-RB-051',
    rule: 'PATCH /booking/{id} with only one date field corrupts the other date to "0NaN-aN-aN". Workaround: send both dates.',
    priority: 'P1',
    method: HTTP_METHODS.PATCH,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.OK,
    preconditions: [auth.validLogin.id, create.success.id],
    bugs: ['BUG-BOOKING-010'],
  },

  multipleFields: {
    id: 'REQ-RB-052',
    rule: 'PATCH /booking/{id} with multiple fields and valid auth returns 200 OK; all specified fields change, others are unchanged.',
    priority: 'P1',
    method: HTTP_METHODS.PATCH,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.OK,
    preconditions: [auth.validLogin.id, create.success.id],
  },

  unauthorized: {
    id: 'REQ-RB-053',
    rule: `PATCH /booking/{id} without a valid auth token returns ${HTTP_STATUS.FORBIDDEN} ${HTTP_BODY.FORBIDDEN}.`,
    priority: 'P1',
    method: HTTP_METHODS.PATCH,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.FORBIDDEN,
    body: HTTP_BODY.FORBIDDEN,
    preconditions: [create.success.id],
  },

  nonExistingId: {
    id: 'REQ-RB-054',
    rule: `PATCH /booking/{nonExisting} with a valid auth token returns ${HTTP_STATUS.METHOD_NOT_ALLOWED} ${HTTP_BODY.METHOD_NOT_ALLOWED}.`,
    priority: 'P1',
    method: HTTP_METHODS.PATCH,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.METHOD_NOT_ALLOWED,
    body: HTTP_BODY.METHOD_NOT_ALLOWED,
    preconditions: [auth.validLogin.id],
    bugs: ['BUG-BOOKING-007'],
  },
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const delete_ = {
  success: {
    id: 'REQ-RB-060',
    rule: `DELETE /booking/{id} with a valid auth token returns ${HTTP_STATUS.CREATED} Created and the booking is no longer retrievable.`,
    priority: 'P1',
    method: HTTP_METHODS.DELETE,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.CREATED,
    preconditions: [auth.validLogin.id, create.success.id],
    bugs: ['BUG-BOOKING-008'],
  },
  unauthorized: {
    id: 'REQ-RB-061',
    rule: `DELETE /booking/{id} without a valid auth token returns ${HTTP_STATUS.FORBIDDEN} ${HTTP_BODY.FORBIDDEN}.`,
    priority: 'P1',
    method: HTTP_METHODS.DELETE,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.FORBIDDEN,
    body: HTTP_BODY.FORBIDDEN,
    preconditions: [create.success.id],
  },
  nonExistingId: {
    id: 'REQ-RB-062',
    rule: `DELETE /booking/{nonExisting} with a valid auth token returns ${HTTP_STATUS.METHOD_NOT_ALLOWED} ${HTTP_BODY.METHOD_NOT_ALLOWED}.`,
    priority: 'P1',
    method: HTTP_METHODS.DELETE,
    path: '/booking/{id}',
    statusCode: HTTP_STATUS.METHOD_NOT_ALLOWED,
    body: HTTP_BODY.METHOD_NOT_ALLOWED,
    preconditions: [auth.validLogin.id],
    bugs: ['BUG-BOOKING-007'],
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

export default {
  auth,
  create,
  retrieve,
  update,
  partialUpdate,
  delete: delete_,
};
