const getRandomIndex = (arrayLength) => {
  if (typeof arrayLength !== 'number' || arrayLength <= 0 || !Number.isInteger(arrayLength)) {
    throw new RangeError('getRandomIndex: array length should be a positive integer');
  }
  return Math.floor(Math.random() * arrayLength);
};

const getRandomNumber = (min, max) => {
  if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
    throw new RangeError('getRandomNumber: min should be a number less than max');
  }
  return Math.floor(Math.random() * (max - min + 1) + min);
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
};
