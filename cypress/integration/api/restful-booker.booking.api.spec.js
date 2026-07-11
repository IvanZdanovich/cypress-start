import { booking__examples as examples } from '../../integration-examples/api/restful-booker.booking.api.examples';
import { HTTP_STATUS, ERROR_MESSAGE } from '../../constants/api/common.api.constraints';
import { PRICE, FIELD_MAP } from '../../constants/api/rb.booking.api.constraints';

describe('RestfulBooker.Booking: Given no preconditions', { testIsolation: false }, () => {
  let authToken;
  const cleanUp = () => cy.restfullBooker__bulkDelete__DELETE(authToken, examples);

  before(() => {
    cy.commonAPI__getTokenByRole__POST(userRoles.ADMIN_API).then((token) => {
      authToken = token;
    });
    cy.then(cleanUp);
  });
  after(cleanUp);

  context('RestfulBooker.Auth.GET: When invalid credentials are provided', () => {
    it('RestfulBooker.Auth.GET: Then return 200 status code and reason Bad credentials', { req: { bugs: ['BUG-AUTH-001'] } }, () => {
      cy.restfullBooker__getAuthToken__POST(examples.invalidCredentials, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body).to.have.property('reason');
        expect(response.body.reason).to.eq(ERROR_MESSAGE.BAD_CREDENTIALS);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When valid booking data with all fields is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created successfully', () => {
      cy.restfullBooker__createBooking__POST(examples.validBookings.withAllFields).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body).to.have.property('bookingid');
        expect(response.body.bookingid).to.be.a('number');
        examples.validBookings.withAllFields.bookingId = response.body.bookingid;
        expect(response.body.booking.firstname).to.eq(examples.validBookings.withAllFields.firstname);
        expect(response.body.booking.lastname).to.eq(examples.validBookings.withAllFields.lastname);
        expect(response.body.booking.totalprice).to.eq(examples.validBookings.withAllFields.totalPrice);
        expect(response.body.booking.depositpaid).to.eq(examples.validBookings.withAllFields.depositPaid);
        expect(response.body.booking.bookingdates.checkin).to.eq(examples.validBookings.withAllFields.bookingDates.checkin);
        expect(response.body.booking.bookingdates.checkout).to.eq(examples.validBookings.withAllFields.bookingDates.checkout);
        expect(response.body.booking.additionalneeds).to.eq(examples.validBookings.withAllFields.additionalNeeds);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking without optional field is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and additionalneeds is undefined', () => {
      cy.restfullBooker__createBooking__POST(examples.validBookings.withoutAdditionalNeeds).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.validBookings.withoutAdditionalNeeds.bookingId = response.body.bookingid;
        expect(response.body.booking.additionalneeds).to.eq(undefined);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with minimal price is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with minimal price', () => {
      cy.restfullBooker__createBooking__POST(examples.validBookings.minimalPrice).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.validBookings.minimalPrice.bookingId = response.body.bookingid;
        expect(response.body.booking.totalprice).to.eq(PRICE.MIN);
        expect(response.body.booking.firstname).to.eq(examples.validBookings.minimalPrice.firstname);
        expect(response.body.booking.lastname).to.eq(examples.validBookings.minimalPrice.lastname);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with maximal price is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with maximal price', () => {
      cy.restfullBooker__createBooking__POST(examples.validBookings.maximalPrice).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.validBookings.maximalPrice.bookingId = response.body.bookingid;
        expect(response.body.booking.totalprice).to.eq(PRICE.MAX);
        expect(response.body.booking.firstname).to.eq(examples.validBookings.maximalPrice.firstname);
        expect(response.body.booking.lastname).to.eq(examples.validBookings.maximalPrice.lastname);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with same-day checkout is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and checkin equals checkout date', () => {
      cy.restfullBooker__createBooking__POST(examples.validBookings.sameDayCheckout).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.validBookings.sameDayCheckout.bookingId = response.body.bookingid;
        expect(response.body.booking.bookingdates.checkin).to.eq(response.body.booking.bookingdates.checkout);
        expect(response.body.booking.bookingdates.checkin).to.eq(examples.validBookings.sameDayCheckout.bookingDates.checkin);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with long stay is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with extended duration', () => {
      cy.restfullBooker__createBooking__POST(examples.validBookings.longStay).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.validBookings.longStay.bookingId = response.body.bookingid;
        expect(response.body.booking.bookingdates.checkin).to.eq(examples.validBookings.longStay.bookingDates.checkin);
        expect(response.body.booking.bookingdates.checkout).to.eq(examples.validBookings.longStay.bookingDates.checkout);
        expect(response.body.booking.totalprice).to.eq(examples.validBookings.longStay.totalPrice);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When booking with deposit not paid is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and depositpaid is false', () => {
      cy.restfullBooker__createBooking__POST(examples.validBookings.depositNotPaid).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.validBookings.depositNotPaid.bookingId = response.body.bookingid;
        expect(response.body.booking.depositpaid).to.eq(false);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When required field is missing', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error', { req: { bugs: ['BUG-BOOKING-002'] } }, () => {
      cy.restfullBooker__createBooking__POST(examples.invalidBookings.missingRequiredField.data, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(response.body).to.eq(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When invalid data type is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code when price is string', { req: { bugs: ['BUG-BOOKING-003'] } }, () => {
      cy.restfullBooker__createBooking__POST(examples.invalidBookings.priceAsString, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.invalidBookings.priceAsString.bookingId = response.body.bookingid;
      });
    });
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code when deposit is string', { req: { bugs: ['BUG-BOOKING-003'] } }, () => {
      cy.restfullBooker__createBooking__POST(examples.invalidBookings.depositAsString, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.invalidBookings.depositAsString.bookingId = response.body.bookingid;
      });
    });
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code when firstname is number', { req: { bugs: ['BUG-BOOKING-003'] } }, () => {
      cy.restfullBooker__createBooking__POST(examples.invalidBookings.firstnameAsNumber, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(response.body).to.eq(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
      });
    });
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code when lastname is boolean', { req: { bugs: ['BUG-BOOKING-003'] } }, () => {
      cy.restfullBooker__createBooking__POST(examples.invalidBookings.lastnameAsBoolean, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(response.body).to.eq(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When negative price is provided', () => {
    it.skip('RestfulBooker.Booking.Create.POST: Then return 500 status code due to missing validation', { req: { bugs: ['BUG-BOOKING-004'] } }, () => {
      cy.restfullBooker__createBooking__POST(examples.invalidBookings.negativePrice, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(response.body).to.eq(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When zero price is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code as valid for promotional bookings', () => {
      cy.restfullBooker__createBooking__POST(examples.validBookings.zeroPrice).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body.booking.totalprice).to.eq(PRICE.ZERO);
        examples.validBookings.zeroPrice.bookingId = response.body.bookingid;
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When invalid date format is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and invalid date format is accepted', { req: { bugs: ['BUG-BOOKING-009'] } }, () => {
      cy.restfullBooker__createBooking__POST(examples.invalidBookings.invalidDateFormat, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.invalidBookings.invalidDateFormat.bookingId = response.body.bookingid;
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When checkout date is before checkin date', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code due to missing date logic validation', { req: { bugs: ['BUG-BOOKING-005'] } }, () => {
      cy.restfullBooker__createBooking__POST(examples.invalidBookings.checkoutBeforeCheckin).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body.booking.bookingdates.checkin).to.eq(examples.invalidBookings.checkoutBeforeCheckin.bookingDates.checkin);
        expect(response.body.booking.bookingdates.checkout).to.eq(examples.invalidBookings.checkoutBeforeCheckin.bookingDates.checkout);
        examples.invalidBookings.checkoutBeforeCheckin.bookingId = response.body.bookingid;
      });
    });
  });

  context('RestfulBooker.Booking.Create.POST: When empty string value is provided for required field', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with empty field', { req: { bugs: ['BUG-BOOKING-006'] } }, () => {
      cy.restfullBooker__createBooking__POST(examples.invalidBookings.emptyStringField.data, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        examples.invalidBookings.emptyStringField.data.bookingId = response.body.bookingid;
        const apiFieldName = FIELD_MAP[examples.invalidBookings.emptyStringField.name] ?? examples.invalidBookings.emptyStringField.name;
        if (examples.invalidBookings.emptyStringField.name === 'additionalNeeds') {
          expect(response.body.booking[apiFieldName]).to.be.oneOf(['', undefined, null]);
        } else {
          expect(response.body.booking[apiFieldName]).to.eq('');
        }
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When all booking IDs are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and array of booking IDs', () => {
      cy.restfullBooker__getBookingIds__GET().then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.greaterThan(0);
        const bookingIds = response.body.map((b) => b.bookingid);
        expect(bookingIds).to.include(examples.validBookings.withAllFields.bookingId);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by firstname are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered results include created booking', () => {
      cy.restfullBooker__getBookingIds__GET({ firstname: examples.validBookings.withAllFields.firstname }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        const bookingIds = response.body.map((b) => b.bookingid);
        expect(bookingIds).to.include(examples.validBookings.withAllFields.bookingId);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by lastname are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered results include created booking', () => {
      cy.restfullBooker__getBookingIds__GET({ lastname: examples.validBookings.withAllFields.lastname }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        const bookingIds = response.body.map((b) => b.bookingid);
        expect(bookingIds).to.include(examples.validBookings.withAllFields.bookingId);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by full name are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and filtered results include created booking', () => {
      cy.restfullBooker__getBookingIds__GET({ firstname: examples.validBookings.withAllFields.firstname, lastname: examples.validBookings.withAllFields.lastname }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        const bookingIds = response.body.map((b) => b.bookingid);
        expect(bookingIds).to.include(examples.validBookings.withAllFields.bookingId);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by dates are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and array response', { req: { preconditions: ['Date filtering on this API is unreliable; only response shape is asserted.'] } }, () => {
      cy.restfullBooker__getBookingIds__GET(examples.filters.byDateRange).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body).to.be.an('array');
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When booking IDs filtered by non-existing name are requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and empty array', () => {
      cy.restfullBooker__getBookingIds__GET(examples.filters.nonExisting).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.eq(0);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When existing booking ID is requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 status code and complete booking details', () => {
      cy.restfullBooker__getBookingById__GET(examples.validBookings.withAllFields.bookingId).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body.firstname).to.eq(examples.validBookings.withAllFields.firstname);
        expect(response.body.lastname).to.eq(examples.validBookings.withAllFields.lastname);
        expect(response.body.totalprice).to.eq(examples.validBookings.withAllFields.totalPrice);
        expect(response.body.depositpaid).to.eq(examples.validBookings.withAllFields.depositPaid);
        expect(response.body.bookingdates.checkin).to.eq(examples.validBookings.withAllFields.bookingDates.checkin);
        expect(response.body.bookingdates.checkout).to.eq(examples.validBookings.withAllFields.bookingDates.checkout);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When non-existing booking ID is requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 404 status code and Not Found message', () => {
      cy.restfullBooker__getBookingById__GET(examples.nonExistingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.NOT_FOUND);
        expect(response.body).to.eq(ERROR_MESSAGE.NOT_FOUND);
      });
    });
  });

  context('RestfulBooker.Booking.Retrieve.GET: When invalid booking ID is requested', () => {
    it('RestfulBooker.Booking.Retrieve.GET: Then return 404 status code for string ID', { req: { bugs: ['BUG-BOOKING-011'] } }, () => {
      cy.restfullBooker__getBookingById__GET(examples.invalidIds.stringId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.NOT_FOUND);
        expect(response.body).to.eq(ERROR_MESSAGE.NOT_FOUND);
      });
    });
    it('RestfulBooker.Booking.Retrieve.GET: Then return 404 status code for negative ID', { req: { bugs: ['BUG-BOOKING-011'] } }, () => {
      cy.restfullBooker__getBookingById__GET(examples.invalidIds.negativeId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.NOT_FOUND);
        expect(response.body).to.eq(ERROR_MESSAGE.NOT_FOUND);
      });
    });
    it('RestfulBooker.Booking.Retrieve.GET: Then return 404 status code for zero ID', { req: { bugs: ['BUG-BOOKING-011'] } }, () => {
      cy.restfullBooker__getBookingById__GET(examples.invalidIds.zeroId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.NOT_FOUND);
        expect(response.body).to.eq(ERROR_MESSAGE.NOT_FOUND);
      });
    });
    it('RestfulBooker.Booking.Retrieve.GET: Then return 200 or 404 status code for float ID due to truncation', { req: { bugs: ['BUG-BOOKING-011'] } }, () => {
      cy.restfullBooker__getBookingById__GET(examples.invalidIds.floatId, { failOnStatusCode: false }).then((response) => {
        expect([HTTP_STATUS.OK, HTTP_STATUS.NOT_FOUND]).to.include(response.status);
      });
    });
    it('RestfulBooker.Booking.Retrieve.GET: Then return 404 status code for special character ID', { req: { bugs: ['BUG-BOOKING-011'] } }, () => {
      cy.restfullBooker__getBookingById__GET(examples.invalidIds.specialId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.NOT_FOUND);
        expect(response.body).to.eq(ERROR_MESSAGE.NOT_FOUND);
      });
    });
  });

  context('RestfulBooker.Booking.Update.PUT: When valid full update is provided with authentication', () => {
    it('RestfulBooker.Booking.Update.PUT: Then return 200 status code and all fields are updated', () => {
      cy.restfullBooker__updateBooking__PUT(authToken, examples.validBookings.withAllFields.bookingId, examples.updates.full).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body.firstname).to.eq(examples.updates.full.firstname);
        expect(response.body.lastname).to.eq(examples.updates.full.lastname);
        expect(response.body.totalprice).to.eq(examples.updates.full.totalPrice);
        expect(response.body.depositpaid).to.eq(examples.updates.full.depositPaid);
        expect(response.body.bookingdates.checkin).to.eq(examples.updates.full.bookingDates.checkin);
        expect(response.body.bookingdates.checkout).to.eq(examples.updates.full.bookingDates.checkout);
        expect(response.body.additionalneeds).to.eq(examples.updates.full.additionalNeeds);
        examples.validBookings.withAllFields = { ...examples.validBookings.withAllFields, ...examples.updates.full };
      });
    });
  });

  context('RestfulBooker.Booking.Update.PUT: When update is attempted without authentication', () => {
    it('RestfulBooker.Booking.Update.PUT: Then return 403 status code and Forbidden message', () => {
      cy.restfullBooker__updateBooking__PUT('invalid_token', examples.validBookings.withoutAdditionalNeeds.bookingId, examples.updates.full, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.FORBIDDEN);
        expect(response.body).to.eq(ERROR_MESSAGE.FORBIDDEN);
      });
    });
  });

  context('RestfulBooker.Booking.Update.PUT: When update for non-existing booking ID is attempted', () => {
    it('RestfulBooker.Booking.Update.PUT: Then return 405 status code and Method Not Allowed message', { req: { bugs: ['BUG-BOOKING-007'] } }, () => {
      cy.restfullBooker__updateBooking__PUT(authToken, examples.nonExistingId, examples.updates.full, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.METHOD_NOT_ALLOWED);
        expect(response.body).to.eq(ERROR_MESSAGE.METHOD_NOT_ALLOWED);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When single field is partially updated', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then only specified field changes and others remain unchanged', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, examples.validBookings.minimalPrice.bookingId, examples.updates.partialField.updateData).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        const apiFieldName = FIELD_MAP[examples.updates.partialField.name] ?? examples.updates.partialField.name;
        expect(response.body[apiFieldName]).to.eq(examples.updates.partialField.value);
        examples.validBookings.minimalPrice[examples.updates.partialField.name] = examples.updates.partialField.value;
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When only checkin date is updated', () => {
    it(
      'RestfulBooker.Booking.PartialUpdate.PATCH: Then checkin changes and checkout is preserved using workaround',
      { req: { bugs: ['BUG-BOOKING-010'], preconditions: ['Workaround: send both dates in PATCH to avoid checkout corruption.'] } },
      () => {
        cy.restfullBooker__partialUpdateBooking__PATCH(authToken, examples.validBookings.maximalPrice.bookingId, {
          bookingDates: examples.updates.partialCheckinOnly.bookingDates,
        }).then((response) => {
          expect(response.status).to.eq(HTTP_STATUS.OK);
          expect(response.body.bookingdates.checkin).to.eq(examples.updates.partialCheckinOnly.bookingDates.checkin);
          expect(response.body.bookingdates.checkout).to.eq(examples.updates.partialCheckinOnly.bookingDates.checkout);
        });
      },
    );
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When only checkout date is updated', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then checkout changes and checkin is preserved using workaround', { req: { bugs: ['BUG-BOOKING-010'], preconditions: ['Workaround: send both dates in PATCH to avoid checkin corruption.'] } }, () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, examples.validBookings.maximalPrice.bookingId, {
        bookingDates: examples.updates.partialCheckoutOnly.bookingDates,
      }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body.bookingdates.checkout).to.eq(examples.updates.partialCheckoutOnly.bookingDates.checkout);
        expect(response.body.bookingdates.checkin).to.eq(examples.updates.partialCheckoutOnly.bookingDates.checkin);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When multiple fields are partially updated', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then all specified fields change and others remain unchanged', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, examples.validBookings.longStay.bookingId, examples.updates.partialMultipleFields).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.body.firstname).to.eq(examples.updates.partialMultipleFields.firstname);
        expect(response.body.totalprice).to.eq(examples.updates.partialMultipleFields.totalPrice);
        expect(response.body.depositpaid).to.eq(examples.updates.partialMultipleFields.depositPaid);
        expect(response.body.additionalneeds).to.eq(examples.updates.partialMultipleFields.additionalNeeds);
        expect(response.body.lastname).to.eq(examples.validBookings.longStay.lastname);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update is attempted without authentication', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 403 status code and Forbidden message', () => {
      cy.restfullBooker__partialUpdateBooking__PATCH('invalid_token', examples.validBookings.depositNotPaid.bookingId, examples.updates.partialMultipleFields, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.FORBIDDEN);
        expect(response.body).to.eq(ERROR_MESSAGE.FORBIDDEN);
      });
    });
  });

  context('RestfulBooker.Booking.PartialUpdate.PATCH: When partial update for non-existing ID is attempted', () => {
    it('RestfulBooker.Booking.PartialUpdate.PATCH: Then return 405 status code and Method Not Allowed message', { req: { bugs: ['BUG-BOOKING-007'] } }, () => {
      cy.restfullBooker__partialUpdateBooking__PATCH(authToken, examples.nonExistingId, { firstname: examples.updates.partialFieldChoices.firstname }, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.METHOD_NOT_ALLOWED);
        expect(response.body).to.eq(ERROR_MESSAGE.METHOD_NOT_ALLOWED);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When valid booking ID is deleted with authentication', () => {
    it('RestfulBooker.Booking.Delete.DELETE: Then return 201 status code and booking is deleted', { req: { bugs: ['BUG-BOOKING-008'] } }, () => {
      cy.restfullBooker__deleteBooking__DELETE(authToken, examples.validBookings.sameDayCheckout.bookingId).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.CREATED);
      });
      cy.restfullBooker__getBookingById__GET(examples.validBookings.sameDayCheckout.bookingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.NOT_FOUND);
        expect(response.body).to.eq(ERROR_MESSAGE.NOT_FOUND);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When delete is attempted without authentication', () => {
    it('RestfulBooker.Booking.Delete.DELETE: Then return 403 status code and Forbidden message', () => {
      cy.restfullBooker__deleteBooking__DELETE('invalid_token', examples.validBookings.withAllFields.bookingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.FORBIDDEN);
        expect(response.body).to.eq(ERROR_MESSAGE.FORBIDDEN);
      });
    });
  });

  context('RestfulBooker.Booking.Delete.DELETE: When non-existing booking ID is provided', () => {
    it('RestfulBooker.Booking.Delete.DELETE: Then return 405 status code and Method Not Allowed message', { req: { bugs: ['BUG-BOOKING-007'] } }, () => {
      cy.restfullBooker__deleteBooking__DELETE(authToken, examples.nonExistingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.METHOD_NOT_ALLOWED);
        expect(response.body).to.eq(ERROR_MESSAGE.METHOD_NOT_ALLOWED);
      });
    });
  });
});
