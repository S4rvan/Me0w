import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Radio,
  Sliders,
  Share2,
  Maximize2,
  Disc3,
  Lightbulb,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';

import {
  Track,
  LyricLine,
  VisualTheme,
  FontSizeSetting,
  ColorPalette,
  EdgeLightMode,
} from './types';
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

import { ThreadLyricsDisplay } from './components/ThreadLyricsDisplay';
import { StringLights } from './components/StringLights';
import { EdgeLights } from './components/EdgeLights';
import { RetroTurntable } from './components/RetroTurntable';
import { WaterSurface, RippleEvent } from './components/WaterSurface';
import { SearchModal } from './components/SearchModal';
import { SpotifyConnectModal } from './components/SpotifyConnectModal';
import { SettingsModal } from './components/SettingsModal';
import { WindowsAppModal } from './components/WindowsAppModal';
import { ShareModal } from './components/ShareModal';
import { LockscreenClock } from './components/LockscreenClock';
import { ColorWheelModal } from './components/ColorWheelModal';

const savedEdgeColor = typeof window !== 'undefined' ? localStorage.getItem('verci_custom_edge_color') : null;
const DEFAULT_PALETTE: ColorPalette = {
  primary: savedEdgeColor || '#f43f5e',
  secondary: '#fb7185',
  accent: '#fb923c',
  background: '#000000',
};

