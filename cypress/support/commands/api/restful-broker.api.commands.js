Cypress.Commands.add('booking_POST', (data, restOptions = {}) => {
  const { body, additionalNeeds = '' } = data;
  return cy.request({
    method: 'POST',
    url: 'https://restful-booker.herokuapp.com/booking',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body,
    additionalneeds: additionalNeeds,
    ...restOptions,
  });
});
