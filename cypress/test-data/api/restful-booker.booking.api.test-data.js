/**
 * Test Data for RestfulBooker Booking API
 *
 * Justifications for value ranges:
 * - totalPrice (1-100,000): Based on real-world hotel pricing:
 *   - Min: Budget hostels start around $10-20/night
 *   - Max: Luxury suites can reach $10,000+/night for extended stays
 *   - Buffer: 10x multiplier for edge case testing
 *
 * - Stay duration (1-365 days):
 *   - Min: 1 day for day-use bookings
 *   - Max: 365 days for extended stay programs, corporate housing
 *
 * - Name length (5-10 chars randomized):
 *   - Ensures uniqueness across test runs
 *   - Matches typical name lengths
 *
 * - Dates: All dates are dynamic and relative to current date
 *   - Prevents tests from failing due to past dates
 *   - Simulates real booking scenarios (future reservations)
 */

// Helper to generate future date
const getFutureDate = (minDays = 1, maxDays = 90) => {
  const today = new Date();
  const daysAhead = utils.getRandomNumber(minDays, maxDays);
  return utils.formatDate(utils.addDays(today, daysAhead));
};

// Helper to generate booking dates with valid stay duration
const generateBookingDates = (minStayDays = 1, maxStayDays = 30) => {
  const checkinDaysAhead = utils.getRandomNumber(1, 60);
  const stayDuration = utils.getRandomNumber(minStayDays, maxStayDays);

  const today = new Date();
  const checkin = utils.addDays(today, checkinDaysAhead);
  const checkout = utils.addDays(checkin, stayDuration);

  return {
    checkin: utils.formatDate(checkin),
    checkout: utils.formatDate(checkout),
  };
};

// Helper to generate random booking
const generateRandomBooking = (overrides = {}) => {
  return {
    firstname: 'User' + utils.generateRandomString(6, 'abcdefghijklmnopqrstuvwxyz'),
    lastname: 'Test' + utils.generateRandomString(6, 'abcdefghijklmnopqrstuvwxyz'),
    totalPrice: utils.getRandomNumber(100, 5000),
    depositPaid: utils.generateRandomBoolean(),
    bookingDates: generateBookingDates(),
    additionalNeeds: utils.getRandomElement(['Breakfast', 'Lunch', 'Dinner', 'All-inclusive', 'Breakfast and Dinner', '']),
    ...overrides,
  };
};

// Helper function to generate random invalid date format
const generateInvalidDateFormat = () => {
  const today = new Date();
  const checkinDaysAhead = utils.getRandomNumber(5, 30);
  const checkoutDaysAhead = checkinDaysAhead + utils.getRandomNumber(5, 15);

  const checkinDate = utils.addDays(today, checkinDaysAhead);
  const checkoutDate = utils.addDays(today, checkoutDaysAhead);

  const year = checkinDate.getFullYear();
  const month = String(checkinDate.getMonth() + 1).padStart(2, '0');
  const day = String(checkinDate.getDate()).padStart(2, '0');

  const checkoutYear = checkoutDate.getFullYear();
  const checkoutMonth = String(checkoutDate.getMonth() + 1).padStart(2, '0');
  const checkoutDay = String(checkoutDate.getDate()).padStart(2, '0');

  // Array of invalid date format generators
  const invalidFormats = [
    // DD-MM-YYYY
    () => ({
      checkin: `${day}-${month}-${year}`,
      checkout: `${checkoutDay}-${checkoutMonth}-${checkoutYear}`,
      formatType: 'DD-MM-YYYY',
    }),
    // MM/DD/YYYY
    () => ({
      checkin: `${month}/${day}/${year}`,
      checkout: `${checkoutMonth}/${checkoutDay}/${checkoutYear}`,
      formatType: 'MM/DD/YYYY',
    }),
    // DD.MM.YYYY
    () => ({
      checkin: `${day}.${month}.${year}`,
      checkout: `${checkoutDay}.${checkoutMonth}.${checkoutYear}`,
      formatType: 'DD.MM.YYYY',
    }),
    // YYYY/MM/DD
    () => ({
      checkin: `${year}/${month}/${day}`,
      checkout: `${checkoutYear}/${checkoutMonth}/${checkoutDay}`,
      formatType: 'YYYY/MM/DD',
    }),
    // Text format
    () => ({
      checkin: checkinDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      checkout: checkoutDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      formatType: 'Text (Month DD, YYYY)',
    }),
    // YYYYMMDD (no separators)
    () => ({
      checkin: `${year}${month}${day}`,
      checkout: `${checkoutYear}${checkoutMonth}${checkoutDay}`,
      formatType: 'YYYYMMDD',
    }),
    // MM-DD-YYYY
    () => ({
      checkin: `${month}-${day}-${year}`,
      checkout: `${checkoutMonth}-${checkoutDay}-${checkoutYear}`,
      formatType: 'MM-DD-YYYY',
    }),
  ];

  return utils.getRandomElement(invalidFormats)();
};

