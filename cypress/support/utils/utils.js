import { TEXT } from '../../constants/ui/common.ui.constraints';
import { DATE_FORMAT } from '../../constants/api/rb.booking.api.constraints';

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

const generateRandomString = (length, chars = TEXT.allowedSymbols) => {
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

const formatDate = (date, format = DATE_FORMAT) => {
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

const getFutureDate = (daysAhead = 1) => {
  const today = new Date();
  return formatDate(addDays(today, daysAhead));
};

/**
 * Returns a deep clone of `obj` with the property at `dottedPath` removed.
 * Handles dotted paths (e.g. 'bookingDates.checkin') as well as top-level keys.
 */
const removeProperty = (obj, dottedPath) => {
  if (typeof obj !== 'object' || obj === null) {
    throw new TypeError('removeProperty: first argument must be an object');
  }
  if (typeof dottedPath !== 'string' || dottedPath.length === 0) {
    throw new TypeError('removeProperty: dottedPath must be a non-empty string');
  }

  const clone = JSON.parse(JSON.stringify(obj));
  const segments = dottedPath.split('.');

  let cursor = clone;
  for (let i = 0; i < segments.length - 1; i++) {
    if (typeof cursor[segments[i]] !== 'object' || cursor[segments[i]] === null) {
      return clone; // path does not exist — nothing to remove
    }
    cursor = cursor[segments[i]];
  }
  delete cursor[segments[segments.length - 1]];
  return clone;
};

export default {
  getRandomNumber,
  generateRandomString,
  generateArrayOfRandomIndices,
  getRandomEntry,
  getRandomElement,
  getFutureDate,
  removeProperty,
};
