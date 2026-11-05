import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Radio,
  Sliders,
  Share2,
  Monitor,
  Maximize2,
  Sparkles,
  Music,
  Disc3,
} from 'lucide-react';

import { Track, LyricLine, VisualTheme, FontSizeSetting, ColorPalette } from './types';
import { parseLRC } from './utils/lyricsParser';
import { extractPaletteFromImage } from './utils/colorExtractor';
import { requestWakeLock, releaseWakeLock } from './utils/wakeLock';
import { fetchLyrics } from './services/lyricsService';
import { DEMO_TRACKS, searchTracks } from './services/musicService';
import {
  getStoredSpotifyToken,
  fetchCurrentlyPlaying,
  handleSpotifyCallback,
} from './services/spotifyService';

import { LyricsDisplay } from './components/LyricsDisplay';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { SearchModal } from './components/SearchModal';
import { SpotifyConnectModal } from './components/SpotifyConnectModal';
import { SettingsModal } from './components/SettingsModal';
import { WindowsAppModal } from './components/WindowsAppModal';
import { ShareModal } from './components/ShareModal';
import { LockscreenClock } from './components/LockscreenClock';

const DEFAULT_PALETTE: ColorPalette = {
  primary: '#e11d48',
  secondary: '#7c3aed',
  accent: '#f43f5e',
  background: '#09090b',
};

