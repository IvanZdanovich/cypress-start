/**
 * @module RestfulBooker.Booking — Constraints
 * @description Single source of truth for boundary values and domain constants
 *   used by both spec files and examples files.
 *
 *   Import in specs and test data:
 *     import { PRICE, LONG_STAY_MIN_DAYS, DATE_FORMAT, REQUIRED_FIELDS } from '../../constants/api/rb.booking.api.constraints';
 */

/** Price constraints for totalprice validation. */
export const PRICE = {
  MIN: 1,
  MAX: 100_000,
  ZERO: 0,
};

/** Minimum contiguous stay length (days) for the "long stay" edge case. */
export const LONG_STAY_MIN_DAYS = 90;

/** Expected date format for checkin/checkout fields. */
export const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Fields required for a valid booking payload.
 * Used by missing-field, invalid-type, and empty-string tests.
 */
export const REQUIRED_FIELDS = [
  'firstname',
  'lastname',
  'totalPrice',
  'depositPaid',
  'bookingDates.checkin',
  'bookingDates.checkout',
];

