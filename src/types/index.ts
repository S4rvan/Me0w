export interface Word {
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface LyricLine {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  words: Word[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  artworkUrl: string;
  previewUrl?: string; // audio url
  source: 'preview' | 'spotify' | 'local' | 'demo';
  rawLrc?: string;
}

export type VisualTheme = 'classic' | 'aurora' | 'fisheye' | 'cyberpunk' | 'minimal';
export type FontSizeSetting = 'small' | 'medium' | 'large' | 'huge';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface SpotifyPlaybackState {
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArt: string;
  trackId: string;
}