export const App: React.FC = () => {
  // Track and playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [syncOffset, setSyncOffset] = useState(0);

  // Appearance and customization
  const [theme, setTheme] = useState<VisualTheme>('aurora');
  const [fontSize, setFontSize] = useState<FontSizeSetting>('medium');
  const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTE);
  const [showClock, setShowClock] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Spotify integration
  const [spotifyToken, setSpotifyToken] = useState<string | null>(getStoredSpotifyToken());
  const [isSpotifyActive, setIsSpotifyActive] = useState(false);
  const lastSpotifyTrackId = useRef<string>('');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSpotifyOpen, setIsSpotifyOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWindowsAppOpen, setIsWindowsAppOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Audio element reference for local/preview playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const spotifyPollIntervalRef = useRef<number | null>(null);

  // Handle URL parameters or default demo track on initial load
  useEffect(() => {
    // Check Spotify OAuth callback
    handleSpotifyCallback().then((authenticated) => {
      if (authenticated) {
        const token = getStoredSpotifyToken();
        setSpotifyToken(token);
        setIsSpotifyActive(true);
      }
    });

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
      searchTracks(query).then((results) => {
        if (results.length > 0) {
          selectTrack(results[0]);
        } else {
          selectTrack(DEMO_TRACKS[0]);
        }
      });
    } else {
      // Default to iconic Starboy track
      selectTrack(DEMO_TRACKS[0]);
    }
  }, []);

  // Update palette whenever current track artwork changes
  useEffect(() => {
    if (currentTrack?.artworkUrl) {
      extractPaletteFromImage(currentTrack.artworkUrl).then((p) => {
        setPalette(p);
      });
    }
  }, [currentTrack?.artworkUrl]);

  // Load lyrics whenever current track changes
  useEffect(() => {
    if (!currentTrack) return;

    if (currentTrack.rawLrc) {
      setLyrics(parseLRC(currentTrack.rawLrc));
      return;
    }

    setIsLoadingLyrics(true);
    fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration)
      .then((lrcString) => {
        if (lrcString) {
          setLyrics(parseLRC(lrcString));
        } else {
          setLyrics([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load lyrics:', err);
        setLyrics([]);
      })
      .finally(() => {
        setIsLoadingLyrics(false);
      });
  }, [currentTrack?.title, currentTrack?.artist]);

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const onPlay = () => {
      setIsPlaying(true);
      requestWakeLock().then(setWakeLockActive);
    };

    const onPause = () => {
      setIsPlaying(false);
      if (!isFullscreen) releaseWakeLock();
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Spotify polling loop
  useEffect(() => {
    if (!spotifyToken) {
      setIsSpotifyActive(false);
      return;
    }

    const pollSpotify = async () => {
      const state = await fetchCurrentlyPlaying(spotifyToken);
      if (state) {
        setIsSpotifyActive(true);
        setIsPlaying(state.isPlaying);
        setCurrentTime(state.progressMs / 1000);
        setDuration(state.durationMs / 1000);

        if (state.trackId !== lastSpotifyTrackId.current) {
          lastSpotifyTrackId.current = state.trackId;
          setCurrentTrack({
            id: state.trackId,
            title: state.trackName,
            artist: state.artistName,
            album: state.albumName,
            duration: state.durationMs / 1000,
            artworkUrl: state.albumArt,
            source: 'spotify',
          });
        }
      }
    };

    pollSpotify();
    spotifyPollIntervalRef.current = window.setInterval(pollSpotify, 1200);

    return () => {
      if (spotifyPollIntervalRef.current) {
        clearInterval(spotifyPollIntervalRef.current);
      }
    };
  }, [spotifyToken]);

  // Select a new track
  const selectTrack = (track: Track) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setSyncOffset(0);

    if (audioRef.current && track.previewUrl) {
      audioRef.current.src = track.previewUrl;
      audioRef.current.load();
      audioRef.current.play().catch(() => {
        // Autoplay may be restricted until user interacts
      });
    }
  };

  // Play custom local audio file
  const handleCustomAudio = (
    file: File,
    title: string,
    artist: string,
    lrcContent?: string
  ) => {
    const objectUrl = URL.createObjectURL(file);
    const customTrack: Track = {
      id: `local-${Date.now()}`,
      title,
      artist,
      album: 'Local File',
      duration: 180,
      artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      previewUrl: objectUrl,
      source: 'local',
      rawLrc: lrcContent,
    };

    selectTrack(customTrack);
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (isSpotifyActive) {
      alert('Spotify Connect mode is active! Control playback from your Spotify app.');
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  // Seek playback
  const handleSeek = (time: number) => {
    if (audioRef.current && !isSpotifyActive) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    } else {
      setCurrentTime(time);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        requestWakeLock().then(setWakeLockActive);
      }).catch(console.warn);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        if (!isPlaying) releaseWakeLock();
      }).catch(console.warn);
    }
  }, [isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Auto-hide controls on mouse idle
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    idleTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3500);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setSyncOffset((prev) => prev - 0.1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setSyncOffset((prev) => prev + 0.1);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setVolume((v) => (v === 0 ? 0.8 : 0));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleFullscreen, isPlaying]);

  // Effective time with sync offset applied
  const effectiveTime = Math.max(0, currentTime + syncOffset);

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative w-screen h-screen overflow-hidden flex flex-col justify-between font-sans transition-colors duration-1000 ${
        theme === 'minimal' ? 'bg-[#050505]' : 'bg-[#09090b]'
      }`}
      style={{
        backgroundColor: theme === 'classic' ? '#000000' : palette.background,
      }}
    >
      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="auto" />

      {/* Dynamic Ambient Background Canvas */}
      {theme === 'aurora' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="ambient-orb orb-1"
            style={{
              background: `radial-gradient(circle, ${palette.primary}66 0%, transparent 70%)`,
            }}
          />
          <div
            className="ambient-orb orb-2"
            style={{
              background: `radial-gradient(circle, ${palette.secondary}66 0%, transparent 70%)`,
            }}
          />
          <div className="absolute inset-0 backdrop-blur-[120px] bg-black/40" />
        </div>
      )}

      {theme === 'cyberpunk' && (
        <div className="absolute inset-0 pointer-events-none z-0 cyberpunk-grid opacity-25" />
      )}

      {/* Top Navigation Bar */}
      <header
        className={`w-full z-40 transition-all duration-500 px-6 py-4 flex items-center justify-between ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {/* Brand & Track Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg">
            <Disc3 className={`w-5 h-5 text-white ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            <span className="font-extrabold tracking-wider text-sm text-white">VERCI</span>
            <span className="text-[10px] uppercase font-semibold text-white/50 tracking-widest pl-1 border-l border-white/15 hidden sm:inline">
              Web
            </span>
          </div>

          {currentTrack && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Music className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white font-medium">{currentTrack.title}</span>
              <span className="text-white/30">•</span>
              <span>{currentTrack.artist}</span>
            </div>
          )}
        </div>

        {/* Lockscreen Clock */}
        {showClock && (
          <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-4">
            <LockscreenClock />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/10 transition shadow-lg"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Spotify Connect Button */}
          <button
            onClick={() => setIsSpotifyOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold backdrop-blur-md border transition ${
              isSpotifyActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
            }`}
          >
            <Radio className={`w-4 h-4 ${isSpotifyActive ? 'animate-pulse text-emerald-400' : ''}`} />
            <span className="hidden md:inline">{isSpotifyActive ? 'Spotify Connected' : 'Spotify'}</span>
          </button>

          {/* Windows Desktop App Info */}
          <button
            onClick={() => setIsWindowsAppOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/10 transition"
            title="Download / View Windows C# Desktop App"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden lg:inline">Windows App</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition"
            title="Share with Friends"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition"
            title="Theme & Display Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition"
            title="Toggle Fullscreen (F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Lyrics Viewport */}
      <main className="relative flex-1 w-full h-full z-10 overflow-hidden">
        <LyricsDisplay
          lines={lyrics}
          currentTime={effectiveTime}
          onSeek={handleSeek}
          theme={theme}
          fontSize={fontSize}
          palette={palette}
          isLoadingLyrics={isLoadingLyrics}
          hasLyrics={lyrics.length > 0}
          trackTitle={currentTrack?.title}
          trackArtist={currentTrack?.artist}
        />
      </main>

      {/* Bottom Media Player Bar */}
      <div
        className={`transition-all duration-500 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <AudioPlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          syncOffset={syncOffset}
          isFullscreen={isFullscreen}
          onTogglePlay={togglePlay}
          onSeek={handleSeek}
          onVolumeChange={setVolume}
          onNudgeSync={(delta) => setSyncOffset((prev) => prev + delta)}
          onResetSync={() => setSyncOffset(0)}
          onToggleFullscreen={toggleFullscreen}
          isSpotifyActive={isSpotifyActive}
        />
      </div>

      {/* Interactive Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTrack={selectTrack}
        onCustomAudio={handleCustomAudio}
      />

      <SpotifyConnectModal
        isOpen={isSpotifyOpen}
        onClose={() => setIsSpotifyOpen(false)}
        isConnected={isSpotifyActive}
        onDisconnect={() => {
          setIsSpotifyActive(false);
          setSpotifyToken(null);
        }}
        onTokenConnected={() => {
          setSpotifyToken(getStoredSpotifyToken());
          setIsSpotifyActive(true);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        showClock={showClock}
        setShowClock={setShowClock}
        wakeLockActive={wakeLockActive}
        syncOffset={syncOffset}
        setSyncOffset={setSyncOffset}
      />

      <WindowsAppModal
        isOpen={isWindowsAppOpen}
        onClose={() => setIsWindowsAppOpen(false)}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        currentTrack={currentTrack}
      />
    </div>
  );
};

export default App;
