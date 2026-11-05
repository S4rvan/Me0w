import { LyricLine, Word } from '../types';

const TIME_REGEX = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
const WORD_TIME_REGEX = /<(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?>/g;
const SECONDS_PER_CHAR = 0.085; // Natural singing rate

export function parseLRC(lrc: string): LyricLine[] {
  if (!lrc || typeof lrc !== 'string') return [];

  const rawLines = lrc.split('\n');
  const timedItems: { time: number; text: string; raw: string }[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata headers like [ar:...], [ti:...], [al:...]
    if (/^\[(ti|ar|al|by|offset|length|re|ve):/i.test(trimmed)) {
      continue;
    }

    // Find all [mm:ss.xx] timestamps on this line
    const timestamps: number[] = [];
    let match: RegExpExecArray | null;
    const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const fracStr = match[3] || '0';
      const frac = parseFloat('0.' + fracStr);
      timestamps.push(min * 60 + sec + frac);
    }

    if (timestamps.length === 0) continue;

    // Remove all [mm:ss.xx] timestamps to get the lyric text
    const cleanText = trimmed.replace(TIME_REGEX, '').trim();

    for (const time of timestamps) {
      timedItems.push({
        time,
        text: cleanText.replace(WORD_TIME_REGEX, '').trim(),
        raw: cleanText,
      });
    }
  }

  // Sort chronologically
  timedItems.sort((a, b) => a.time - b.time);

  const result: LyricLine[] = [];

  for (let i = 0; i < timedItems.length; i++) {
    const current = timedItems[i];
    const startTime = current.time;
    // Next line's time or start + 5s for the last line
    const nextTime = i + 1 < timedItems.length ? timedItems[i + 1].time : startTime + 5.5;

    // Check if line contains per-word tags like <mm:ss.xx>
    const words = parseOrInterpolateWords(current.text, current.raw, startTime, nextTime);

    result.push({
      id: i,
      start: startTime,
      end: nextTime,
      text: current.text,
      words,
    });
  }

  return result;
}

function parseOrInterpolateWords(
  cleanText: string,
  rawWithWordTags: string,
  lineStart: number,
  lineEnd: number
): Word[] {
  // Try parsing embedded word tags if available: e.g. "word <00:12.34> next <00:13.00>"
  if (WORD_TIME_REGEX.test(rawWithWordTags)) {
    // Has explicit per-word tags
    const parts = rawWithWordTags.split(/(<\d{1,2}:\d{2}(?:\.\d{1,3})?>)/);
    const words: Word[] = [];
    let currentWord = '';
    let wordStart = lineStart;

    for (const part of parts) {
      const match = /<(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?>/.exec(part);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const frac = parseFloat('0.' + (match[3] || '0'));
        const tagTime = min * 60 + sec + frac;

        if (currentWord.trim()) {
          words.push({
            text: currentWord.trim(),
            start: wordStart,
            end: tagTime,
          });
          currentWord = '';
        }
        wordStart = tagTime;
      } else {
        currentWord += part;
      }
    }
    if (currentWord.trim()) {
      words.push({
        text: currentWord.trim(),
        start: wordStart,
        end: lineEnd,
      });
    }
    if (words.length > 0) return words;
  }

  // Fallback: musical flow time distribution (follows vocal phrasing and chorus melismas)
  const parts = cleanText.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];

  const rawSpan = Math.max(0.8, lineEnd - lineStart);

  // If gap between lines is long (> 6.5s), vocal singing takes the natural phrase (3.5-5.5s), rest is instrumental silence
  const vocalSpan = rawSpan > 6.5
    ? Math.min(rawSpan - 1.2, Math.max(3.6, rawSpan * 0.6))
    : Math.max(0.6, rawSpan - 0.2); // natural 0.2s breath before next line

  // Compute musical weights:
  // Chorus vocalizations ("ooh", "aah", "yeah", "baby", "woah", etc.) are held notes and get extended duration
  // Short particles ("the", "a", "in", "to") are quick
  const VOCALIZATION_REGEX = /^(o+h+|a+h+|yea+h*|wo+a*h*|la+|na+|mmm+|ba+by|he+y|ai+ght|ya+y)/i;
  const PARTICLE_REGEX = /^(a|the|in|on|at|to|of|by|for|is|it|as|if)$/i;

  const weights = parts.map((w) => {
    const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (VOCALIZATION_REGEX.test(clean)) {
      // Sustained chorus melisma: 4.5x weight
      return Math.max(4.5, clean.length * 1.8);
    }
    if (PARTICLE_REGEX.test(clean)) {
      return 1.2;
    }
    // Standard words: proportional to syllable/character length with base floor
    return Math.max(2.2, clean.length);
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let cursor = lineStart;
  const words: Word[] = [];

  for (let i = 0; i < parts.length; i++) {
    const word = parts[i];
    const fraction = weights[i] / totalWeight;
    const duration = vocalSpan * fraction;

    words.push({
      text: word,
      start: cursor,
      end: cursor + duration,
    });

    cursor += duration;
  }

  return words;
}
