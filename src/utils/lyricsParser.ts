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

  // Fallback: high-precision musical flow distribution (vocal cadence + held notes)
  const parts = cleanText.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];

  const rawSpan = Math.max(0.6, lineEnd - lineStart);

  // In vocal delivery:
  // - Rapid successive lines (under 2s): vocal occupies 92-95% of the span
  // - Standard lines (2s to 6s): vocal occupies 86-90% of the span, leaving a natural 0.35s-0.5s breath before next line
  // - Extended breaks / bridge (> 6s): line is sung across 3.5s to 6.5s depending on word count, leaving remainder for instrumental
  let vocalSpan: number;
  if (rawSpan <= 2.0) {
    vocalSpan = rawSpan * 0.94;
  } else if (rawSpan <= 6.0) {
    vocalSpan = Math.max(1.5, rawSpan - 0.42);
  } else {
    const expectedTime = Math.max(2.8, parts.length * 0.48);
    vocalSpan = Math.min(rawSpan - 1.2, expectedTime);
  }

  // Compute musical weights:
  // - Chorus vocalizations ("ooh", "aah", "yeah", "baby", "woah", etc.) get extended duration (held notes)
  // - Short particles ("a", "the", "in", "to", "on", "at") get lower duration
  // - Last word of a phrase is almost always sustained in singing -> 1.55x bonus
  const VOCALIZATION_REGEX = /^(o+h+|a+h+|yea+h*|wo+a*h*|la+|na+|mmm+|ba+by|he+y|ai+ght|ya+y)/i;
  const PARTICLE_REGEX = /^(a|the|in|on|at|to|of|by|for|is|it|as|if|and|or|so)$/i;

  const weights = parts.map((w, idx) => {
    const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
    let weight = 2.0;

    if (VOCALIZATION_REGEX.test(clean)) {
      weight = Math.max(4.0, clean.length * 1.5);
    } else if (PARTICLE_REGEX.test(clean)) {
      weight = 1.1;
    } else {
      weight = Math.max(1.8, Math.min(6.0, clean.length * 0.85 + 1.2));
    }

    if (/[,;—–-]$/.test(w)) {
      weight += 0.8;
    }

    if (idx === parts.length - 1) {
      weight *= 1.55;
    }

    return weight;
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
