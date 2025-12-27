/**
 * Generate random two-digit number pairs for the memory game
 * @param {number} count - Number of pairs to generate (default 5)
 * @returns {string[]} Array of two-digit number strings (00-99)
 */
const pairs = (count = 5) => {
  const pairs = [];
  for (let i = 0; i < count; i++) {
    const n = Math.floor(Math.random() * 100); // 0-99 inclusive
    pairs.push(String(n).padStart(2, "0")); // two-digit numbers 00-99
  }
  return pairs;
};

/**
 * Split pairs into lines of a specified size for display
 * @param {string[]} pairsArray - Array of number pair strings
 * @param {number} size - Number of pairs per line (default 5)
 * @returns {string[][]} Array of arrays, each containing up to `size` pairs
 */
const chunkPairs = (pairsArray, size = 5) => {
  const lines = [];
  for (let i = 0; i < pairsArray.length; i += size) {
    lines.push(pairsArray.slice(i, i + size));
  }
  return lines;
};

/**
 * Generate and organize random number pairs for the memory game
 * @param {number} count - Number of pairs to generate (default 5)
 * @param {number} chunkSize - Number of pairs per line (default 5)
 * @params {array} chunkPairs - Array of arrays, each containing up to `chunkSize` pairs
 * @returns {{pairs: string[][], count: number}} Object containing chunked pairs and total count
 */
export const generatePairs = (count = 5, chunkSize = 5) => {
  const generatedPairs = pairs(count);
  return {
    pairs: generatedPairs,
    chunkedPairs: chunkPairs(generatedPairs, chunkSize),
  };
};
