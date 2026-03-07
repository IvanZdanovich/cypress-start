export const testData = {
  field: {
    emptyValue: '',
    passwordType: 'password',
  },
  invalidCredentials: {
    password: 'invalid_password_' + utils.generateRandomString(8),
  },
};
