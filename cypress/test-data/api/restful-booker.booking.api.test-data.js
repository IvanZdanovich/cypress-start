export const booking_testData = {
  auth: {
    validCredentials: {
      username: 'admin',
      password: 'password123',
    },
    invalidCredentials: {
      username: 'invalid',
      password: 'invalid',
    },
  },

  validBookings: {
    booking1: {
      bookingId: String,
      firstname: 'John' + utils.generateRandomString(5),
      lastname: 'Doe' + utils.generateRandomString(5),
      totalPrice: utils.getRandomNumber(100, 500),
      depositPaid: true,
      bookingDates: {
        checkin: '2025-12-01',
        checkout: '2025-12-15',
      },
      additionalNeeds: 'Breakfast',
    },
    booking2: {
      bookingId: String,
      firstname: 'Jane' + utils.generateRandomString(5),
      lastname: 'Smith' + utils.generateRandomString(5),
      totalPrice: utils.getRandomNumber(200, 600),
      depositPaid: false,
      bookingDates: {
        checkin: '2026-01-10',
        checkout: '2026-01-20',
      },
      additionalNeeds: 'Lunch',
    },
    booking3: {
      bookingId: String,
      firstname: 'Bob' + utils.generateRandomString(5),
      lastname: 'Wilson' + utils.generateRandomString(5),
      totalPrice: utils.getRandomNumber(300, 700),
      depositPaid: true,
      bookingDates: {
        checkin: '2026-02-05',
        checkout: '2026-02-25',
      },
      additionalNeeds: 'Dinner',
    },
    bookingWithoutAdditionalNeeds: {
      bookingId: String,
      firstname: 'Alice' + utils.generateRandomString(5),
      lastname: 'Brown' + utils.generateRandomString(5),
      totalPrice: utils.getRandomNumber(150, 400),
      depositPaid: true,
      bookingDates: {
        checkin: '2026-03-01',
        checkout: '2026-03-10',
      },
      additionalNeeds: '',
    },
    bookingWithLongStay: {
      bookingId: String,
      firstname: 'Charlie' + utils.generateRandomString(5),
      lastname: 'Davis' + utils.generateRandomString(5),
      totalPrice: utils.getRandomNumber(1000, 3000),
      depositPaid: true,
      bookingDates: {
        checkin: '2026-04-01',
        checkout: '2026-06-30',
      },
      additionalNeeds: 'Breakfast, Lunch, Dinner',
    },
    bookingWithMinimalPrice: {
      bookingId: String,
      firstname: 'Eva' + utils.generateRandomString(5),
      lastname: 'Martinez' + utils.generateRandomString(5),
      totalPrice: 1,
      depositPaid: false,
      bookingDates: {
        checkin: '2026-05-15',
        checkout: '2026-05-16',
      },
      additionalNeeds: '',
    },
    bookingWithMaximalPrice: {
      bookingId: String,
      firstname: 'Frank' + utils.generateRandomString(5),
      lastname: 'Garcia' + utils.generateRandomString(5),
      totalPrice: 999999,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-06-01',
        checkout: '2026-12-31',
      },
      additionalNeeds: 'All inclusive package',
    },
    bookingWithSameCheckinCheckout: {
      bookingId: String,
      firstname: 'Grace' + utils.generateRandomString(5),
      lastname: 'Lee' + utils.generateRandomString(5),
      totalPrice: utils.getRandomNumber(50, 150),
      depositPaid: true,
      bookingDates: {
        checkin: '2026-07-15',
        checkout: '2026-07-15',
      },
      additionalNeeds: 'Day use only',
    },
  },

  updatedBookingData: {
    fullUpdate: {
      firstname: 'Updated' + utils.generateRandomString(5),
      lastname: 'Name' + utils.generateRandomString(5),
      totalPrice: utils.getRandomNumber(500, 1000),
      depositPaid: false,
      bookingDates: {
        checkin: '2026-08-01',
        checkout: '2026-08-15',
      },
      additionalNeeds: 'Updated needs',
    },
    partialUpdateFirstname: {
      firstname: 'PartialUpdate' + utils.generateRandomString(5),
    },
    partialUpdateLastname: {
      lastname: 'PartialLastname' + utils.generateRandomString(5),
    },
    partialUpdatePrice: {
      totalPrice: utils.getRandomNumber(800, 1200),
    },
    partialUpdateDeposit: {
      depositPaid: true,
    },
    partialUpdateDates: {
      bookingDates: {
        checkin: '2026-09-01',
        checkout: '2026-09-30',
      },
    },
    partialUpdateAdditionalNeeds: {
      additionalNeeds: 'Partial update additional needs',
    },
    partialUpdateMultipleFields: {
      firstname: 'Multi' + utils.generateRandomString(5),
      totalPrice: utils.getRandomNumber(600, 900),
      depositPaid: true,
    },
  },

  invalidBookings: {
    missingFirstname: {
      lastname: 'Smith',
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    missingLastname: {
      firstname: 'John',
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    missingTotalPrice: {
      firstname: 'John',
      lastname: 'Smith',
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    missingDepositPaid: {
      firstname: 'John',
      lastname: 'Smith',
      totalPrice: 200,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    missingBookingDates: {
      firstname: 'John',
      lastname: 'Smith',
      totalPrice: 200,
      depositPaid: true,
      additionalNeeds: 'Breakfast',
    },
    missingCheckin: {
      firstname: 'John',
      lastname: 'Smith',
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    missingCheckout: {
      firstname: 'John',
      lastname: 'Smith',
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
      },
      additionalNeeds: 'Breakfast',
    },
    invalidDateFormat: {
      firstname: 'John',
      lastname: 'Smith',
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkin: '01-01-2026',
        checkout: '10-01-2026',
      },
      additionalNeeds: 'Breakfast',
    },
    checkoutBeforeCheckin: {
      firstname: 'John',
      lastname: 'Smith',
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-10',
        checkout: '2026-01-01',
      },
      additionalNeeds: 'Breakfast',
    },
    negativeTotalPrice: {
      firstname: 'John',
      lastname: 'Smith',
      totalPrice: -100,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    zeroTotalPrice: {
      firstname: 'John',
      lastname: 'Smith',
      totalPrice: 0,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    invalidDepositPaidType: {
      firstname: 'John',
      lastname: 'Smith',
      totalPrice: 200,
      depositPaid: 'yes',
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    emptyFirstname: {
      firstname: '',
      lastname: 'Smith',
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    emptyLastname: {
      firstname: 'John',
      lastname: '',
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    nullFirstname: {
      firstname: null,
      lastname: 'Smith',
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
    nullLastname: {
      firstname: 'John',
      lastname: null,
      totalPrice: 200,
      depositPaid: true,
      bookingDates: {
        checkin: '2026-01-01',
        checkout: '2026-01-10',
      },
      additionalNeeds: 'Breakfast',
    },
  },

  searchFilters: {
    byFirstname: {
      firstname: String,
    },
    byLastname: {
      lastname: String,
    },
    byFullname: {
      firstname: String,
      lastname: String,
    },
    byCheckinDate: {
      checkin: '2026-01-10',
    },
    byCheckoutDate: {
      checkout: '2026-01-20',
    },
    byDateRange: {
      checkin: '2026-02-05',
      checkout: '2026-02-25',
    },
    byAllFilters: {
      firstname: String,
      lastname: String,
      checkin: '2025-12-01',
      checkout: '2025-12-15',
    },
    nonExistingName: {
      firstname: 'NonExisting' + utils.generateRandomString(10),
      lastname: 'NotFound' + utils.generateRandomString(10),
    },
  },

  nonExistingIds: {
    id1: 999999999,
    id2: 888888888,
    id3: 777777777,
  },

  invalidIds: {
    negativeId: -1,
    zeroId: 0,
    stringId: 'invalid',
    specialCharsId: '!@#$%',
    nullId: null,
    undefinedId: undefined,
  },
};
