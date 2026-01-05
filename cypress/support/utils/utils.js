const getRandomIndex = (arrayLength) => {
  if (typeof arrayLength !== 'number' || arrayLength <= 0 || !Number.isInteger(arrayLength)) {
    throw new RangeError('getRandomIndex: array length should be a positive integer');
  }
  return Math.floor(Math.random() * arrayLength);
};

const getRandomNumber = (min, maxNotIncluded) => {
  if (typeof min !== 'number' || typeof maxNotIncluded !== 'number' || min >= maxNotIncluded) {
    throw new RangeError('getRandomNumber: min should be a number less than maxNotIncluded');
  }
  return Math.floor(Math.random() * (maxNotIncluded - min) + min);
};

const generateRandomBoolean = () => {
  return Math.random() < 0.5;
};

const generateRandomString = (length, chars = reqs.text.allowedSymbols) => {
  if (typeof length !== 'number' || length <= 0) {
    throw new Error('Length must be a positive number');
  }

  let result = '';
  const charactersLength = chars.length;

  const addChar = () => {
    const char = chars.charAt(Math.floor(Math.random() * charactersLength));
    if (char === ' ' && (result.length === 0 || result.length === length - 1)) {
      return; // Skip leading and trailing space
    }
    result += char;
  };

  while (result.length < length) {
    addChar();
  }

  return result;
};

const generateArrayOfRandomIndices = (arrayLength, maxIndex) => {
  if (typeof arrayLength !== 'number' || arrayLength <= 0 || !Number.isInteger(arrayLength)) {
    throw new RangeError('generateArrayOfRandomIndices: array length should be a positive integer');
  }

  if (typeof maxIndex !== 'number' || maxIndex < 0 || !Number.isInteger(maxIndex)) {
    throw new RangeError('generateArrayOfRandomIndices: maxIndex should be a positive integer or zero');
  }

  if (arrayLength > maxIndex + 1) {
    throw new RangeError('generateArrayOfRandomIndices: arrayLength cannot exceed maxIndex + 1 when generating unique indices');
  }

  const indices = [];

  while (indices.length < arrayLength) {
    const index = getRandomIndex(maxIndex + 1);
    if (!indices.includes(index)) {
      indices.push(index);
    }
  }
  return indices;
};

const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new TypeError('formatDate: date must be a valid Date object');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return format.replace('YYYY', year).replace('MM', month).replace('DD', day);
};

const addDays = (date, days) => {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new TypeError('addDays: date must be a valid Date object');
  }
  if (typeof days !== 'number') {
    throw new TypeError('addDays: days must be a number');
  }

  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date, months) => {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new TypeError('addMonths: date must be a valid Date object');
  }
  if (typeof months !== 'number') {
    throw new TypeError('addMonths: months must be a number');
  }

  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const getRandomDate = (startDate, endDate) => {
  if (!(startDate instanceof Date) || isNaN(startDate)) {
    throw new TypeError('getRandomDate: startDate must be a valid Date object');
  }
  if (!(endDate instanceof Date) || isNaN(endDate)) {
    throw new TypeError('getRandomDate: endDate must be a valid Date object');
  }
  if (startDate > endDate) {
    throw new RangeError('getRandomDate: startDate must be before endDate');
  }

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
};

const cloneObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
};

const getRandomEntry = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    throw new TypeError('getRandomEntry: argument must be an object');
  }
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    throw new Error('getRandomEntry: object is empty');
  }
  return entries[getRandomIndex(entries.length)];
};

const getRandomElement = (array) => {
  if (!Array.isArray(array)) {
    throw new TypeError('getRandomElement: argument must be an array');
  }
  if (array.length === 0) {
    throw new Error('getRandomElement: array is empty');
  }
  return array[getRandomIndex(array.length)];
};

const removeProperty = (obj, path) => {
  if (typeof obj !== 'object' || obj === null) {
    throw new TypeError('removeProperty: obj must be an object');
  }
  if (typeof path !== 'string') {
    throw new TypeError('removeProperty: path must be a string');
  }

  const result = cloneObject(obj);
  const parts = path.split('.');
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) {
      return result;
    }
    current = current[parts[i]];
  }

  delete current[parts[parts.length - 1]];
  return result;
};

