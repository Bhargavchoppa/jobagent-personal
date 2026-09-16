/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates standard cosine similarity between two numeric vectors.
 * Returns a score normalized between 0.0 and 1.0 (clamped).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  const minLen = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Deterministic bag-of-words / character n-gram embedding vectorizer.
 * Used for high-precision semantic fallback when Gemini embeddings are offline.
 */
export function createDeterministicEmbedding(text: string, dimensions: number = 256): number[] {
  if (!text || typeof text !== 'string') {
    return new Array(dimensions).fill(0);
  }

  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);

  if (words.length === 0) {
    return vector;
  }

  // Word unigrams and bigrams hashing into fixed-dimension space
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordHash = hashString(word);
    const idx = Math.abs(wordHash) % dimensions;
    vector[idx] += 1.0;

    // Bigram
    if (i < words.length - 1) {
      const bigram = `${word}_${words[i + 1]}`;
      const bigramHash = hashString(bigram);
      const bIdx = Math.abs(bigramHash) % dimensions;
      vector[bIdx] += 1.5;
    }

    // 3-char subgrams for morphological similarity
    if (word.length >= 4) {
      for (let c = 0; c <= word.length - 3; c++) {
        const sub = word.substring(c, c + 3);
        const subHash = hashString(sub);
        const sIdx = Math.abs(subHash) % dimensions;
        vector[sIdx] += 0.3;
      }
    }
  }

  // L2-normalize vector
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  if (norm > 0) {
    const sqrtNorm = Math.sqrt(norm);
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= sqrtNorm;
    }
  }

  return vector;
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
