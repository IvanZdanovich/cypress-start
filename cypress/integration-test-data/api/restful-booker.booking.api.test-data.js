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

export const booking_testData = {
  validBookings: {
    standard: {
      bookingId: String,
      firstname: utils.generateRandomString(8),
      lastname: utils.generateRandomString(10),
      totalPrice: utils.getRandomNumber(100, 1000),
      depositPaid: true,
      bookingDates: {
        checkin: utils.getFutureDate(7),
        checkout: utils.getFutureDate(14),
      },
      additionalNeeds: 'Breakfast',
    },
    withoutAdditionalNeeds: {
      bookingId: String,
      firstname: utils.generateRandomString(8),
      lastname: utils.generateRandomString(10),
      totalPrice: utils.getRandomNumber(100, 1000),
      depositPaid: true,
      bookingDates: {
        checkin: utils.getFutureDate(7),
        checkout: utils.getFutureDate(14),
      },
    },
    edgeCases: {
      minimalPrice: {
        bookingId: String,
        firstname: utils.generateRandomString(6),
        lastname: utils.generateRandomString(8),
        totalPrice: 1,
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(3),
          checkout: utils.getFutureDate(5),
        },
        additionalNeeds: 'None',
      },
      maximalPrice: {
        bookingId: String,
        firstname: utils.generateRandomString(6),
        lastname: utils.generateRandomString(8),
        totalPrice: 100000,
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(10),
          checkout: utils.getFutureDate(12),
        },
        additionalNeeds: 'VIP Suite',
      },
      sameDayCheckout: {
        bookingId: String,
        firstname: utils.generateRandomString(7),
        lastname: utils.generateRandomString(9),
        totalPrice: utils.getRandomNumber(50, 200),
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(5),
          checkout: utils.getFutureDate(5),
        },
        additionalNeeds: 'Day use only',
      },
      longStay: {
        bookingId: String,
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: utils.getRandomNumber(5000, 10000),
        depositPaid: false,
        bookingDates: {
          checkin: utils.getFutureDate(30),
          checkout: utils.getFutureDate(120),
        },
        additionalNeeds: 'Extended stay discount',
      },
      depositNotPaid: {
        bookingId: String,
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: utils.getRandomNumber(100, 500),
        depositPaid: false,
        bookingDates: {
          checkin: utils.getFutureDate(7),
          checkout: utils.getFutureDate(14),
        },
        additionalNeeds: 'Payment on arrival',
      },
    },
  },
  invalidBookings: {
    missingRequired: {
      baseBooking: {
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: utils.getRandomNumber(100, 500),
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(7),
          checkout: utils.getFutureDate(14),
        },
        additionalNeeds: null,
      },
      requiredFields: ['firstname', 'lastname', 'totalPrice', 'depositPaid', 'bookingDates.checkin', 'bookingDates.checkout'],
    },
    invalidTypes: {
      priceAsString: {
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: 'not_a_number',
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(7),
          checkout: utils.getFutureDate(14),
        },
        additionalNeeds: null,
      },
      depositAsString: {
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: utils.getRandomNumber(100, 500),
        depositPaid: 'yes',
        bookingDates: {
          checkin: utils.getFutureDate(7),
          checkout: utils.getFutureDate(14),
        },
        additionalNeeds: null,
      },
      firstnameAsNumber: {
        firstname: 12345,
        lastname: utils.generateRandomString(10),
        totalPrice: utils.getRandomNumber(100, 500),
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(7),
          checkout: utils.getFutureDate(14),
        },
        additionalNeeds: null,
      },
      lastnameAsBoolean: {
        firstname: utils.generateRandomString(8),
        lastname: true,
        totalPrice: utils.getRandomNumber(100, 500),
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(7),
          checkout: utils.getFutureDate(14),
        },
        additionalNeeds: null,
      },
    },
    invalidValues: {
      negativePrice: {
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: -100,
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(7),
          checkout: utils.getFutureDate(14),
        },
        additionalNeeds: null,
      },
      zeroPrice: {
        bookingId: String,
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: 0,
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(7),
          checkout: utils.getFutureDate(14),
        },
        additionalNeeds: 'Promotional offer',
      },
      invalidDateFormat: {
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: utils.getRandomNumber(100, 500),
        depositPaid: true,
        bookingDates: {
          checkin: '01-12-2025',
          checkout: '15-12-2025',
        },
        additionalNeeds: null,
      },
      checkoutBeforeCheckin: {
        bookingId: String,
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: utils.getRandomNumber(100, 500),
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(14),
          checkout: utils.getFutureDate(7),
        },
        additionalNeeds: null,
      },
    },
    emptyValues: {
      baseBooking: {
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalPrice: utils.getRandomNumber(100, 500),
        depositPaid: true,
        bookingDates: {
          checkin: utils.getFutureDate(7),
          checkout: utils.getFutureDate(14),
        },
        additionalNeeds: null,
      },
      emptyStringFields: ['firstname', 'lastname', 'additionalNeeds'],
    },
  },
  auth: {
    invalidCredentials: {
      username: 'invalid_user',
      password: 'invalid_password',
    },
  },
  updates: {
    full: {
      firstname: utils.generateRandomString(10),
      lastname: utils.generateRandomString(12),
      totalPrice: utils.getRandomNumber(200, 800),
      depositPaid: false,
      bookingDates: {
        checkin: utils.getFutureDate(20),
        checkout: utils.getFutureDate(25),
      },
      additionalNeeds: 'Updated requirements',
    },
    partial: {
      singleFieldUpdates: {
        firstname: utils.generateRandomString(9),
        lastname: utils.generateRandomString(11),
        totalPrice: utils.getRandomNumber(300, 700),
        additionalNeeds: 'Partial update test',
      },
      updateCheckinOnly: {
        bookingDates: {
          checkin: utils.getFutureDate(15),
        },
      },
      updateCheckoutOnly: {
        bookingDates: {
          checkout: utils.getFutureDate(30),
        },
      },
      multipleFields: {
        firstname: utils.generateRandomString(7),
        totalPrice: utils.getRandomNumber(150, 350),
        depositPaid: true,
        additionalNeeds: 'Multiple fields update',
      },
    },
  },
  filters: {
    byDateRange: {
      checkin: utils.getFutureDate(7),
      checkout: utils.getFutureDate(14),
    },
    nonExisting: {
      firstname: utils.generateRandomString(15),
      lastname: utils.generateRandomString(15),
    },
  },
  ids: {
    nonExisting: [999999, 888888, 777777],
    invalid: {
      string: 'not_a_number',
      negative: -1,
      zero: 0,
      float: 123.456,
      special: 'abc@123',
    },
  },
};
