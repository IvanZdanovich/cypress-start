export const booking_testData = {
  validBooking: {
    body: {
      firstname: 'Jim',
      lastname: 'Brown',
      totalprice: 111,
      depositpaid: true,
      bookingdates: {
        checkin: '2018-01-01',
        checkout: '2019-01-01',
      },
    },
    additionalNeeds: 'Breakfast',
  },
  nonValidBooking: {
    body: {
      firstname: 'James',
      // lastname is missing
      totalprice: 'one hundred eleven', // invalid data type
      depositpaid: 'yes', // invalid data type
    },
  },
};
