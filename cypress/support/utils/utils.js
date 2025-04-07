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

export default {
  getRandomIndex,
  getRandomNumber,
  generateRandomBoolean,
  generateRandomString,
  generateArrayOfRandomIndices,
};
