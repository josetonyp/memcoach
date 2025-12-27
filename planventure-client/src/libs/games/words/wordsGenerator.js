/**
 * Load words from a dictionary file
 * @param {string} dictionaryPath - Path to the dictionary file (e.g., '/words.txt')
 * @returns {Promise<string[]>} Array of words
 */
export const loadDictionary = async (dictionaryPath = "/words.txt") => {
  try {
    const response = await fetch(dictionaryPath);
    if (!response.ok) {
      throw new Error(`Failed to load dictionary: ${response.statusText}`);
    }
    const text = await response.text();
    return text
      .split("\n")
      .map((word) => word.trim())
      .filter((word) => word.length > 0);
  } catch (error) {
    console.error("Error loading dictionary:", error);
    // Fallback to a basic word list
    return [
      "apple",
      "banana",
      "cherry",
      "dragon",
      "elephant",
      "forest",
      "galaxy",
      "house",
      "island",
      "jungle",
    ];
  }
};

/**
 * Generate random words from a dictionary
 * @param {string[]} dictionary - Array of available words
 * @param {number} count - Number of words to select (default 5)
 * @returns {string[]} Array of randomly selected words
 */
const selectWords = (dictionary, count = 5) => {
  if (dictionary.length === 0) return [];

  const selectedWords = [];
  const shuffled = [...dictionary].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    selectedWords.push(shuffled[i]);
  }

  return selectedWords;
};

/**
 * Split words into columns for display
 * @param {string[]} wordsArray - Array of words
 * @param {number} columns - Number of columns to organize words into (default 1)
 * @returns {string[][]} Array of arrays, each representing a column
 */
const chunkWords = (wordsArray, columns = 1) => {
  if (columns <= 0) columns = 1;

  const itemsPerColumn = Math.ceil(wordsArray.length / columns);
  const chunked = [];

  for (let i = 0; i < columns; i++) {
    const start = i * itemsPerColumn;
    const end = start + itemsPerColumn;
    chunked.push(wordsArray.slice(start, end));
  }

  return chunked;
};

/**
 * Generate and organize random words for the memory game
 * @param {string[]} dictionary - Array of available words
 * @param {number} count - Number of words to select (default 5)
 * @param {number} columns - Number of columns to organize words into (default 1)
 * @returns {{words: string[], chunkedWords: string[][]}} Object containing words and chunked words for display
 */
export const generateWords = (dictionary, count = 5, columns = 1) => {
  const selectedWords = selectWords(dictionary, count);
  return {
    words: selectedWords,
    chunkedWords: chunkWords(selectedWords, columns),
  };
};
