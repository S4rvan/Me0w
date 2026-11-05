const LRCLIB_BASE = 'https://lrclib.net/api';

// Memory cache to avoid repeated requests
const lyricsCache = new Map<string, string | null>();

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-–(].*?(remaster|version|deluxe|edition|bonus|feat|ft\.).*?[)\]]?/gi, '')
    .replace(/\s*\(feat\..*?\)/gi, '')
    .replace(/\s*\[.*?\]/g, '')
    .trim();
}

export async function fetchLyrics(title: string, artist: string, duration?: number): Promise<string | null> {
  const cacheKey = `${title.toLowerCase()}:::${artist.toLowerCase()}`;
  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey) || null;
  }

  const variations = [
    { t: title, a: artist },
    { t: cleanTitle(title), a: artist },
    { t: cleanTitle(title), a: cleanTitle(artist) },
  ];

  for (const v of variations) {
    try {
      // 1. Try exact get if duration is provided
      if (duration && duration > 0) {
        const getUrl = `${LRCLIB_BASE}/get?track_name=${encodeURIComponent(v.t)}&artist_name=${encodeURIComponent(v.a)}&duration=${Math.round(duration)}`;
        const res = await fetch(getUrl, {
          headers: { 'User-Agent': 'VerciWeb/1.0 (https://github.com/verci-web)' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.syncedLyrics) {
            lyricsCache.set(cacheKey, data.syncedLyrics);
            return data.syncedLyrics;
          }
        }
      }

      // 2. Try search endpoint
      const searchUrl = `${LRCLIB_BASE}/search?track_name=${encodeURIComponent(v.t)}&artist_name=${encodeURIComponent(v.a)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'VerciWeb/1.0 (https://github.com/verci-web)' }
      });
      if (searchRes.ok) {
        const items = await searchRes.json();
        if (Array.isArray(items)) {
          // Find first entry with syncedLyrics
          const withSync = items.find((item) => item.syncedLyrics && item.syncedLyrics.trim().length > 0);
          if (withSync) {
            lyricsCache.set(cacheKey, withSync.syncedLyrics);
            return withSync.syncedLyrics;
          }
          // Fallback to plainLyrics if no sync available
          const withPlain = items.find((item) => item.plainLyrics);
          if (withPlain) {
            lyricsCache.set(cacheKey, withPlain.plainLyrics);
            return withPlain.plainLyrics;
          }
        }
      }
    } catch (err) {
      console.warn(`LRCLIB fetch error for "${v.t} - ${v.a}":`, err);
    }
  }

  // General free-form query fallback
  try {
    const generalUrl = `${LRCLIB_BASE}/search?q=${encodeURIComponent(`${cleanTitle(title)} ${artist}`)}`;
    const res = await fetch(generalUrl, {
      headers: { 'User-Agent': 'VerciWeb/1.0 (https://github.com/verci-web)' }
    });
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items)) {
        const withSync = items.find((item) => item.syncedLyrics);
        if (withSync) {
          lyricsCache.set(cacheKey, withSync.syncedLyrics);
          return withSync.syncedLyrics;
        }
      }
    }
  } catch (err) {
    console.warn('LRCLIB general search error:', err);
  }

  lyricsCache.set(cacheKey, null);
  return null;
}
