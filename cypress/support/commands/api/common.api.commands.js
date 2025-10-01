Cypress.Commands.add('getAuthToken', (user) => {
  const { username, password } = user;
  return cy
    .request({
      method: 'POST',
      url: 'https://restful-booker.herokuapp.com/auth',
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
