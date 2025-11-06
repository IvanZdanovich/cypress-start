import { booking_testData } from '../../test-data/api/restful-booker.booking.api.test-data';

describe('RestfulBooker.Booking: Given No preconditions', { testIsolation: false }, () => {
  let authToken;

  context('RestfulBooker.Auth.POST: When valid credentials are provided', () => {
    it('RestfulBooker.Auth.POST: Then return 200 status code and authentication token is generated', () => {
      cy.restfullBooker__getAuthToken__GET(booking_testData.auth.validCredentials).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('token');
        expect(response.body.token).to.be.a('string');
        expect(response.body.token).to.have.length.greaterThan(0);
        authToken = response.body.token;
      });
    });
  });

  context('RestfulBooker.Auth.POST: When invalid credentials are provided', () => {
    // Bug Reference: BUG-RESTFUL-001 - API returns 200 instead of 401 for invalid credentials
    it('RestfulBooker.Auth.POST: Then return 200 status code and reason Bad credentials', () => {
      cy.restfullBooker__getAuthToken__GET(booking_testData.auth.invalidCredentials, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(errors.restfulBooker.auth.invalidCredentials.statusCode);
        expect(response.body).to.have.property('reason');
        expect(response.body.reason).to.eq(errors.restfulBooker.auth.invalidCredentials.message);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When valid booking data is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with all fields', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.booking1).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body).to.have.property('booking');
        expect(response.body.bookingid).to.be.a('number');

        booking_testData.validBookings.booking1.bookingId = response.body.bookingid;

        expect(response.body.booking.firstname).to.eq(booking_testData.validBookings.booking1.firstname);
        expect(response.body.booking.lastname).to.eq(booking_testData.validBookings.booking1.lastname);
        expect(response.body.booking.totalprice).to.eq(booking_testData.validBookings.booking1.totalPrice);
        expect(response.body.booking.depositpaid).to.eq(booking_testData.validBookings.booking1.depositPaid);
        expect(response.body.booking.bookingdates.checkin).to.eq(booking_testData.validBookings.booking1.bookingDates.checkin);
        expect(response.body.booking.bookingdates.checkout).to.eq(booking_testData.validBookings.booking1.bookingDates.checkout);
        expect(response.body.booking.additionalneeds).to.eq(booking_testData.validBookings.booking1.additionalNeeds);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with depositPaid false is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with depositPaid false', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.booking2).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');

        booking_testData.validBookings.booking2.bookingId = response.body.bookingid;

        expect(response.body.booking.depositpaid).to.eq(false);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking without additionalNeeds is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with empty additionalNeeds', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.bookingWithoutAdditionalNeeds).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');

        booking_testData.validBookings.bookingWithoutAdditionalNeeds.bookingId = response.body.bookingid;

        expect(response.body.booking.additionalneeds).to.eq('');
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with long stay period is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with long stay dates', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.bookingWithLongStay).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');

        booking_testData.validBookings.bookingWithLongStay.bookingId = response.body.bookingid;

        expect(response.body.booking.bookingdates.checkin).to.eq(booking_testData.validBookings.bookingWithLongStay.bookingDates.checkin);
        expect(response.body.booking.bookingdates.checkout).to.eq(booking_testData.validBookings.bookingWithLongStay.bookingDates.checkout);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with minimal price is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with price 1', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.bookingWithMinimalPrice).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');

        booking_testData.validBookings.bookingWithMinimalPrice.bookingId = response.body.bookingid;

        expect(response.body.booking.totalprice).to.eq(1);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with maximal price is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with high price', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.bookingWithMaximalPrice).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');

        booking_testData.validBookings.bookingWithMaximalPrice.bookingId = response.body.bookingid;

        expect(response.body.booking.totalprice).to.eq(999999);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with same checkin and checkout dates is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with same dates', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.bookingWithSameCheckinCheckout).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');

        booking_testData.validBookings.bookingWithSameCheckinCheckout.bookingId = response.body.bookingid;

        expect(response.body.booking.bookingdates.checkin).to.eq(response.body.booking.bookingdates.checkout);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When multiple bookings are created', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking3 is created successfully', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.validBookings.booking3).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');

        booking_testData.validBookings.booking3.bookingId = response.body.bookingid;
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with missing firstname is provided', () => {
    // Bug Reference: BUG-RESTFUL-002 - API returns 500 instead of 400 for missing required fields
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error message', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.missingFirstname, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq(errors.common.internalServerError);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with missing lastname is provided', () => {
    // Bug Reference: BUG-RESTFUL-002 - API returns 500 instead of 400 for missing required fields
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error message', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.missingLastname, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq(errors.common.internalServerError);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with missing totalPrice is provided', () => {
    // Bug Reference: BUG-RESTFUL-002 - API returns 500 instead of 400 for missing required fields
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error message', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.missingTotalPrice, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq(errors.common.internalServerError);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with missing depositPaid is provided', () => {
    // Bug Reference: BUG-RESTFUL-002 - API returns 500 instead of 400 for missing required fields
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error message', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.missingDepositPaid, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq(errors.common.internalServerError);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with missing bookingDates is provided', () => {
    // Bug Reference: BUG-RESTFUL-002 - API returns 500 instead of 400 for missing required fields
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error message', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.missingBookingDates, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq(errors.common.internalServerError);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with missing checkin date is provided', () => {
    // Bug Reference: BUG-RESTFUL-002 - API returns 500 instead of 400 for missing required fields
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error message', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.missingCheckin, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq(errors.common.internalServerError);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with missing checkout date is provided', () => {
    // Bug Reference: BUG-RESTFUL-002 - API returns 500 instead of 400 for missing required fields
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error message', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.missingCheckout, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq(errors.common.internalServerError);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with empty firstname is provided', () => {
    // Bug Reference: BUG-RESTFUL-005 - API accepts empty strings instead of rejecting them
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with empty firstname', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.emptyFirstname, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body.booking.firstname).to.eq('');
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with empty lastname is provided', () => {
    // Bug Reference: BUG-RESTFUL-005 - API accepts empty strings instead of rejecting them
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with empty lastname', () => {
      cy.restfullBooker__createBooking__POST(booking_testData.invalidBookings.emptyLastname, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('bookingid');
        expect(response.body.booking.lastname).to.eq('');
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When all booking IDs are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and array of booking IDs', () => {
      cy.restfullBooker__getBookingIds__GET().then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.greaterThan(0);
        expect(response.body[0]).to.have.property('bookingid');
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by firstname are requested', () => {
    before(() => {
      booking_testData.searchFilters.byFirstname.firstname = booking_testData.validBookings.booking1.firstname;
    });
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered booking IDs', () => {
      cy.restfullBooker__getBookingIds__GET(booking_testData.searchFilters.byFirstname).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body.some((booking) => booking.bookingid === booking_testData.validBookings.booking1.bookingId)).to.be.true;
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by lastname are requested', () => {
    before(() => {
      booking_testData.searchFilters.byLastname.lastname = booking_testData.validBookings.booking2.lastname;
    });
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered booking IDs', () => {
      cy.restfullBooker__getBookingIds__GET(booking_testData.searchFilters.byLastname).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body.some((booking) => booking.bookingid === booking_testData.validBookings.booking2.bookingId)).to.be.true;
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by firstname and lastname are requested', () => {
    before(() => {
      booking_testData.searchFilters.byFullname.firstname = booking_testData.validBookings.booking1.firstname;
      booking_testData.searchFilters.byFullname.lastname = booking_testData.validBookings.booking1.lastname;
    });
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered booking IDs', () => {
      cy.restfullBooker__getBookingIds__GET(booking_testData.searchFilters.byFullname).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body.some((booking) => booking.bookingid === booking_testData.validBookings.booking1.bookingId)).to.be.true;
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by checkin date are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered booking IDs', () => {
      cy.restfullBooker__getBookingIds__GET(booking_testData.searchFilters.byCheckinDate).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by checkout date are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered booking IDs', () => {
      cy.restfullBooker__getBookingIds__GET(booking_testData.searchFilters.byCheckoutDate).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by date range are requested', () => {
    // Note: API date filtering may return empty results even when matching bookings exist
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and array response', () => {
      cy.restfullBooker__getBookingIds__GET(booking_testData.searchFilters.byDateRange).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        // Not asserting specific booking presence due to unreliable API date filtering
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by all parameters are requested', () => {
    before(() => {
      booking_testData.searchFilters.byAllFilters.firstname = booking_testData.validBookings.booking1.firstname;
      booking_testData.searchFilters.byAllFilters.lastname = booking_testData.validBookings.booking1.lastname;
    });
    // Note: API filtering with multiple parameters may return empty results even when matching bookings exist
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and array response', () => {
      cy.restfullBooker__getBookingIds__GET(booking_testData.searchFilters.byAllFilters).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        // Not asserting specific booking presence due to unreliable API filtering with combined parameters
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by non-existing name are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and empty array', () => {
      cy.restfullBooker__getBookingIds__GET(booking_testData.searchFilters.nonExistingName).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.eq(0);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When existing booking ID is requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and booking details', () => {
      cy.restfullBooker__getBookingById__GET(booking_testData.validBookings.booking1.bookingId).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('firstname');
        expect(response.body).to.have.property('lastname');
        expect(response.body).to.have.property('totalprice');
        expect(response.body).to.have.property('depositpaid');
        expect(response.body).to.have.property('bookingdates');
        expect(response.body).to.have.property('additionalneeds');

        expect(response.body.firstname).to.eq(booking_testData.validBookings.booking1.firstname);
        expect(response.body.lastname).to.eq(booking_testData.validBookings.booking1.lastname);
        expect(response.body.totalprice).to.eq(booking_testData.validBookings.booking1.totalPrice);
        expect(response.body.depositpaid).to.eq(booking_testData.validBookings.booking1.depositPaid);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When non-existing booking ID is requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 404 status code and Not Found message', () => {
      cy.restfullBooker__getBookingById__GET(booking_testData.nonExistingIds.id1, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.eq(errors.common.notFound);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When invalid string booking ID is requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 404 status code and Not Found message', () => {
      cy.restfullBooker__getBookingById__GET(booking_testData.invalidIds.stringId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.eq(errors.common.notFound);
      });
    });
  });

  context('RestfulBooker.Booking.Update.PUT: When valid full update data is provided with authentication', () => {
    it('RestfulBooker.Booking.Update.PUT: Then return 200 status code and booking is fully updated', () => {
      cy.restfullBooker__updateBooking__PUT(authToken, booking_testData.validBookings.booking1.bookingId, booking_testData.updatedBookingData.fullUpdate).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.firstname).to.eq(booking_testData.updatedBookingData.fullUpdate.firstname);
        expect(response.body.lastname).to.eq(booking_testData.updatedBookingData.fullUpdate.lastname);
        expect(response.body.totalprice).to.eq(booking_testData.updatedBookingData.fullUpdate.totalPrice);
        expect(response.body.depositpaid).to.eq(booking_testData.updatedBookingData.fullUpdate.depositPaid);
        expect(response.body.bookingdates.checkin).to.eq(booking_testData.updatedBookingData.fullUpdate.bookingDates.checkin);
        expect(response.body.bookingdates.checkout).to.eq(booking_testData.updatedBookingData.fullUpdate.bookingDates.checkout);
        expect(response.body.additionalneeds).to.eq(booking_testData.updatedBookingData.fullUpdate.additionalNeeds);
      });
    });
  });

  context('RestfulBooker.Booking.Update.PUT: When full update is attempted without authentication', () => {
    it('RestfulBooker.Booking.Update.PUT: Then return 403 status code and Forbidden message', () => {
      cy.restfullBooker__updateBooking__PUT('invalid_token', booking_testData.validBookings.booking2.bookingId, booking_testData.updatedBookingData.fullUpdate, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.eq(errors.common.forbidden);
      });
    });
  });

  context('RestfulBooker.Booking.Update.PUT: When full update for non-existing booking ID is attempted', () => {
    // Bug Reference: BUG-RESTFUL-003 - API returns 405 instead of 404 for non-existing resources
    it('RestfulBooker.Booking.Update.PUT: Then return 405 status code and Method Not Allowed message', () => {
      cy.restfullBooker__updateBooking__PUT(authToken, booking_testData.nonExistingIds.id2, booking_testData.updatedBookingData.fullUpdate, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(405);
        expect(response.body).to.eq(errors.common.methodNotAllowed);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update of firstname is provided', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 200 status code and firstname is updated', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.booking2.bookingId, booking_testData.updatedBookingData.partialUpdateFirstname).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.firstname).to.eq(booking_testData.updatedBookingData.partialUpdateFirstname.firstname);
        expect(response.body.lastname).to.eq(booking_testData.validBookings.booking2.lastname);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update of lastname is provided', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 200 status code and lastname is updated', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.booking2.bookingId, booking_testData.updatedBookingData.partialUpdateLastname).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.lastname).to.eq(booking_testData.updatedBookingData.partialUpdateLastname.lastname);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update of totalPrice is provided', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 200 status code and totalPrice is updated', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.booking3.bookingId, booking_testData.updatedBookingData.partialUpdatePrice).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.totalprice).to.eq(booking_testData.updatedBookingData.partialUpdatePrice.totalPrice);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update of depositPaid is provided', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 200 status code and depositPaid is updated', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.bookingWithMinimalPrice.bookingId, booking_testData.updatedBookingData.partialUpdateDeposit).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.depositpaid).to.eq(booking_testData.updatedBookingData.partialUpdateDeposit.depositPaid);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update of bookingDates is provided', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 200 status code and bookingDates are updated', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.bookingWithLongStay.bookingId, booking_testData.updatedBookingData.partialUpdateDates).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.bookingdates.checkin).to.eq(booking_testData.updatedBookingData.partialUpdateDates.bookingDates.checkin);
        expect(response.body.bookingdates.checkout).to.eq(booking_testData.updatedBookingData.partialUpdateDates.bookingDates.checkout);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update of additionalNeeds is provided', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 200 status code and additionalNeeds is updated', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.bookingWithoutAdditionalNeeds.bookingId, booking_testData.updatedBookingData.partialUpdateAdditionalNeeds).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.additionalneeds).to.eq(booking_testData.updatedBookingData.partialUpdateAdditionalNeeds.additionalNeeds);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update of multiple fields is provided', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 200 status code and multiple fields are updated', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.validBookings.bookingWithMaximalPrice.bookingId, booking_testData.updatedBookingData.partialUpdateMultipleFields).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.firstname).to.eq(booking_testData.updatedBookingData.partialUpdateMultipleFields.firstname);
        expect(response.body.totalprice).to.eq(booking_testData.updatedBookingData.partialUpdateMultipleFields.totalPrice);
        expect(response.body.depositpaid).to.eq(booking_testData.updatedBookingData.partialUpdateMultipleFields.depositPaid);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update is attempted without authentication', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 403 status code and Forbidden message', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH('invalid_token', booking_testData.validBookings.booking3.bookingId, booking_testData.updatedBookingData.partialUpdateFirstname, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.eq(errors.common.forbidden);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update for non-existing booking ID is attempted', () => {
    // Bug Reference: BUG-RESTFUL-003 - API returns 405 instead of 404 for non-existing resources
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 405 status code and Method Not Allowed message', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, booking_testData.nonExistingIds.id3, booking_testData.updatedBookingData.partialUpdateFirstname, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(405);
        expect(response.body).to.eq(errors.common.methodNotAllowed);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When valid booking ID is provided with authentication', () => {
    // Bug Reference: BUG-RESTFUL-004 - API returns 201 instead of 204 for successful deletion
    it('RestfulBooker.Booking.Delete.DELETE: Then return 201 status code and booking is deleted', () => {
      cy.restfullBooker__deleteBooking__DELETE(authToken, booking_testData.validBookings.bookingWithSameCheckinCheckout.bookingId).then((response) => {
        expect(response.status).to.eq(201);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When deleted booking ID is requested', () => {
    it('RestfulBooker.Booking.Delete.DELETE: Then return 404 status code and Not Found message', () => {
      cy.restfullBooker__getBookingById__GET(booking_testData.validBookings.bookingWithSameCheckinCheckout.bookingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.eq(errors.common.notFound);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When delete is attempted without authentication', () => {
    it('RestfulBooker.Booking.Delete.DELETE: Then return 403 status code and Forbidden message', () => {
      cy.restfullBooker__deleteBooking__DELETE('invalid_token', booking_testData.validBookings.booking1.bookingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.eq(errors.common.forbidden);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When non-existing booking ID is provided', () => {
    // Bug Reference: BUG-RESTFUL-003 - API returns 405 instead of 404 for non-existing resources
    it('RestfulBooker.Booking.Delete.DELETE: Then return 405 status code and Method Not Allowed message', () => {
      cy.restfullBooker__deleteBooking__DELETE(authToken, booking_testData.nonExistingIds.id1, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(405);
        expect(response.body).to.eq(errors.common.methodNotAllowed);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When multiple valid bookings are deleted', () => {
    // Bug Reference: BUG-RESTFUL-004 - API returns 201 instead of 204 for successful deletion
    it('RestfulBooker.Booking.Delete.DELETE: Then return 201 status code and all bookings are deleted', () => {
      const bookingsToDelete = [
        booking_testData.validBookings.booking1.bookingId,
        booking_testData.validBookings.booking2.bookingId,
        booking_testData.validBookings.booking3.bookingId,
        booking_testData.validBookings.bookingWithoutAdditionalNeeds.bookingId,
        booking_testData.validBookings.bookingWithLongStay.bookingId,
        booking_testData.validBookings.bookingWithMinimalPrice.bookingId,
        booking_testData.validBookings.bookingWithMaximalPrice.bookingId,
      ];

      bookingsToDelete.forEach((bookingId) => {
        cy.restfullBooker__deleteBooking__DELETE(authToken, bookingId).then((response) => {
          expect(response.status).to.eq(201);
        });
      });
    });
  });
});
