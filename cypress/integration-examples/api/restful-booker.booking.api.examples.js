import { LONG_STAY_MIN_DAYS, PRICE, REQUIRED_FIELDS } from '../../constants/api/rb.booking.api.constraints';

const namePrefix = `RbBk_${utils.generateRandomString(6)}_`;

// Shared with partialCheckinOnly, which keeps the maximalPrice checkout.
const _maximalPriceDates = { checkin: utils.getFutureDate(10), checkout: utils.getFutureDate(12) };
const _withAllFieldsDates = { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) };
const _partialCheckinDate = utils.getFutureDate(8);
const _partialCheckoutDate = utils.getFutureDate(30);

// One missing-booking ID shared by every test that targets a non-existing booking.
const _nonExistingId = utils.getRandomElement([999999, 888888, 777777]);

// Single-field partial update; each candidate states its request key and API response key.
const _partialField = utils.getRandomElement([
  { name: 'firstname', apiFieldName: 'firstname', value: `${namePrefix}${utils.generateRandomString(4)}` },
  { name: 'lastname', apiFieldName: 'lastname', value: `${namePrefix}${utils.generateRandomString(6)}` },
  { name: 'totalPrice', apiFieldName: 'totalprice', value: utils.getRandomNumber(300, 700) },
  { name: 'additionalNeeds', apiFieldName: 'additionalneeds', value: 'Partial update test' },
]);

// removeProperty clones internally and handles dotted paths such as 'bookingDates.checkin'.
const _missingRequiredFieldName = utils.getRandomElement(REQUIRED_FIELDS);

// The optional additionalNeeds may be dropped by the API instead of stored empty.
const _emptyStringField = utils.getRandomElement([
  { name: 'firstname', apiFieldName: 'firstname', expectedValues: [''] },
  { name: 'lastname', apiFieldName: 'lastname', expectedValues: [''] },
  { name: 'additionalNeeds', apiFieldName: 'additionalneeds', expectedValues: ['', undefined, null] },
]);

