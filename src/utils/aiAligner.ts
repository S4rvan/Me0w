import { Word } from '../types';

/**
 * Counts phonemic syllables in a word using linguistic vowel-cluster analysis.
 */
export function countSyllables(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word || word.length <= 2) return 1;

  // Handle special suffixes
  let cleaned = word
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');

  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

const VOCALIZATION_REGEX = /^(o+h+|a+h+|yea+h*|wo+a*h*|la+|na+|mmm+|ba+by|he+y|ai+ght|ya+y)/i;
const PARTICLE_REGEX = /^(a|the|in|on|at|to|of|by|for|is|it|as|if|and|or|so|my|we)$/i;

/**
 * AI Rhythmic & Syllabic Prosody Aligner:
 * Calculates authentic vocal delivery curves, allocates time based on
 * syllabic weight, sustains held phrases, and locks to musical beats if available.
 */
export function alignWordsWithAI(
  parts: string[],
  lineStart: number,
  lineEnd: number,
  beats?: number[]
): Word[] {
  if (parts.length === 0) return [];
  const rawSpan = Math.max(0.6, lineEnd - lineStart);

  // 1. Determine singing vocal span across the measure
  let vocalSpan: number;
  if (rawSpan <= 2.0) {
    vocalSpan = rawSpan * 0.94;
  } else if (rawSpan <= 6.0) {
    vocalSpan = Math.max(1.5, rawSpan - 0.38);
  } else {
    // Extended instrumental interlude after this lyric
    const expectedTime = Math.max(2.8, parts.length * 0.52);
    vocalSpan = Math.min(rawSpan - 1.2, expectedTime);
  }

  // 2. Compute phonemic & musical weight for each word
  const weights = parts.map((w, idx) => {
    const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const syllables = countSyllables(clean);

    let weight = syllables * 1.7;

    if (VOCALIZATION_REGEX.test(clean)) {
      // Sustained melodic vocalization
      weight = Math.max(4.5, clean.length * 1.6);
    } else if (PARTICLE_REGEX.test(clean)) {
      // Rapid connecting preposition or article
      weight = Math.min(1.2, syllables * 1.0);
    } else {
      // Scale with consonant clusters (longer words like "straight", "screaming")
      weight = Math.max(1.6, weight + (clean.length > 5 ? 0.8 : 0));
    }

    // Punctuation pause / elongation
    if (/[,;—–-]$/.test(w)) {
      weight += 0.9;
    } else if (/\.{3,}$/.test(w)) {
      weight += 1.8;
    }

    // Song vocal cadence: final word of phrase is held on note
    if (idx === parts.length - 1) {
      weight *= 1.6;
    }

    return weight;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // 3. Optional: find matching beats in this interval to quantize word starts
  const lineBeats = beats && beats.length > 0
    ? beats.filter((b) => b >= lineStart && b <= lineStart + vocalSpan)
    : [];

  let cursor = lineStart;
  const words: Word[] = [];

  for (let i = 0; i < parts.length; i++) {
    const word = parts[i];
    const fraction = weights[i] / totalWeight;
    const duration = vocalSpan * fraction;

    let startTime = cursor;
    let endTime = cursor + duration;

    // If beats are available, softly snap onset to nearest musical beat
    if (lineBeats.length > 0 && i > 0 && i < parts.length - 1) {
      const nearestBeat = lineBeats.find((b) => Math.abs(b - startTime) < 0.22);
      if (nearestBeat) {
        startTime = nearestBeat;
      }
    }

    words.push({
      text: word,
      start: startTime,
      end: endTime,
    });

    cursor = endTime;
  }

  return words;
}
