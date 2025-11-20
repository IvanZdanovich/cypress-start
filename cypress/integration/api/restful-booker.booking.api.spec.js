import { booking_testData } from '../../test-data/api/restful-booker.booking.api.test-data';

describe('RestfulBooker.Booking: Given No preconditions', { testIsolation: false }, () => {
  let authToken;

  context('RestfulBooker.Auth.GET: When valid credentials are provided', () => {
    let adminUser;
    before(() => {
      cy.getUserDataByRole(userRoles.ADMIN_API).then((user) => {
        adminUser = user;
      });
    });
    it('RestfulBooker.Auth.GET: Then return 200 status code and authentication token is generated', () => {
      cy.restfullBooker__getAuthToken__GET(adminUser).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('token');
        expect(response.body.token).to.be.a('string');
        expect(response.body.token).to.have.length.greaterThan(0);
        authToken = response.body.token;
      });
    });
  });

  context('RestfulBooker.Auth.GET: When invalid credentials are provided', () => {
    // Bug Reference: BUG-AUTH-001
    // Expected: 401 Unauthorized with error message
    // Actual: 200 OK with { reason: 'Bad credentials' }
    // Severity: High - incorrect HTTP status code violates REST standards, security concern
    it('RestfulBooker.Auth.GET: Then return 200 status code and reason Bad credentials', () => {
      cy.restfullBooker__getAuthToken__GET(booking_testData.auth.invalidCredentials, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(errors.restfulBooker.auth.invalidCredentials.statusCode);
        expect(response.body).to.have.property('reason');
        expect(response.body.reason).to.eq(errors.restfulBooker.auth.invalidCredentials.message);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When valid booking data with all fields is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created successfully', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.standard).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body).to.have.property('booking');
        expect(response.body.bookingid).to.be.a('number');
        booking_testData.validBookings.standard.bookingId = response.body.bookingid;
        expect(response.body.booking.firstname).to.eq(booking_testData.validBookings.standard.firstname);
        expect(response.body.booking.lastname).to.eq(booking_testData.validBookings.standard.lastname);
        expect(response.body.booking.totalprice).to.eq(booking_testData.validBookings.standard.totalPrice);
        expect(response.body.booking.depositpaid).to.eq(booking_testData.validBookings.standard.depositPaid);
        expect(response.body.booking.bookingdates.checkin).to.eq(booking_testData.validBookings.standard.bookingDates.checkin);
        expect(response.body.booking.bookingdates.checkout).to.eq(booking_testData.validBookings.standard.bookingDates.checkout);
        expect(response.body.booking.additionalneeds).to.eq(booking_testData.validBookings.standard.additionalNeeds);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking without optional field is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with empty additionalNeeds', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.withoutAdditionalNeeds).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        booking_testData.validBookings.withoutAdditionalNeeds.bookingId = response.body.bookingid;
        expect(response.body.booking.additionalneeds).to.eq('');
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with minimal price is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with price of 1', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.edgeCases.minimalPrice).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body).to.have.property('booking');
        booking_testData.validBookings.edgeCases.minimalPrice.bookingId = response.body.bookingid;
        expect(response.body.booking.totalprice).to.eq(1);
        expect(response.body.booking.firstname).to.eq(booking_testData.validBookings.edgeCases.minimalPrice.firstname);
        expect(response.body.booking.lastname).to.eq(booking_testData.validBookings.edgeCases.minimalPrice.lastname);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with maximal price is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with price of 100000', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.edgeCases.maximalPrice).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body).to.have.property('booking');
        booking_testData.validBookings.edgeCases.maximalPrice.bookingId = response.body.bookingid;
        expect(response.body.booking.totalprice).to.eq(100000);
        expect(response.body.booking.firstname).to.eq(booking_testData.validBookings.edgeCases.maximalPrice.firstname);
        expect(response.body.booking.lastname).to.eq(booking_testData.validBookings.edgeCases.maximalPrice.lastname);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with same-day checkout is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and checkin equals checkout date', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.edgeCases.sameDayCheckout).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body).to.have.property('booking');
        booking_testData.validBookings.edgeCases.sameDayCheckout.bookingId = response.body.bookingid;
        expect(response.body.booking.bookingdates.checkin).to.eq(response.body.booking.bookingdates.checkout);
        expect(response.body.booking.bookingdates.checkin).to.eq(booking_testData.validBookings.edgeCases.sameDayCheckout.bookingDates.checkin);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with long stay is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with extended duration', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.edgeCases.longStay).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body).to.have.property('booking');
        booking_testData.validBookings.edgeCases.longStay.bookingId = response.body.bookingid;
        expect(response.body.booking.bookingdates.checkin).to.eq(booking_testData.validBookings.edgeCases.longStay.bookingDates.checkin);
        expect(response.body.booking.bookingdates.checkout).to.eq(booking_testData.validBookings.edgeCases.longStay.bookingDates.checkout);
        expect(response.body.booking.totalprice).to.eq(booking_testData.validBookings.edgeCases.longStay.totalPrice);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with deposit not paid is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and depositpaid is false', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.edgeCases.depositNotPaid).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body).to.have.property('booking');
        booking_testData.validBookings.edgeCases.depositNotPaid.bookingId = response.body.bookingid;
        expect(response.body.booking.depositpaid).to.eq(false);
        expect(response.body.booking.firstname).to.eq(booking_testData.validBookings.edgeCases.depositNotPaid.firstname);
        expect(response.body.booking.lastname).to.eq(booking_testData.validBookings.edgeCases.depositNotPaid.lastname);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When required field is missing', () => {
    // Bug Reference: BUG-BOOKING-002
    // Expected: 400 Bad Request with validation error specifying missing field
    // Actual: 500 Internal Server Error
    // Severity: High - missing validation for required fields, poor error handling
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error', () => {
      const { baseBooking, requiredFields } = booking_testData.invalidBookings.missingRequired;
      const randomField = utils.getRandomElement(requiredFields);
      // Clone and remove random field
      const testData = utils.cloneObject(baseBooking);
      if (randomField.includes('.')) {
        const [parent, child] = randomField.split('.');
        delete testData[parent][child];
      } else {
        delete testData[randomField];
      }
      cy.log(`Testing with missing field: ${randomField}`);
      cy.restfullBooker__createBooking__POST(testData, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq(errors.common.internalServerError);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When invalid data type is provided', () => {
    // Bug Reference: BUG-BOOKING-003
    // Expected: 400 Bad Request with type validation error
    // Actual: Varies - 500 Internal Server Error or accepts invalid types
    // Severity: Medium - weak type validation
    const testCases = Object.keys(booking_testData.invalidBookings.invalidTypes);
    const randomTestCase = utils.getRandomElement(testCases);
    it('RestfulBooker.Booking.Create.POST: Then return error status code for invalid data type', () => {
      cy.log(`Testing invalid type scenario: ${randomTestCase}`);
      const testData = booking_testData.invalidBookings.invalidTypes[randomTestCase];
      cy.restfullBooker__createBooking__POST(testData, { failOnStatusCode: false }).then((response) => {
        expect([400, 500]).to.include(response.status);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When negative price is provided', () => {
    // Bug Reference: BUG-BOOKING-004
    // Expected: 400 Bad Request with error "Price must be positive"
    // Actual: 500 Internal Server Error
    // Severity: High - business logic violation, financial integrity risk
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code due to missing validation', () => {
      cy.log(`Testing negative price: ${booking_testData.invalidBookings.invalidValues.negativePrice.totalPrice}`);
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.invalidValues.negativePrice, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq('Internal Server Error');
        // Expected behavior after bug fix:
        // expect(response.status).to.eq(400);
        // expect(response.body).to.have.property('error');
        // expect(response.body.error).to.include('Price must be positive');
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When zero price is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code as valid for promotional bookings', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.invalidValues.zeroPrice).then((response) => {
        // API accepts zero price - business decision for promotions
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body.booking.totalprice).to.eq(0);
        booking_testData.invalidBookings.invalidValues.zeroPrice.bookingId = response.body.bookingid;
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When invalid date format is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code due to date parsing error', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.invalidValues.invalidDateFormat, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        // Expected behavior after bug fix:
        // expect(response.status).to.eq(400);
        // expect(response.body).to.have.property('error');
        // expect(response.body.error).to.include('Date format must be YYYY-MM-DD');
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When checkout date is before checkin date', () => {
    // Bug Reference: BUG-BOOKING-005
    // Expected: 400 Bad Request with error "Checkout must be after checkin"
    // Actual: 200 OK - accepts illogical dates
    // Severity: Medium - business logic validation missing, data integrity risk
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code due to missing date logic validation', () => {
      const bookingData = booking_testData.invalidBookings.invalidValues.checkoutBeforeCheckin;
      cy.log(`Testing checkout before checkin: ${bookingData.bookingDates.checkout} < ${bookingData.bookingDates.checkin}`);
      cy.restfullBooker__createBooking__POST(bookingData).then((response) => {
        // Current actual behavior - API accepts illogical dates
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');

        // Verify the illogical dates were stored
        expect(response.body.booking.bookingdates.checkin).to.eq(bookingData.bookingDates.checkin);
        expect(response.body.booking.bookingdates.checkout).to.eq(bookingData.bookingDates.checkout);
        booking_testData.invalidBookings.invalidValues.checkoutBeforeCheckin.bookingId = response.body.bookingid;
        // Expected behavior after bug fix:
        // expect(response.status).to.eq(400);
        // expect(response.body).to.have.property('error');
        // expect(response.body.error).to.include('Checkout must be after checkin');
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When empty string value is provided for required field', () => {
    // Bug Reference: BUG-BOOKING-006
    // Expected: 400 Bad Request - required fields cannot be empty
    // Actual: 200 OK - accepts empty strings
    // Severity: High - validation bypass, data quality issue
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with empty field', () => {
      const { baseBooking, emptyStringFields } = booking_testData.invalidBookings.emptyValues;
      const randomField = utils.getRandomElement(emptyStringFields);
      const testData = { ...baseBooking, [randomField]: '' };
      cy.log(`Testing with empty field: ${randomField}`);
      cy.restfullBooker__createBooking__POST(testData, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.booking[randomField]).to.eq('');
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When all booking IDs are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and array of booking IDs', () => {
      cy.restfullBooker__getBookingIds__GET().then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.greaterThan(0);

        // Verify response structure
        response.body.forEach((booking) => {
          expect(booking).to.have.property('bookingid');
          expect(booking.bookingid).to.be.a('number');
        });

        // Verify our created booking is in the list
        const bookingIds = response.body.map((b) => b.bookingid);
        expect(bookingIds).to.include(booking_testData.validBookings.standard.bookingId);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by firstname are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered results include created booking', () => {
      const searchParams = { firstname: booking_testData.validBookings.standard.firstname };

      cy.restfullBooker__getBookingIds__GET(searchParams).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');

        const bookingIds = response.body.map((b) => b.bookingid);
        expect(bookingIds).to.include(booking_testData.validBookings.standard.bookingId);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by lastname are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered results include created booking', () => {
      const searchParams = { lastname: booking_testData.validBookings.standard.lastname };

      cy.restfullBooker__getBookingIds__GET(searchParams).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');

        const bookingIds = response.body.map((b) => b.bookingid);
        expect(bookingIds).to.include(booking_testData.validBookings.standard.bookingId);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by full name are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered results include created booking', () => {
      const searchParams = {
        firstname: booking_testData.validBookings.standard.firstname,
        lastname: booking_testData.validBookings.standard.lastname,
      };

      cy.restfullBooker__getBookingIds__GET(searchParams).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');

        const bookingIds = response.body.map((b) => b.bookingid);
        expect(bookingIds).to.include(booking_testData.validBookings.standard.bookingId);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by dates are requested', () => {
    // Note: Date filtering in this API is unreliable and often returns empty results
    // Testing that endpoint responds correctly, but not asserting specific results
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and array response', () => {
      const searchParams = booking_testData.filters.byDateRange;

      cy.restfullBooker__getBookingIds__GET(searchParams).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        // Not asserting specific results due to API date filtering issues
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by non-existing name are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and empty array', () => {
      const searchParams = booking_testData.filters.nonExisting;

      cy.restfullBooker__getBookingIds__GET(searchParams).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.eq(0);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When existing booking ID is requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and complete booking details', () => {
      cy.restfullBooker__getBookingById__GET(booking_testData.validBookings.standard.bookingId).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('firstname');
        expect(response.body).to.have.property('lastname');
        expect(response.body).to.have.property('totalprice');
        expect(response.body).to.have.property('depositpaid');
        expect(response.body).to.have.property('bookingdates');
        expect(response.body).to.have.property('additionalneeds');
        expect(response.body.firstname).to.eq(booking_testData.validBookings.standard.firstname);
        expect(response.body.lastname).to.eq(booking_testData.validBookings.standard.lastname);
        expect(response.body.totalprice).to.eq(booking_testData.validBookings.standard.totalPrice);
        expect(response.body.depositpaid).to.eq(booking_testData.validBookings.standard.depositPaid);
        expect(response.body.bookingdates.checkin).to.eq(booking_testData.validBookings.standard.bookingDates.checkin);
        expect(response.body.bookingdates.checkout).to.eq(booking_testData.validBookings.standard.bookingDates.checkout);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When non-existing booking ID is requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 404 status code and Not Found message', () => {
      const nonExistingId = utils.getRandomElement(booking_testData.ids.nonExisting);

      cy.restfullBooker__getBookingById__GET(nonExistingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.eq(errors.common.notFound);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When invalid booking ID is requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 404 status code and Not Found message', () => {
      const invalidIds = booking_testData.ids.invalid;
      const [idType, invalidId] = utils.getRandomEntry(invalidIds);

      cy.log(`Testing with invalid ID type: ${idType}`);

      cy.restfullBooker__getBookingById__GET(invalidId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });
  });

  context('RestfulBooker.Booking.Update.PUT: When valid full update is provided with authentication', () => {
    it('RestfulBooker.Booking.Update.PUT: Then return 200 status code and all fields are updated', () => {
      const updateData = booking_testData.updates.full;

      cy.restfullBooker__updateBooking__PUT(authToken, booking_testData.validBookings.standard.bookingId, updateData).then((response) => {
        expect(response.status).to.eq(200);

        // Verify all fields updated
        expect(response.body.firstname).to.eq(updateData.firstname);
        expect(response.body.lastname).to.eq(updateData.lastname);
        expect(response.body.totalprice).to.eq(updateData.totalPrice);
        expect(response.body.depositpaid).to.eq(updateData.depositPaid);
        expect(response.body.bookingdates.checkin).to.eq(updateData.bookingDates.checkin);
        expect(response.body.bookingdates.checkout).to.eq(updateData.bookingDates.checkout);
        expect(response.body.additionalneeds).to.eq(updateData.additionalNeeds);

        // Update stored booking data
        booking_testData.validBookings.standard = { ...booking_testData.validBookings.standard, ...updateData };
      });
    });
  });

  context('RestfulBooker.Booking.Update.PUT: When update is attempted without authentication', () => {
    it('RestfulBooker.Booking.Update.PUT: Then return 403 status code and Forbidden message', () => {
      const updateData = booking_testData.updates.full;

      cy.restfullBooker__updateBooking__PUT('invalid_token', booking_testData.validBookings.withoutAdditionalNeeds.bookingId, updateData, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.eq(errors.common.forbidden);
      });
    });
  });

  context('RestfulBooker.Booking.Update.PUT: When update for non-existing booking ID is attempted', () => {
    // Bug Reference: BUG-BOOKING-007
    // Expected: 404 Not Found
    // Actual: 405 Method Not Allowed
    // Severity: Medium - incorrect HTTP status code
    it('RestfulBooker.Booking.Update.PUT: Then return 405 status code and Method Not Allowed message', () => {
      const nonExistingId = utils.getRandomElement(booking_testData.ids.nonExisting);
      const updateData = booking_testData.updates.full;

      cy.restfullBooker__updateBooking__PUT(authToken, nonExistingId, updateData, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(405);
        expect(response.body).to.eq(errors.common.methodNotAllowed);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When single field is partially updated', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then only specified field changes and others remain unchanged', () => {
      const singleFieldUpdates = booking_testData.updates.partial.singleFieldUpdates;
      const [fieldName, newValue] = utils.getRandomEntry(singleFieldUpdates);

      // Handle depositPaid toggle
      let updateData;
      if (fieldName === 'depositPaid') {
        updateData = { [fieldName]: !createdBookings.minimalPrice[fieldName] };
      } else {
        updateData = { [fieldName]: newValue };
      }

      cy.log(`Updating field: ${fieldName}`);

      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.minimalPrice.bookingId, updateData).then((response) => {
        expect(response.status).to.eq(200);

        // Map camelCase to API response format
        const apiFieldName = fieldName === 'totalPrice' ? 'totalprice' : fieldName === 'depositPaid' ? 'depositpaid' : fieldName === 'additionalNeeds' ? 'additionalneeds' : fieldName;

        expect(response.body[apiFieldName]).to.eq(updateData[fieldName]);

        // Update stored booking
        booking_testData.validBookings.minimalPrice[fieldName] = updateData[fieldName];
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When only checkin date is updated', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then checkin changes but checkout remains unchanged', () => {
      const updateData = booking_testData.updates.partial.updateCheckinOnly;
      const originalCheckout = booking_testData.validBookings.maximalPrice.bookingDates.checkout;

      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.maximalPrice.bookingId, updateData).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.bookingdates.checkin).to.eq(updateData.bookingDates.checkin);
        expect(response.body.bookingdates.checkout).to.eq(originalCheckout);

        // Update stored booking
        booking_testData.validBookings.maximalPrice.bookingDates.checkin = updateData.bookingDates.checkin;
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When only checkout date is updated', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then checkout changes but checkin remains unchanged', () => {
      const updateData = booking_testData.updates.partial.updateCheckoutOnly;
      const originalCheckin = booking_testData.validBookings.maximalPrice.bookingDates.checkin;

      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.maximalPrice.bookingId, updateData).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.bookingdates.checkout).to.eq(updateData.bookingDates.checkout);
        expect(response.body.bookingdates.checkin).to.eq(originalCheckin);

        // Update stored booking
        booking_testData.validBookings.maximalPrice.bookingDates.checkout = updateData.bookingDates.checkout;
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When multiple fields are partially updated', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then all specified fields change and others remain unchanged', () => {
      const updateData = booking_testData.updates.partial.multipleFields;

      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.longStay.bookingId, updateData).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.firstname).to.eq(updateData.firstname);
        expect(response.body.totalprice).to.eq(updateData.totalPrice);
        expect(response.body.depositpaid).to.eq(updateData.depositPaid);
        expect(response.body.additionalneeds).to.eq(updateData.additionalNeeds);

        // Verify unchanged field (lastname)
        expect(response.body.lastname).to.eq(booking_testData.validBookings.longStay.lastname);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update is attempted without authentication', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 403 status code and Forbidden message', () => {
      const updateData = booking_testData.updates.partial.multipleFields;

      cy.restfullBooker__partialUpdateBooking__PATCH('invalid_token', booking_testData.validBookings.depositNotPaid.bookingId, updateData, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.eq(errors.common.forbidden);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update for non-existing ID is attempted', () => {
    // Bug Reference: BUG-BOOKING-007
    // Expected: 404 Not Found
    // Actual: 405 Method Not Allowed
    // Severity: Medium - incorrect HTTP status code
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 405 status code and Method Not Allowed message', () => {
      const nonExistingId = utils.getRandomElement(booking_testData.ids.nonExisting);
      const updateData = { firstname: 'Test' };

      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, nonExistingId, updateData, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(405);
        expect(response.body).to.eq(errors.common.methodNotAllowed);
      });
    });
  });

  // ==================== DELETE BOOKINGS ====================

  context('RestfulBooker.Booking.Delete.DELETE: When valid booking ID is deleted with authentication', () => {
    // Bug Reference: BUG-BOOKING-008
    // Expected: 204 No Content
    // Actual: 201 Created
    // Severity: Medium - incorrect HTTP status code (201 is for resource creation)
    it('RestfulBooker.Booking.Delete.DELETE: Then return 201 status code and booking is deleted', () => {
      cy.restfullBooker__deleteBooking__DELETE(authToken, booking_testData.validBookings.sameDayCheckout.bookingId).then((response) => {
        expect(response.status).to.eq(201);
      });

      // Verify deletion
      cy.restfullBooker__getBookingById__GET(booking_testData.validBookings.sameDayCheckout.bookingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.eq(errors.common.notFound);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When delete is attempted without authentication', () => {
    it('RestfulBooker.Booking.Delete.DELETE: Then return 403 status code and Forbidden message', () => {
      cy.restfullBooker__deleteBooking__DELETE('invalid_token', booking_testData.validBookings.standard.bookingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.eq(errors.common.forbidden);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When non-existing booking ID is provided', () => {
    // Bug Reference: BUG-BOOKING-007
    // Expected: 404 Not Found
    // Actual: 405 Method Not Allowed
    // Severity: Medium - incorrect HTTP status code
    it('RestfulBooker.Booking.Delete.DELETE: Then return 405 status code and Method Not Allowed message', () => {
      const nonExistingId = utils.getRandomElement(booking_testData.ids.nonExisting);

      cy.restfullBooker__deleteBooking__DELETE(authToken, nonExistingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(405);
        expect(response.body).to.eq(errors.common.methodNotAllowed);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When cleaning up test data', () => {
    // Bug Reference: BUG-BOOKING-008 - API returns 201 instead of 204 for successful deletion
    it('RestfulBooker.Booking.Delete.DELETE: Then all remaining test bookings are deleted successfully', () => {
      const bookingsToDelete = Object.keys(booking_testData.validBookings)
        .filter((key) => key !== 'sameDayCheckout') // Already deleted
        .map((key) => booking_testData.validBookings[key].bookingId);

      bookingsToDelete.forEach((bookingId) => {
        cy.restfullBooker__deleteBooking__DELETE(authToken, bookingId).then((response) => {
          expect(response.status).to.eq(201);
        });
      });
    });
  });
});
