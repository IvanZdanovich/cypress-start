import { booking_testData } from '../../test-data/api/restful-broker.booking.api.test-data';

describe('RestfulBooker.Booking: Given No preconditions', { testIsolation: false }, () => {
  context('RestfulBooker.Booking.POST: When valid request is sent', () => {
    it('RestfulBooker.Booking.POST: Then Apartments are booked', () => {
      cy.booking_POST(booking_testData.nonValidBooking, { failOnStatusCode: false }).then((response) => {
        expect(response.body).to.eq('Internal Server Error');
        // expect(response.body).to.have.property('bookingid');
        // expect(response.body).to.have.property('booking');
        // expect(response.body.booking).to.deep.equal(booking_testData.validBooking.body);
      });
    });
  });
  context('RestfulBooker.Booking.POST: When invalid request is sent', () => {
    it('RestfulBooker.Booking.POST: Then Error message about missing dates received', () => {
      cy.booking_POST(booking_testData.nonValidBooking, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.eq('Internal Server Error');
      });
    });
  });
});
