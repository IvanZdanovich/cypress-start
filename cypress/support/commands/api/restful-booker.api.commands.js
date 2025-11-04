Cypress.Commands.add('restfullBooker__getAuthToken__GET', (user) => {
  const { username, password } = user;
  return cy
    .request({
      method: 'POST',
      url: urls.api.auth,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        username,
        password,
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('token');
      return response.body.token;
    });
});

Cypress.Commands.add('restfullBooker__createBooking__POST', (body, restOptions = {}) => {
  const { firstname, lastname, totalPrice, depositPaid, bookingDates, additionalNeeds = '' } = body;
  const { checkin, checkout } = bookingDates;
  return cy.request({
    method: 'POST',
    url: urls.api.booking,
    headers: { 'Content-Type': 'application/json' },
    body: {
      firstname,
      lastname,
      totalPrice,
      depositPaid,
      bookingDates: {
        checkin,
        checkout,
      },
      additionalNeeds,
    },
    ...restOptions,
  });
});

Cypress.Commands.add('restfullBooker__getBookingIds__GET', ({ firstname, lastname, checkin, checkout } = {}) => {
  return cy.request({
    method: 'GET',
    url: urls.api.booking,
    qs: { firstname, lastname, checkin, checkout },
    headers: {
      'Content-Type': 'application/json',
    },
  });
});
