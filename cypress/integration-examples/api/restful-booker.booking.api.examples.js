import { PRICE, LONG_STAY_MIN_DAYS, REQUIRED_FIELDS } from '../../constants/api/rb.booking.api.constraints';

const namePrefix = `RbBk_${utils.generateRandomString(6)}_`;

// Shared date values extracted so partial-update payloads can reference maximalPrice dates.
const _maximalPriceDates = { checkin: utils.getFutureDate(10), checkout: utils.getFutureDate(12) };
const _partialCheckinDate = utils.getFutureDate(15);
const _partialCheckoutDate = utils.getFutureDate(30);

// Pre-selected non-existing ID so all tests targeting a missing booking use the same consistent value.
const _nonExistingIds = [999999, 888888, 777777];
const _nonExistingId = utils.getRandomElement(_nonExistingIds);

// Pre-computed single-field partial update so the spec needs no inline random selection.
const _partialFieldChoices = {
  firstname: `${namePrefix}${utils.generateRandomString(4)}`,
  lastname: `${namePrefix}${utils.generateRandomString(6)}`,
  totalPrice: utils.getRandomNumber(300, 700),
  additionalNeeds: 'Partial update test',
};
const [_partialFieldName, _partialFieldValue] = utils.getRandomEntry(_partialFieldChoices);

// Pre-computed missing-required-field booking so the spec needs no inline clone/delete logic.
const _missingRequiredBase = {
  firstname: `${namePrefix}${utils.generateRandomString(4)}`,
  lastname: `${namePrefix}${utils.generateRandomString(6)}`,
  totalPrice: utils.getRandomNumber(100, 500),
  depositPaid: true,
  bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
  additionalNeeds: null,
};
const _missingRequiredFieldName = utils.getRandomElement(REQUIRED_FIELDS);
// removeProperty clones internally and handles dotted paths (e.g. 'bookingDates.checkin').
const _missingRequiredTestData = utils.removeProperty(_missingRequiredBase, _missingRequiredFieldName);

// Pre-computed empty-string booking so the spec needs no inline random selection.const _emptyStringFieldChoices = ['firstname', 'lastname', 'additionalNeeds'];
const _emptyStringBase = {
  firstname: `${namePrefix}${utils.generateRandomString(4)}`,
  lastname: `${namePrefix}${utils.generateRandomString(6)}`,
  totalPrice: utils.getRandomNumber(100, 500),
  depositPaid: true,
  bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
  additionalNeeds: null,
};
const _emptyStringFieldName = utils.getRandomElement(_emptyStringFieldChoices);
const _emptyStringTestData = { ..._emptyStringBase, [_emptyStringFieldName]: '' };

export const booking__examples = {
  namePrefix,

  validBookings: {
    withAllFields: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 1000),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: 'Breakfast',
    },
    withoutAdditionalNeeds: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 1000),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
    },
    minimalPrice: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: PRICE.MIN,
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(3), checkout: utils.getFutureDate(5) },
      additionalNeeds: 'None',
    },
    maximalPrice: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: PRICE.MAX,
      depositPaid: true,
      bookingDates: _maximalPriceDates,
      additionalNeeds: 'VIP Suite',
    },
    sameDayCheckout: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(50, 200),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(5), checkout: utils.getFutureDate(5) },
      additionalNeeds: 'Day use only',
    },
    longStay: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
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
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: false,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: 'Payment on arrival',
    },
    // API accepts zero price as valid (promotional bookings) — see BUG-BOOKING-004
    zeroPrice: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: PRICE.ZERO,
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: 'Promotional offer',
    },
  },

  invalidBookings: {
    // Base payload used to derive missing-required-field permutations.
    missingRequiredBase: _missingRequiredBase,
    requiredFieldChoices: REQUIRED_FIELDS,
    // Pre-selected required field removed + full payload ready to POST directly.
    missingRequiredField: {
      name: _missingRequiredFieldName,
      data: _missingRequiredTestData,
    },

    priceAsString: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: 'not_a_number',
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    depositAsString: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: 'yes',
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    firstnameAsNumber: {
      firstname: 12345,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    lastnameAsBoolean: {
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: true,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    negativePrice: {
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: -PRICE.MAX,
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    invalidDateFormat: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      // DD-MM-YYYY rather than DATE_FORMAT (YYYY-MM-DD)
      bookingDates: { checkin: '01-12-2025', checkout: '15-12-2025' },
      additionalNeeds: null,
    },
    checkoutBeforeCheckin: {
      bookingId: String,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(14), checkout: utils.getFutureDate(7) },
      additionalNeeds: null,
    },

    // Base payload used to derive empty-string-field permutations.
    emptyStringBase: _emptyStringBase,
    emptyStringFieldChoices: _emptyStringFieldChoices,
    // Pre-selected empty-string field + full booking payload ready to POST directly.
    emptyStringField: {
      name: _emptyStringFieldName,
      data: _emptyStringTestData,
    },
  },

  invalidCredentials: {
    username: 'invalid_user',
    password: 'invalid_password',
  },

  updates: {
    full: {
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(200, 800),
      depositPaid: false,
      bookingDates: { checkin: utils.getFutureDate(20), checkout: utils.getFutureDate(25) },
      additionalNeeds: 'Updated requirements',
    },
    partialMultipleFields: {
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      totalPrice: utils.getRandomNumber(150, 350),
      depositPaid: true,
      additionalNeeds: 'Multiple fields update',
    },
    partialCheckinOnly: {
      bookingDates: { checkin: _partialCheckinDate, checkout: _maximalPriceDates.checkout },
    },
    partialCheckoutOnly: {
      bookingDates: { checkin: _partialCheckinDate, checkout: _partialCheckoutDate },
    },
    // Pool of single-field changes; spec picks one at random.
    partialFieldChoices: _partialFieldChoices,
    // Pre-selected single-field change ready to pass directly to PATCH.
    partialField: {
      name: _partialFieldName,
      value: _partialFieldValue,
      updateData: { [_partialFieldName]: _partialFieldValue },
    },
  },

  filters: {
    byDateRange: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
    nonExisting: {
      firstname: utils.generateRandomString(15),
      lastname: utils.generateRandomString(15),
    },
  },

  nonExistingId: _nonExistingId,
  invalidIds: {
    stringId: 'not_a_number',
    negativeId: -1,
    zeroId: 0,
    floatId: 123.456,
    specialId: 'abc@123',
  },
};