export const App: React.FC = () => {
  // App Branding Name (persisted)
  const [appName, setAppNameState] = useState<string>(() => {
    return localStorage.getItem('verci_app_name') || 'Me0w';
  });

  const setAppName = (name: string) => {
    setAppNameState(name);
    localStorage.setItem('verci_app_name', name);
    document.title = `${name} — Synchronized Lyrics`;
  };

  // Track and playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolume] = useState(0.85);
  const [syncOffset, setSyncOffset] = useState(0);

  // Appearance: Pure Black Screen + Soft String Lights
  const [theme, setTheme] = useState<VisualTheme>('classic');
  const [fontSize, setFontSize] = useState<FontSizeSetting>('medium');
  const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTE);
  const [stringLightsEnabled, setStringLightsEnabled] = useState(true);
  const [stringLightsIntensity, setStringLightsIntensity] = useState(0.7);
  const [edgeLightMode, setEdgeLightMode] = useState<EdgeLightMode>('neon');
  const [showClock, setShowClock] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Water Ripple & Instrumental States
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const [isInstrumental, setIsInstrumental] = useState(true);

  const handleSpawnRipple = useCallback((ripple: RippleEvent) => {
    setRipples((prev) => [...prev.slice(-8), ripple]);
  }, []);

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
  const [isColorWheelOpen, setIsColorWheelOpen] = useState(false);

  // Audio element reference & 60fps frame loop
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);
  const spotifyPollIntervalRef = useRef<number | null>(null);

  // Initial setup: check Spotify OAuth or URL search params
  useEffect(() => {
    document.title = `${appName} — Synchronized Lyrics`;

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
          selectTrack(results[0], false);
        } else {
          selectTrack(DEMO_TRACKS[0], false);
        }
      });
    } else {
      selectTrack(DEMO_TRACKS[0], false);
    }
  }, []);

  // Extract color palette whenever album art changes
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
        console.warn('Lyrics fetch error:', err);
        setLyrics([]);
      })
      .finally(() => {
        setIsLoadingLyrics(false);
      });
  }, [currentTrack?.title, currentTrack?.artist]);

  // 60 FPS Animation Loop
  useEffect(() => {
    lastFrameTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      if (isPlaying) {
        const audio = audioRef.current;
        if (audio && !audio.paused && !isSpotifyActive) {
          // Continuous 60fps high-precision clock (eliminates HTML5 audio 250ms step-stutter)
          setCurrentTime((prev) => {
            const target = audio.currentTime;
            const diff = target - prev;
            // If user sought or audio jumped, snap immediately
            if (Math.abs(diff) > 0.35) {
              return target;
            }
            // Otherwise advance smoothly by frame delta and gently reconcile minor audio clock drift
            return prev + delta + diff * 0.1;
          });
        } else {
          // Virtual timer or Spotify progress interpolation
          setCurrentTime((prev) => {
            if (duration > 0 && prev >= duration) {
              setIsPlaying(false);
              return duration;
            }
            return prev + delta;
          });
        }
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isPlaying, isSpotifyActive, duration]);

  // Audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
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
      setCurrentTime(0);
    };

    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [isFullscreen]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Spotify Polling Loop with Smooth Reconcile
  useEffect(() => {
    if (!spotifyToken) {
      setIsSpotifyActive(false);
      return;
    }

    const pollSpotify = async () => {
      try {
        const state = await fetchCurrentlyPlaying(spotifyToken);
        if (state) {
          setIsSpotifyActive(true);
          setIsPlaying(state.isPlaying);
          const serverTime = state.progressMs / 1000;

          // If Spotify is paused on phone, snap time to exact paused progress and ensure audio is paused
          if (!state.isPlaying) {
            setCurrentTime(serverTime);
            if (audioRef.current && !audioRef.current.paused) {
              audioRef.current.pause();
            }
          } else {
            // Reconcile time if drifting by more than 0.8s
            setCurrentTime((prev) => {
              if (Math.abs(prev - serverTime) > 0.8) {
                return serverTime;
              }
              return prev;
            });
            // Ensure any local preview audio is paused when Spotify is active
            if (audioRef.current && !audioRef.current.paused) {
              audioRef.current.pause();
            }
          }

          if (state.durationMs > 0) {
            setDuration(state.durationMs / 1000);
          }

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
        } else {
          // Playback stopped on phone, closed, or 204 No Content
          setIsPlaying(false);
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
          }
        }
      } catch (err) {
        console.warn('Spotify poll error:', err);
      }
    };

    pollSpotify();
    spotifyPollIntervalRef.current = window.setInterval(pollSpotify, 1000);

    return () => {
      if (spotifyPollIntervalRef.current) {
        clearInterval(spotifyPollIntervalRef.current);
      }
    };
  }, [spotifyToken]);

  // Select a new track
  const selectTrack = (track: Track, autoPlay = true) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setSyncOffset(0);
    setDuration(track.duration || 180);

    if (audioRef.current && track.previewUrl) {
      audioRef.current.src = track.previewUrl;
      audioRef.current.load();
      if (autoPlay) {
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
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
      duration: 200,
      artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      previewUrl: objectUrl,
      source: 'local',
      rawLrc: lrcContent,
    };

    selectTrack(customTrack, true);
  };

  // Next / Previous Track Skipping Controls
  const handleNextTrack = () => {
    if (isSpotifyActive && spotifyToken) {
      fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: `Bearer ${spotifyToken}` },
      }).catch(console.warn);
      return;
    }

    const currentIndex = DEMO_TRACKS.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % DEMO_TRACKS.length : 0;
    selectTrack(DEMO_TRACKS[nextIndex], true);
  };

  const handlePrevTrack = () => {
    if (isSpotifyActive && spotifyToken) {
      fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { Authorization: `Bearer ${spotifyToken}` },
      }).catch(console.warn);
      return;
    }

    const currentIndex = DEMO_TRACKS.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : DEMO_TRACKS.length - 1;
    selectTrack(DEMO_TRACKS[prevIndex], true);
  };

  // Play / Pause toggle with instant UI response & Spotify API remote command
  const togglePlay = () => {
    const nextPlayState = !isPlaying;

    // 1. Instantly update UI (turntable stops/starts, tonearm moves with 0ms delay)
    setIsPlaying(nextPlayState);

    // 2. Control HTML5 audio element
    const audio = audioRef.current;
    if (audio) {
      if (!nextPlayState) {
        audio.pause();
      } else if (!isSpotifyActive && currentTrack?.previewUrl) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Audio play error, falling back to visual timer:', err);
            setIsPlaying(true);
          });
      }
    }

    // 3. Command Spotify API if active
    if (isSpotifyActive && spotifyToken) {
      const endpoint = nextPlayState
        ? 'https://api.spotify.com/v1/me/player/play'
        : 'https://api.spotify.com/v1/me/player/pause';

      fetch(endpoint, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${spotifyToken}` },
      }).catch((err) => {
        console.warn('Spotify playback remote command error:', err);
      });
    }
  };

  // Seek playback
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current && !isSpotifyActive && currentTrack?.previewUrl) {
      audioRef.current.currentTime = time;
    }

    if (isSpotifyActive && spotifyToken) {
      fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${Math.round(time * 1000)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${spotifyToken}` },
      }).catch(console.warn);
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

  // Auto-hide top controls on mouse idle for pure black screen immersion
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    idleTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3200);
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
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        setStringLightsEnabled((prev) => !prev);
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsColorWheelOpen((prev) => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setSyncOffset((prev) => prev - 0.1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setSyncOffset((prev) => prev + 0.1);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setVolume((v) => (v === 0 ? 0.8 : 0));
      } else if (e.code === 'KeyN') {
        e.preventDefault();
        handleNextTrack();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        handlePrevTrack();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleFullscreen, isPlaying]);

  // Effective time with track audio offset and user sync offset applied
  const effectiveTime = Math.max(0, currentTime + (currentTrack?.audioOffset || 0) + syncOffset);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between font-sans bg-black text-white select-none transition-colors duration-500"
    >
      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="auto" />

      {/* Interactive Water Surface: Ripples on Lyrics Spawn, Mouse Trail & Rain Drops */}
      <WaterSurface
        externalRipples={ripples}
        isInstrumental={isInstrumental}
      />

      {/* Screen Border Edge Lights (Ambilight glow matching the reference video) */}
      <EdgeLights
        mode={edgeLightMode}
        palette={palette}
        isPlaying={isPlaying}
        intensity={0.8}
      />

      {/* Gentle, Cozy String Lights (Fairy Lights) Along Top */}
      {stringLightsEnabled && (
        <StringLights
          intensity={stringLightsIntensity}
          isPlaying={isPlaying}
        />
      )}

      {/* Top Header Navigation Bar (Discreet, auto-hiding) */}
      <header
        className={`w-full z-40 transition-all duration-500 px-6 py-4 flex items-center justify-between ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/10 shadow-lg">
            <Disc3 className={`w-4 h-4 text-pink-300 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span className="font-bold tracking-widest text-xs uppercase text-pink-200/90">{appName}</span>
          </div>
        </div>

        {/* Lockscreen Clock */}
        {showClock && (
          <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-4">
            <LockscreenClock />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle String Lights Button */}
          <button
            onClick={() => setStringLightsEnabled((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition ${
              stringLightsEnabled
                ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
            }`}
            title="Toggle String Lights (Hotkey: L)"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">String Lights</span>
          </button>

          {/* Circular Color Wheel Button for Borderline Lights */}
          <button
            onClick={() => setIsColorWheelOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border border-white/10 bg-white/10 hover:bg-white/20 text-white transition active:scale-95 shadow-md"
            title="Borderline Lights Color Wheel (Hotkey: C)"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: palette.primary }}
            />
            <span className="hidden sm:inline">Border Lights</span>
          </button>

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs backdrop-blur-md border border-white/10 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Spotify Connect Button */}
          <button
            onClick={() => setIsSpotifyOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition ${
              isSpotifyActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isSpotifyActive ? 'animate-pulse text-emerald-400' : ''}`} />
            <span className="hidden md:inline">{isSpotifyActive ? 'Spotify Connected' : 'Spotify'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition"
            title="Share with Friends"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition"
            title="Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition"
            title="Toggle Fullscreen (F)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Vision Viewport: Black Water Surface + TV Girl Pastel Words on Silk Thread */}
      <main className="relative flex-1 w-full h-full z-10 overflow-hidden bg-black">
        <ThreadLyricsDisplay
          lines={lyrics}
          currentTime={effectiveTime}
          onSeek={handleSeek}
          fontSize={fontSize}
          isLoadingLyrics={isLoadingLyrics}
          hasLyrics={lyrics.length > 0}
          trackTitle={currentTrack?.title}
          trackArtist={currentTrack?.artist}
          onOpenSearch={() => setIsSearchOpen(true)}
          onSpawnRipple={handleSpawnRipple}
          isInstrumental={isInstrumental}
          setIsInstrumental={setIsInstrumental}
        />
      </main>

      {/* Retro Illustrated Turntable Deck (Matches User's Sketch) */}
      <RetroTurntable
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        isSpotifyActive={isSpotifyActive}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
      />

      {/* Bottom-Right Minimalist Sync Nudge & Volume Bar */}
      <div
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-3 transition-all duration-500 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        {/* Sync Nudge Pill */}
        <div className="flex items-center gap-1 bg-black/70 backdrop-blur-xl border border-white/10 px-2.5 py-1.5 rounded-2xl text-xs">
          <span className="text-white/40 text-[10px] mr-1 uppercase tracking-wider font-semibold">Sync:</span>
          <button
            onClick={() => setSyncOffset((prev) => prev - 0.1)}
            className="px-1.5 py-0.5 rounded hover:bg-white/15 text-pink-200/80 active:scale-95 font-mono"
            title="Lyrics later (-0.1s)"
          >
            -0.1s
          </button>
          <span className="font-mono text-white/90 text-xs px-1">
            {syncOffset >= 0 ? `+${syncOffset.toFixed(1)}s` : `${syncOffset.toFixed(1)}s`}
          </span>
          <button
            onClick={() => setSyncOffset((prev) => prev + 0.1)}
            className="px-1.5 py-0.5 rounded hover:bg-white/15 text-pink-200/80 active:scale-95 font-mono"
            title="Lyrics earlier (+0.1s)"
          >
            +0.1s
          </button>
          {syncOffset !== 0 && (
            <button
              onClick={() => setSyncOffset(0)}
              className="p-1 rounded hover:bg-white/15 text-white/40 hover:text-white ml-0.5"
              title="Reset sync"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Volume Slider */}
        <div className="hidden sm:flex items-center gap-2 bg-black/70 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-2xl">
          <button
            onClick={() => setVolume((v) => (v === 0 ? 0.8 : 0))}
            className="text-white/70 hover:text-white transition"
          >
            {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-14 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-300"
          />
        </div>
      </div>

      {/* Interactive Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTrack={(t) => selectTrack(t, true)}
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
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        edgeLightMode={edgeLightMode}
        setEdgeLightMode={setEdgeLightMode}
        edgeIntensity={stringLightsIntensity}
        setEdgeIntensity={setStringLightsIntensity}
        showClock={showClock}
        setShowClock={setShowClock}
        wakeLockActive={wakeLockActive}
        syncOffset={syncOffset}
        setSyncOffset={setSyncOffset}
        appName={appName}
        setAppName={setAppName}
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

      {/* Circular Color Wheel Modal for Borderline Lights (From User Reference Image) */}
      <ColorWheelModal
        isOpen={isColorWheelOpen}
        onClose={() => setIsColorWheelOpen(false)}
        currentPalette={palette}
        onUpdatePalette={setPalette}
        edgeLightMode={edgeLightMode}
        onUpdateEdgeMode={setEdgeLightMode}
        edgeIntensity={stringLightsIntensity}
        onUpdateEdgeIntensity={setStringLightsIntensity}
      />
    </div>
  );
};

export default App;
