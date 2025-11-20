// Helper function to map camelCase fields to API's lowercase format
const mapBookingFields = (body) => {
  const mapped = {};

  if (body.firstname !== undefined) mapped.firstname = body.firstname;
  if (body.lastname !== undefined) mapped.lastname = body.lastname;
  if (body.totalPrice !== undefined) mapped.totalprice = body.totalPrice;
  if (body.depositPaid !== undefined) mapped.depositpaid = body.depositPaid;
  if (body.additionalNeeds !== undefined) mapped.additionalneeds = body.additionalNeeds;

  if (body.bookingDates !== undefined) {
    mapped.bookingdates = {
      checkin: body.bookingDates.checkin,
      checkout: body.bookingDates.checkout,
    };
  }

  return mapped;
};

/**
 * Get authentication token for RestfulBooker API
 * @param {Object} user - User credentials
 * @param {string} user.username - Username
 * @param {string} user.password - Password
 * @param {Object} restOptions - Additional Cypress request options
 */
Cypress.Commands.add('restfullBooker__getAuthToken__GET', (user, restOptions = {}) => {
  const { username, password } = user;

  return cy.request({
    method: 'POST',
    url: urls.api.auth,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      username,
      password,
    },
    ...restOptions,
  });
});

/**
 * Create a new booking
 * @param {Object} body - Booking data
 * @param {Object} restOptions - Additional Cypress request options
 */
Cypress.Commands.add('restfullBooker__createBooking__POST', (body, restOptions = {}) => {
  const mappedBody = mapBookingFields(body);

  return cy.request({
    method: 'POST',
    url: urls.api.booking,
    headers: {
      'Content-Type': 'application/json',
    },
    body: mappedBody,
    ...restOptions,
  });
});

/**
 * Get booking IDs with optional filters
 * @param {Object} params - Query parameters for filtering
 * @param {string} [params.firstname] - Filter by firstname
 * @param {string} [params.lastname] - Filter by lastname
 * @param {string} [params.checkin] - Filter by checkin date (YYYY-MM-DD)
 * @param {string} [params.checkout] - Filter by checkout date (YYYY-MM-DD)
 */
Cypress.Commands.add('restfullBooker__getBookingIds__GET', (params = {}) => {
  const filteredParams = {};

  if (params.firstname !== undefined) filteredParams.firstname = params.firstname;
  if (params.lastname !== undefined) filteredParams.lastname = params.lastname;
  if (params.checkin !== undefined) filteredParams.checkin = params.checkin;
  if (params.checkout !== undefined) filteredParams.checkout = params.checkout;

  return cy.request({
    method: 'GET',
    url: urls.api.booking,
    qs: filteredParams,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

/**
 * Get booking details by ID
 * @param {number} bookingId - Booking ID
 * @param {Object} restOptions - Additional Cypress request options
 */
Cypress.Commands.add('restfullBooker__getBookingById__GET', (bookingId, restOptions = {}) => {
  return cy.request({
    method: 'GET',
    url: `${urls.api.booking}/${bookingId}`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...restOptions,
  });
});

/**
 * Fully update an existing booking (PUT)
 * @param {string} token - Authentication token
 * @param {number} bookingId - Booking ID
 * @param {Object} body - Complete booking data
 * @param {Object} restOptions - Additional Cypress request options
 */
Cypress.Commands.add('restfullBooker__updateBooking__PUT', (token, bookingId, body, restOptions = {}) => {
  const mappedBody = mapBookingFields(body);

  return cy.request({
    method: 'PUT',
    url: `${urls.api.booking}/${bookingId}`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: `token=${token}`,
    },
    body: mappedBody,
    ...restOptions,
  });
});

/**
 * Partially update an existing booking (PATCH)
 * @param {string} token - Authentication token
 * @param {number} bookingId - Booking ID
 * @param {Object} body - Partial booking data to update
 * @param {Object} restOptions - Additional Cypress request options
 */
Cypress.Commands.add('restfullBooker__partialUpdateBooking__PATCH', (token, bookingId, body, restOptions = {}) => {
  const mappedBody = mapBookingFields(body);

  return cy.request({
    method: 'PATCH',
    url: `${urls.api.booking}/${bookingId}`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: `token=${token}`,
    },
    body: mappedBody,
    ...restOptions,
  });
});

/**
 * Delete a booking
 * @param {string} token - Authentication token
 * @param {number} bookingId - Booking ID
 * @param {Object} restOptions - Additional Cypress request options
 */
Cypress.Commands.add('restfullBooker__deleteBooking__DELETE', (token, bookingId, restOptions = {}) => {
  return cy.request({
    method: 'DELETE',
    url: `${urls.api.booking}/${bookingId}`,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `token=${token}`,
    },
    ...restOptions,
  });
});

/**
 * Bulk delete bookings by searching for specific criteria
 * Used for test data cleanup to ensure file independence
 * @param {string} token - Authentication token
 * @param {Object} testDataCollection - Test data object with bookings to delete
 */
Cypress.Commands.add('restfullBooker__bulkDelete__DELETE', (token, testDataCollection) => {
  const bookingsToQuery = [];

  // Helper to extract firstname/lastname from nested test data
  const extractBookingIdentifiers = (obj) => {
    if (obj && typeof obj === 'object') {
      if (obj.firstname && obj.lastname) {
        bookingsToQuery.push({ firstname: obj.firstname, lastname: obj.lastname });
      } else {
        Object.values(obj).forEach((value) => {
          if (typeof value === 'object' && value !== null) {
            extractBookingIdentifiers(value);
          }
        });
      }
    }
  };

  extractBookingIdentifiers(testDataCollection);

  cy.log(`Attempting to clean up ${bookingsToQuery.length} booking(s)`);

  // For each booking identifier, search and delete
  bookingsToQuery.forEach((identifier) => {
    cy.restfullBooker__getBookingIds__GET(identifier).then((response) => {
      if (response.status === 200 && response.body.length > 0) {
        response.body.forEach((booking) => {
          cy.restfullBooker__deleteBooking__DELETE(token, booking.bookingid, { failOnStatusCode: false }).then((deleteResponse) => {
            if (deleteResponse.status === 201) {
              cy.log(`Successfully deleted booking ID: ${booking.bookingid}`);
            }
          });
        });
      }
    });
  });
});
