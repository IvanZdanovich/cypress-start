/**
 * Test Data for RestfulBooker Booking API
 *
 * Conventions:
 * - Container keys carry entity + validity (validBookings, invalidBookings).
 * - Instance keys describe the single distinguishing intent (e.g. minimalPrice, lastnameAsBoolean).
 * - bookingId placeholders are assigned immediately after creation in the spec.
 * - Boundary values come from constraints (PRICE, LONG_STAY_MIN_DAYS, REQUIRED_FIELDS).
 * - namePrefix scopes generated names so cleanup can target only this run.
 */

import { PRICE, LONG_STAY_MIN_DAYS, REQUIRED_FIELDS } from '../../constants/api/rb.booking.api.constraints';

const namePrefix = `RbBk_${utils.generateRandomString(6)}_`;
const taggedFirstname = () => `${namePrefix}${utils.generateRandomString(4)}`;
const taggedLastname = () => `${namePrefix}${utils.generateRandomString(6)}`;

const baseDates = () => ({
  checkin: utils.getFutureDate(7),
  checkout: utils.getFutureDate(14),
});

export const booking__examples = {
  namePrefix,

  validBookings: {
    withAllFields: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(100, 1000),
      depositPaid: true,
      bookingDates: baseDates(),
      additionalNeeds: 'Breakfast',
    },
    withoutAdditionalNeeds: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(100, 1000),
      depositPaid: true,
      bookingDates: baseDates(),
    },
    minimalPrice: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: PRICE.MIN,
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(3), checkout: utils.getFutureDate(5) },
      additionalNeeds: 'None',
    },
    maximalPrice: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: PRICE.MAX,
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(10), checkout: utils.getFutureDate(12) },
      additionalNeeds: 'VIP Suite',
    },
    sameDayCheckout: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(50, 200),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(5), checkout: utils.getFutureDate(5) },
      additionalNeeds: 'Day use only',
    },
    longStay: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(5000, 10000),
      depositPaid: false,
      bookingDates: {
        checkin: utils.getFutureDate(30),
        checkout: utils.getFutureDate(30 + LONG_STAY_MIN_DAYS),
      },
      additionalNeeds: 'Extended stay discount',
    },
    depositNotPaid: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: false,
      bookingDates: baseDates(),
      additionalNeeds: 'Payment on arrival',
    },
    // API accepts zero price as valid (promotional bookings) — see BUG-BOOKING-004
    zeroPrice: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: PRICE.ZERO,
      depositPaid: true,
      bookingDates: baseDates(),
      additionalNeeds: 'Promotional offer',
    },
  },

  invalidBookings: {
    // Base payload used to derive missing-required-field permutations.
    missingRequiredBase: {
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: baseDates(),
      additionalNeeds: null,
    },
    requiredFieldChoices: REQUIRED_FIELDS,

    priceAsString: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: 'not_a_number',
      depositPaid: true,
      bookingDates: baseDates(),
      additionalNeeds: null,
    },
    depositAsString: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: 'yes',
      bookingDates: baseDates(),
      additionalNeeds: null,
    },
    firstnameAsNumber: {
      firstname: 12345,
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: baseDates(),
      additionalNeeds: null,
    },
    lastnameAsBoolean: {
      firstname: taggedFirstname(),
      lastname: true,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: baseDates(),
      additionalNeeds: null,
    },
    negativePrice: {
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: -PRICE.MAX,
      depositPaid: true,
      bookingDates: baseDates(),
      additionalNeeds: null,
    },
    invalidDateFormat: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      // DD-MM-YYYY rather than DATE_FORMAT (YYYY-MM-DD)
      bookingDates: { checkin: '01-12-2025', checkout: '15-12-2025' },
      additionalNeeds: null,
    },
    checkoutBeforeCheckin: {
      bookingId: String,
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(14), checkout: utils.getFutureDate(7) },
      additionalNeeds: null,
    },

    // Base payload used to derive empty-string-field permutations.
    emptyStringBase: {
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: baseDates(),
      additionalNeeds: null,
    },
    emptyStringFieldChoices: ['firstname', 'lastname', 'additionalNeeds'],
  },

  invalidCredentials: {
    username: 'invalid_user',
    password: 'invalid_password',
  },

  updates: {
    full: {
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(200, 800),
      depositPaid: false,
      bookingDates: { checkin: utils.getFutureDate(20), checkout: utils.getFutureDate(25) },
      additionalNeeds: 'Updated requirements',
    },
    partialMultipleFields: {
      firstname: taggedFirstname(),
      totalPrice: utils.getRandomNumber(150, 350),
      depositPaid: true,
      additionalNeeds: 'Multiple fields update',
    },
    partialCheckinOnly: {
      bookingDates: { checkin: utils.getFutureDate(15) },
    },
    partialCheckoutOnly: {
      bookingDates: { checkout: utils.getFutureDate(30) },
    },
    // Pool of single-field changes; spec picks one at random.
    partialFieldChoices: {
      firstname: taggedFirstname(),
      lastname: taggedLastname(),
      totalPrice: utils.getRandomNumber(300, 700),
      additionalNeeds: 'Partial update test',
    },
  },

  filters: {
    byDateRange: baseDates(),
    nonExisting: {
      firstname: utils.generateRandomString(15),
      lastname: utils.generateRandomString(15),
    },
  },

  nonExistingIds: [999999, 888888, 777777],
  invalidIds: {
    stringId: 'not_a_number',
    negativeId: -1,
    zeroId: 0,
    floatId: 123.456,
    specialId: 'abc@123',
  },
};