const validBookings = {
  withAllFields: {
    bookingId: undefined,
    firstname: `${namePrefix}${utils.generateRandomString(4)}`,
    lastname: `${namePrefix}${utils.generateRandomString(6)}`,
    totalPrice: utils.getRandomNumber(100, 1000),
    depositPaid: true,
    bookingDates: _withAllFieldsDates,
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
  // API accepts zero price as valid (promotional bookings).
  zeroPrice: {
    bookingId: undefined,
    firstname: `${namePrefix}${utils.generateRandomString(4)}`,
    lastname: `${namePrefix}${utils.generateRandomString(6)}`,
    totalPrice: PRICE.ZERO,
    depositPaid: true,
    bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
    additionalNeeds: 'Promotional offer',
  },
};

const invalidBookings = {
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

  emptyStringField: {
    name: _emptyStringField.name,
    apiFieldName: _emptyStringField.apiFieldName,
    expectedValues: _emptyStringField.expectedValues,
    data: {
      bookingId: undefined,
      firstname: `${namePrefix}${utils.generateRandomString(4)}`,
      lastname: `${namePrefix}${utils.generateRandomString(6)}`,
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: { checkin: utils.getFutureDate(7), checkout: utils.getFutureDate(14) },
      additionalNeeds: null,
      [_emptyStringField.name]: '',
    },
  },
};

const invalidCredentials = {
  username: 'invalid_user',
  password: 'invalid_password',
};

const updates = {
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
  partialField: {
    name: _partialField.name,
    value: _partialField.value,
    apiFieldName: _partialField.apiFieldName,
    updateData: { [_partialField.name]: _partialField.value },
  },
  partialForNonExistingId: {
    firstname: `${namePrefix}${utils.generateRandomString(4)}`,
  },
};

const filters = {
  byDateRange: _withAllFieldsDates,
  nonExisting: {
    firstname: `${namePrefix}${utils.generateRandomString(15)}`,
    lastname: `${namePrefix}${utils.generateRandomString(15)}`,
  },
};

const invalidIds = {
  nonExistingId: _nonExistingId,
  stringId: 'not_a_number',
  negativeId: -1,
  zeroId: 0,
  floatId: 123.456,
  specialId: 'abc@123',
};

const auth = { token: undefined };

const invalidToken = 'invalid_token';

const noFail = { failOnStatusCode: false };

// Adds the runtime token as a getter on the request, keeping the request's own getters intact.
const authorized = (request) => Object.defineProperty(request, 'token', { get: () => auth.token, enumerable: true });

export const booking__examples = {
  namePrefix,
  auth,
  validBookings,
  invalidBookings,
  invalidCredentials,
  invalidToken,
  updates,
  filters,
  invalidIds,

  authRequests: {
    invalidCredentials: { body: invalidCredentials, restOptions: noFail },
  },

  createRequests: {
    withAllFields: { body: validBookings.withAllFields },
    withoutAdditionalNeeds: { body: validBookings.withoutAdditionalNeeds },
    minimalPrice: { body: validBookings.minimalPrice },
    maximalPrice: { body: validBookings.maximalPrice },
    sameDayCheckout: { body: validBookings.sameDayCheckout },
    longStay: { body: validBookings.longStay },
    depositNotPaid: { body: validBookings.depositNotPaid },
    zeroPrice: { body: validBookings.zeroPrice },
    missingRequiredField: { body: invalidBookings.missingRequiredField.data, restOptions: noFail },
    priceAsString: { body: invalidBookings.priceAsString, restOptions: noFail },
    depositAsString: { body: invalidBookings.depositAsString, restOptions: noFail },
    firstnameAsNumber: { body: invalidBookings.firstnameAsNumber, restOptions: noFail },
    lastnameAsBoolean: { body: invalidBookings.lastnameAsBoolean, restOptions: noFail },
    negativePrice: { body: invalidBookings.negativePrice, restOptions: noFail },
    invalidDateFormat: { body: invalidBookings.invalidDateFormat, restOptions: noFail },
    checkoutBeforeCheckin: { body: invalidBookings.checkoutBeforeCheckin },
    emptyStringField: { body: invalidBookings.emptyStringField.data, restOptions: noFail },
  },

  listRequests: {
    all: {},
    byFirstname: { qs: { firstname: validBookings.withAllFields.firstname } },
    byLastname: { qs: { lastname: validBookings.withAllFields.lastname } },
    byFullName: { qs: { firstname: validBookings.withAllFields.firstname, lastname: validBookings.withAllFields.lastname } },
    byDateRange: { qs: filters.byDateRange },
    byNonExistingName: { qs: filters.nonExisting },
  },

  retrieveRequests: {
    withAllFields: {
      get bookingId() {
        return validBookings.withAllFields.bookingId;
      },
    },
    sameDayCheckout: {
      get bookingId() {
        return validBookings.sameDayCheckout.bookingId;
      },
      restOptions: noFail,
    },
    nonExistingId: { bookingId: invalidIds.nonExistingId, restOptions: noFail },
    stringId: { bookingId: invalidIds.stringId, restOptions: noFail },
    negativeId: { bookingId: invalidIds.negativeId, restOptions: noFail },
    zeroId: { bookingId: invalidIds.zeroId, restOptions: noFail },
    floatId: { bookingId: invalidIds.floatId, restOptions: noFail },
    specialId: { bookingId: invalidIds.specialId, restOptions: noFail },
  },

  updateRequests: {
    full: authorized({
      get bookingId() {
        return validBookings.withAllFields.bookingId;
      },
      body: updates.full,
    }),
    withoutAuthentication: {
      token: invalidToken,
      get bookingId() {
        return validBookings.withoutAdditionalNeeds.bookingId;
      },
      body: updates.full,
      restOptions: noFail,
    },
    nonExistingId: authorized({
      bookingId: invalidIds.nonExistingId,
      body: updates.full,
      restOptions: noFail,
    }),
  },

  partialUpdateRequests: {
    singleField: authorized({
      get bookingId() {
        return validBookings.minimalPrice.bookingId;
      },
      body: updates.partialField.updateData,
    }),
    checkinOnly: authorized({
      get bookingId() {
        return validBookings.maximalPrice.bookingId;
      },
      body: updates.partialCheckinOnly,
    }),
    checkoutOnly: authorized({
      get bookingId() {
        return validBookings.maximalPrice.bookingId;
      },
      body: updates.partialCheckoutOnly,
    }),
    multipleFields: authorized({
      get bookingId() {
        return validBookings.longStay.bookingId;
      },
      body: updates.partialMultipleFields,
    }),
    withoutAuthentication: {
      token: invalidToken,
      get bookingId() {
        return validBookings.depositNotPaid.bookingId;
      },
      body: updates.partialMultipleFields,
      restOptions: noFail,
    },
    nonExistingId: authorized({
      bookingId: invalidIds.nonExistingId,
      body: updates.partialForNonExistingId,
      restOptions: noFail,
    }),
  },

  deleteRequests: {
    sameDayCheckout: authorized({
      get bookingId() {
        return validBookings.sameDayCheckout.bookingId;
      },
    }),
    withoutAuthentication: {
      token: invalidToken,
      get bookingId() {
        return validBookings.withAllFields.bookingId;
      },
      restOptions: noFail,
    },
    nonExistingId: authorized({
      bookingId: invalidIds.nonExistingId,
      restOptions: noFail,
    }),
  },
};
