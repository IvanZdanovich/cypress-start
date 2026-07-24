import { LONG_STAY_MIN_DAYS, PRICE, REQUIRED_FIELDS } from '../../constants/api/rb.booking.api.constraints';

const namePrefix = `RbBk_${utils.generateRandomString(6)}_`;

// Shared date values extracted so partial-update payloads can reference maximalPrice dates.
const _maximalPriceDates = { checkin: utils.getFutureDate(10), checkout: utils.getFutureDate(12) };
const _partialCheckinDate = utils.getFutureDate(8);
const _partialCheckoutDate = utils.getFutureDate(30);

// Pre-selected non-existing ID so all tests targeting a missing booking use the same consistent value.
const _nonExistingId = utils.getRandomElement([999999, 888888, 777777]);

// Pre-computed single-field partial update so the spec needs no inline random selection.
const _partialFieldChoices = {
  firstname: `${namePrefix}${utils.generateRandomString(4)}`,
  lastname: `${namePrefix}${utils.generateRandomString(6)}`,
  totalPrice: utils.getRandomNumber(300, 700),
  additionalNeeds: 'Partial update test',
};
const [_partialFieldName, _partialFieldValue] = utils.getRandomEntry(_partialFieldChoices);

// Pre-selected required field so the spec needs no inline random selection.
// removeProperty clones internally and handles dotted paths (e.g. 'bookingDates.checkin').
const _missingRequiredFieldName = utils.getRandomElement(REQUIRED_FIELDS);

// Pre-selected empty-string field so the spec needs no inline random selection.
const _emptyStringFieldName = utils.getRandomElement(['firstname', 'lastname', 'additionalNeeds']);

export const booking__examples = {
  namePrefix,

  validBookings: {
    withAllFields: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 1000),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: 'Breakfast',
    },
    withoutAdditionalNeeds: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 1000),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
    },
    minimalPrice: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: PRICE.MIN,
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(3), checkout: utils.getFutureDate(5) },
      additionalNeeds: 'None',
    },
    maximalPrice: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: PRICE.MAX,
      depositPaid: true,
      bookingDates: _maximalPriceDates,
      additionalNeeds: 'VIP Suite',
    },
    sameDayCheckout: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(50, 200),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(5), checkout: utils.getFutureDate(5) },
      additionalNeeds: 'Day use only',
    },
    longStay: {
      bookingId: undefined,
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
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: false,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: 'Payment on arrival',
    },
    // API accepts zero price as valid (promotional bookings) — see BUG-BOOKING-004
    zeroPrice: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: PRICE.ZERO,
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: 'Promotional offer',
    },
  },

  invalidBookings: {
    // Pre-selected required field removed; full payload composed inline so the case is fully visible.
    missingRequiredField: {
      name: _missingRequiredFieldName,
      data: utils.removeProperty(
        {
          bookingId: undefined,
          firstname: `${namePrefix}${utils.generateRandomString(4)}`,
          lastname: `${namePrefix}${utils.generateRandomString(6)}`,
          totalPrice: utils.getRandomNumber(100, 500),
          depositPaid: true,
          bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
          additionalNeeds: null,
        },
        _missingRequiredFieldName,
      ),
    },

    priceAsString: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: 'not_a_number',
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    depositAsString: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: 'yes',
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    firstnameAsNumber: {
      bookingId: undefined,
      firstname: 12345,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    lastnameAsBoolean: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: true,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    negativePrice: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: -PRICE.MAX,
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
    },
    invalidDateFormat: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      // DD-MM-YYYY rather than DATE_FORMAT (YYYY-MM-DD)
      bookingDates: { checkin: '01-12-2027', checkout: '15-12-2027' },
      additionalNeeds: null,
    },
    checkoutBeforeCheckin: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(14), checkout: utils.getFutureDate(7) },
      additionalNeeds: null,
    },

    // Pre-selected empty-string field; full payload composed inline so the case is fully visible.
    emptyStringField: {
      name: _emptyStringFieldName,
      data: {
        bookingId: undefined,
        firstname: `${namePrefix}${utils.generateRandomString(4)}`,
        lastname: `${namePrefix}${utils.generateRandomString(6)}`,
        totalPrice: utils.getRandomNumber(100, 500),
        depositPaid: true,
        bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
        additionalNeeds: null,
        [_emptyStringFieldName]: '',
      },
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
    // checkout kept equal to the maximalPrice booking checkout so only the checkin is updated.
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
      firstname: `${namePrefix}${utils.generateRandomString(15)}`,
      lastname: `${namePrefix}${utils.generateRandomString(15)}`,
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
