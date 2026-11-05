import { Track } from '../types';

export const DEMO_TRACKS: Track[] = [
  {
    id: 'demo-starboy',
    title: 'Starboy (feat. Daft Punk)',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: 230,
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/71/d6/1171d6ad-3c96-e027-2af6-58028426588c/mzaf_15137631797407745471.plus.aac.p.m4a',
    source: 'demo',
    audioOffset: 15.7,
  },
  {
    id: 'demo-bohemian',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 354,
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ce/26/50/ce26500b-3375-7b58-e406-880292723fa3/00602527718385.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/64/79/1a/64791ad9-d2d4-bb36-c731-8e7d23a677bf/mzaf_10543666205797371583.plus.aac.p.m4a',
    source: 'demo',
  },
  {
    id: 'demo-goldenhour',
    title: 'golden hour',
    artist: 'JVKE',
    album: 'this is what ____ feels like (Vol. 1-4)',
    duration: 209,
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4e/c9/2b/4ec92bd0-942f-8700-1c0b-a612503d29a5/197186938927.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/c7/2b/71/c72b71be-0177-3e81-2292-9f93316bdf69/mzaf_6097874026607074558.plus.aac.p.m4a',
    source: 'demo',
  },
  {
    id: 'demo-flowers',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    duration: 200,
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/95/92/7d/95927d6b-b18c-3ca0-dbfb-7bc17887aa85/196589565576.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/e5/a0/0b/e5a00b09-b68c-dbec-c88f-a9db15c8c538/mzaf_12948719266100236113.plus.aac.p.m4a',
    source: 'demo',
  },
  {
    id: 'demo-asitwas',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: 167,
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/64/4a/01/644a01c8-2b8d-2d93-3eb4-789a425f19ee/886449987822.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/c3/97/8f/c3978f87-a226-c2ba-cf2a-5b128526ee8a/mzaf_16480579692477383783.plus.aac.p.m4a',
    source: 'demo',
  }
];

export async function searchTracks(query: string): Promise<Track[]> {
  if (!query || query.trim().length === 0) return [];

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => {
      // Get higher resolution artwork by replacing 100x100bb with 600x600bb
      const artwork = (item.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg');

      return {
        id: String(item.trackId || Math.random()),
        title: item.trackName || 'Unknown Title',
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName || 'Single',
        duration: Math.round((item.trackTimeMillis || 30000) / 1000),
        artworkUrl: artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        previewUrl: item.previewUrl,
        source: 'preview' as const,
      };
    });
  } catch (err) {
    console.error('iTunes Search API error:', err);
    return [];
  }
}
