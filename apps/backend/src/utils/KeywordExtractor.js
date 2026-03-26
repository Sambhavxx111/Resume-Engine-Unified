// Common stop words to exclude
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'can', 'that', 'this', 'it', 'its', 'you', 'we', 'i',
  'our', 'your', 'their', 'what', 'which', 'who', 'when', 'where', 'why',
  'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'no', 'not',
  'only', 'same', 'so', 'than', 'too', 'very', 'as', 'if', 'also', 'them',
  'then', 'there', 'these', 'those', 'any', 'are', 'being', 'such',
  'about', 'after', 'before', 'between', 'down', 'during', 'into', 'off',
  'out', 'over', 'through', 'up', 'while', 'above', 'below', 'up', 'down'
]);

// Extract keywords from text
const extractKeywordsFromText = (text) => {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Convert to lowercase
    const lowerText = text.toLowerCase();

    // Remove punctuation and special characters, keep alphanumeric, + and -
    const cleanedText = lowerText.replace(/[^\w\s\+\-]/g, ' ');

    // Split into words
    const words = cleanedText.split(/\s+/).filter(word => word.length > 0);

    // Filter: remove stop words, short words (< 3 chars), and numbers-only
    const keywords = words.filter(word => {
      // Skip if word is in stop words
      if (STOP_WORDS.has(word)) {
        return false;
      }

      // Skip if word is less than 3 characters
      if (word.length < 3) {
        return false;
      }

      // Skip if word is only numbers
      if (/^\d+$/.test(word)) {
        return false;
      }

      return true;
    });

    // Get unique keywords while preserving order
    const uniqueKeywords = [...new Set(keywords)];

    return uniqueKeywords;
  } catch (error) {
    console.error('Error extracting keywords:', error.message);
    return [];
  }
};

// Extract keywords with frequency count
const extractKeywordsWithFrequency = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const keywords = extractKeywordsFromText(text);

    // Count frequency
    const frequency = {};
    keywords.forEach(keyword => {
      frequency[keyword] = (frequency[keyword] || 0) + 1;
    });

    // Convert to array and sort by frequency (descending)
    const keywordFreq = Object.entries(frequency)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count);

    return keywordFreq;
  } catch (error) {
    console.error('Error extracting keywords with frequency:', error.message);
    return [];
  }
};

// Extract top N keywords by frequency
const extractTopKeywords = (text, limit = 10) => {
  try {
    const keywordFreq = extractKeywordsWithFrequency(text);
    return keywordFreq.slice(0, limit).map(item => item.keyword);
  } catch (error) {
    console.error('Error extracting top keywords:', error.message);
    return [];
  }
};

module.exports = {
  extractKeywordsFromText,
  extractKeywordsWithFrequency,
  extractTopKeywords
};