export const booking_testData = {
  auth: {
    invalidCredentials: {
      username: 'invalid_' + utils.generateRandomString(6),
      password: 'invalid_' + utils.generateRandomString(10),
    },
  },

  validBookings: {
    standard: generateRandomBooking(),
    withoutAdditionalNeeds: generateRandomBooking({ additionalNeeds: '' }),
    edgeCases: {
      // Minimum price (1 unit - could represent $1, €1, etc.)
      minimalPrice: generateRandomBooking({
        totalPrice: 1,
        bookingDates: generateBookingDates(1, 1), // 1-day stay
      }),
      maximalPrice: generateRandomBooking({
        totalPrice: 100000,
        bookingDates: generateBookingDates(30, 90), // Extended stay
      }),
      sameDayCheckout: (() => {
        const date = getFutureDate(5, 30);
        return generateRandomBooking({
          bookingDates: { checkin: date, checkout: date },
        });
      })(),
      longStay: generateRandomBooking({
        totalPrice: utils.getRandomNumber(10000, 50000),
        bookingDates: generateBookingDates(200, 365),
      }),
      depositNotPaid: generateRandomBooking({ depositPaid: false }),
    },
  },

  invalidBookings: {
    missingRequired: {
      baseBooking: generateRandomBooking(),
      requiredFields: ['firstname', 'lastname', 'totalPrice', 'depositPaid', 'bookingDates', 'bookingDates.checkin', 'bookingDates.checkout'],
    },
    invalidTypes: {
      stringPrice: generateRandomBooking({ totalPrice: 'invalid_string' }),
      stringDeposit: generateRandomBooking({ depositPaid: 'yes' }),
      stringBookingDates: generateRandomBooking({ bookingDates: 'invalid' }),
      numberName: generateRandomBooking({ firstname: 12345 }),
      arrayPrice: generateRandomBooking({ totalPrice: [100] }),
    },

    invalidValues: {
      negativePrice: generateRandomBooking({ totalPrice: -100 }),
      zeroPrice: generateRandomBooking({ totalPrice: 0 }),

      invalidDateFormat: (() => {
        const { checkin, checkout, formatType } = generateInvalidDateFormat();
        const booking = generateRandomBooking({
          bookingDates: { checkin, checkout },
        });
        booking._formatType = formatType;
        return booking;
      })(),

      // Checkout before checkin
      checkoutBeforeCheckin: (() => {
        const checkout = getFutureDate(5, 15);
        const checkin = getFutureDate(20, 30);
        return generateRandomBooking({
          bookingDates: { checkin, checkout },
        });
      })(),

      // Past dates
      pastDates: (() => {
        const today = new Date();
        const pastCheckin = utils.formatDate(utils.addDays(today, -30));
        const pastCheckout = utils.formatDate(utils.addDays(today, -20));
        return generateRandomBooking({
          bookingDates: { checkin: pastCheckin, checkout: pastCheckout },
        });
      })(),
    },

    // Empty values - consolidated test data
    emptyValues: {
      baseBooking: generateRandomBooking(),
      emptyStringFields: ['firstname', 'lastname'],
    },

    // Null values
    nullValues: {
      nullFirstname: generateRandomBooking({ firstname: null }),
      nullLastname: generateRandomBooking({ lastname: null }),
      nullPrice: generateRandomBooking({ totalPrice: null }),
      nullDeposit: generateRandomBooking({ depositPaid: null }),
      nullDates: generateRandomBooking({ bookingDates: null }),
    },
  },

  updates: {
    // Full update - all fields changed
    full: generateRandomBooking({
      firstname: 'Updated' + utils.generateRandomString(6),
      lastname: 'Name' + utils.generateRandomString(6),
      totalPrice: utils.getRandomNumber(1000, 3000),
      additionalNeeds: 'Updated requirements',
    }),

    // Partial updates - single field changes (consolidated)
    partial: {
      singleFieldUpdates: {
        firstname: 'NewFirst' + utils.generateRandomString(6),
        lastname: 'NewLast' + utils.generateRandomString(6),
        totalPrice: utils.getRandomNumber(500, 1500),
        depositPaid: true, // Will be toggled in test
        additionalNeeds: 'New requirements ' + utils.generateRandomString(8),
      },

      // Date updates - test individually
      updateCheckinOnly: {
        bookingDates: {
          checkin: getFutureDate(10, 20),
        },
      },

      updateCheckoutOnly: {
        bookingDates: {
          checkout: getFutureDate(30, 50),
        },
      },

      updateBothDates: generateBookingDates(5, 15),

      // Multiple fields
      multipleFields: {
        firstname: 'Multi' + utils.generateRandomString(6),
        totalPrice: utils.getRandomNumber(800, 1200),
        depositPaid: false,
        additionalNeeds: 'Multiple updates',
      },
    },

    // Invalid updates
    invalidUpdates: {
      emptyFirstname: { firstname: '' },
      emptyLastname: { lastname: '' },
      negativePrice: { totalPrice: -500 },
      invalidDateFormat: {
        bookingDates: {
          checkin: '01-01-2026',
          checkout: '10-01-2026',
        },
      },
    },
  },

  filters: {
    // These will be populated dynamically in tests with actual created booking data
    byFirstname: {
      firstname: String, // Placeholder - set in test
    },

    byLastname: {
      lastname: String, // Placeholder - set in test
    },

    byFullname: {
      firstname: String, // Placeholder - set in test
      lastname: String, // Placeholder - set in test
    },

    // Date filters - using dynamic dates
    byCheckinDate: {
      checkin: getFutureDate(15, 25),
    },

    byCheckoutDate: {
      checkout: getFutureDate(40, 60),
    },

    byDateRange: (() => {
      const dates = generateBookingDates(10, 20);
      return {
        checkin: dates.checkin,
        checkout: dates.checkout,
      };
    })(),

    // Combined filters - will be populated in tests
    combined: {
      firstname: String,
      lastname: String,
      checkin: getFutureDate(5, 10),
      checkout: getFutureDate(15, 25),
    },

    // Non-existing data
    nonExisting: {
      firstname: 'NonExisting' + utils.generateRandomString(12),
      lastname: 'NotFound' + utils.generateRandomString(12),
    },
  },

  ids: {
    nonExisting: [999999999, 888888888, 777777777],

    invalid: {
      negative: -1,
      zero: 0,
      string: 'invalid_id',
      specialChars: '!@#$%',
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      null: null,
      undefined: undefined,
      float: 123.456,
      // eslint-disable-next-line no-loss-of-precision
      veryLarge: 9999999999999999,
    },
  },
};