const generateRandomEmail = () => {
  const username = generateRandomString(8, 'abcdefghijklmnopqrstuvwxyz0123456789');
  const domain = generateRandomString(6, 'abcdefghijklmnopqrstuvwxyz');
  const tld = getRandomElement(['com', 'net', 'org', 'io']);
  return `${username}@${domain}.${tld}`;
};

const getFutureDate = (daysAhead = 1) => {
  const today = new Date();
  return formatDate(addDays(today, daysAhead));
};

const generateBookingDates = (minStayDays = 1, maxStayDays = 30) => {
  const checkinDaysAhead = getRandomNumber(1, 60);
  const stayDuration = getRandomNumber(minStayDays, maxStayDays);

  const today = new Date();
  const checkin = addDays(today, checkinDaysAhead);
  const checkout = addDays(checkin, stayDuration);

  return {
    checkin: formatDate(checkin),
    checkout: formatDate(checkout),
  };
};

const generateRandomBooking = (overrides = {}) => {
  return {
    firstname: 'User' + generateRandomString(6, 'abcdefghijklmnopqrstuvwxyz'),
    lastname: 'Test' + generateRandomString(6, 'abcdefghijklmnopqrstuvwxyz'),
    totalPrice: getRandomNumber(100, 5000),
    depositPaid: generateRandomBoolean(),
    bookingDates: generateBookingDates(),
    additionalNeeds: getRandomElement(['Breakfast', 'Lunch', 'Dinner', 'All-inclusive', 'Breakfast and Dinner', '']),
    ...overrides,
  };
};

const generateInvalidDateFormat = () => {
  const today = new Date();
  const checkinDaysAhead = getRandomNumber(5, 30);
  const checkoutDaysAhead = checkinDaysAhead + getRandomNumber(5, 15);

  const checkinDate = addDays(today, checkinDaysAhead);
  const checkoutDate = addDays(today, checkoutDaysAhead);

  const year = checkinDate.getFullYear();
  const month = String(checkinDate.getMonth() + 1).padStart(2, '0');
  const day = String(checkinDate.getDate()).padStart(2, '0');

  const checkoutYear = checkoutDate.getFullYear();
  const checkoutMonth = String(checkoutDate.getMonth() + 1).padStart(2, '0');
  const checkoutDay = String(checkoutDate.getDate()).padStart(2, '0');

  const invalidFormats = [
    // DD-MM-YYYY
    () => ({
      checkin: `${day}-${month}-${year}`,
      checkout: `${checkoutDay}-${checkoutMonth}-${checkoutYear}`,
      formatType: 'DD-MM-YYYY',
    }),
    // MM/DD/YYYY
    () => ({
      checkin: `${month}/${day}/${year}`,
      checkout: `${checkoutMonth}/${checkoutDay}/${checkoutYear}`,
      formatType: 'MM/DD/YYYY',
    }),
    // DD.MM.YYYY
    () => ({
      checkin: `${day}.${month}.${year}`,
      checkout: `${checkoutDay}.${checkoutMonth}.${checkoutYear}`,
      formatType: 'DD.MM.YYYY',
    }),
    // YYYY/MM/DD
    () => ({
      checkin: `${year}/${month}/${day}`,
      checkout: `${checkoutYear}/${checkoutMonth}/${checkoutDay}`,
      formatType: 'YYYY/MM/DD',
    }),
    // Text format
    () => ({
      checkin: checkinDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      checkout: checkoutDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      formatType: 'Text (Month DD, YYYY)',
    }),
    // YYYYMMDD (no separators)
    () => ({
      checkin: `${year}${month}${day}`,
      checkout: `${checkoutYear}${checkoutMonth}${checkoutDay}`,
      formatType: 'YYYYMMDD',
    }),
    // MM-DD-YYYY
    () => ({
      checkin: `${month}-${day}-${year}`,
      checkout: `${checkoutMonth}-${checkoutDay}-${checkoutYear}`,
      formatType: 'MM-DD-YYYY',
    }),
  ];

  return getRandomElement(invalidFormats)();
};

export default {
  getRandomIndex,
  getRandomNumber,
  generateRandomBoolean,
  generateRandomString,
  generateArrayOfRandomIndices,
  formatDate,
  addDays,
  addMonths,
  getRandomDate,
  cloneObject,
  getRandomEntry,
  getRandomElement,
  removeProperty,
  generateRandomEmail,
  getFutureDate,
  generateRandomBooking,
  generateInvalidDateFormat,
};
