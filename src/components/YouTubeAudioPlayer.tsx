import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerHandle {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  setVolume: (vol: number) => void;
}

interface YouTubeAudioPlayerProps {
  videoId: string | null;
  isPlaying: boolean;
  volume: number;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export const YouTubeAudioPlayer = forwardRef<YouTubePlayerHandle, YouTubeAudioPlayerProps>(
  ({ videoId, isPlaying, volume, onDuration, onEnded, onPlay, onPause }, ref) => {
    const playerRef = useRef<any>(null);
    const isReadyRef = useRef<boolean>(false);
    const containerId = 'me0w-yt-audio-player-host';

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => {
        try {
          if (playerRef.current && isReadyRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            return playerRef.current.getCurrentTime() || 0;
          }
        } catch (e) {
          // ignore transient player errors
        }
        return 0;
      },
      getDuration: () => {
        try {
          if (playerRef.current && isReadyRef.current && typeof playerRef.current.getDuration === 'function') {
            return playerRef.current.getDuration() || 0;
          }
        } catch (e) {}
        return 0;
      },
      seekTo: (seconds: number) => {
        try {
          if (playerRef.current && isReadyRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(seconds, true);
          }
        } catch (e) {}
      },
      play: () => {
        try {
          if (playerRef.current && isReadyRef.current && typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
          }
        } catch (e) {}
      },
      pause: () => {
        try {
          if (playerRef.current && isReadyRef.current && typeof playerRef.current.pauseVideo === 'function') {
            playerRef.current.pauseVideo();
          }
        } catch (e) {}
      },
      setVolume: (vol: number) => {
        try {
          if (playerRef.current && isReadyRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(Math.round(Math.max(0, Math.min(1, vol)) * 100));
          }
        } catch (e) {}
      },
    }));

    // 1. Load YouTube IFrame API script once
    useEffect(() => {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }, []);

    // 2. Initialize or re-create YouTube player
    useEffect(() => {
      let isMounted = true;

      const initPlayer = () => {
        if (!window.YT || !window.YT.Player) return;

        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {}
        }

        playerRef.current = new window.YT.Player(containerId, {
          height: '1',
          width: '1',
          videoId: videoId || '',
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              isReadyRef.current = true;
              event.target.setVolume(Math.round(volume * 100));
              if (videoId && isPlaying) {
                event.target.playVideo();
              }
              const dur = event.target.getDuration();
              if (dur && onDuration) onDuration(dur);
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // 1 = PLAYING
              if (event.data === 1) {
                if (onPlay) onPlay();
                const dur = event.target.getDuration();
                if (dur && onDuration) onDuration(dur);
              }
              // 2 = PAUSED
              else if (event.data === 2) {
                if (onPause) onPause();
              }
              // 0 = ENDED
              else if (event.data === 0) {
                if (onEnded) onEnded();
              }
            },
          },
        });
      };

      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        window.onYouTubeIframeAPIReady = () => {
          if (isMounted) initPlayer();
        };
      }

      return () => {
        isMounted = false;
        isReadyRef.current = false;
      };
    }, []);

    // 3. Update video ID when changed
    useEffect(() => {
      if (videoId && playerRef.current && isReadyRef.current) {
        try {
          if (isPlaying) {
            playerRef.current.loadVideoById(videoId);
          } else {
            playerRef.current.cueVideoById(videoId);
          }
        } catch (e) {
          console.warn('YouTube load video error:', e);
        }
      }
    }, [videoId]);

    // 4. Update play/pause state
    useEffect(() => {
      if (playerRef.current && isReadyRef.current) {
        try {
          if (isPlaying) {
            playerRef.current.playVideo();
          } else {
            playerRef.current.pauseVideo();
          }
        } catch (e) {}
      }
    }, [isPlaying]);

    // 5. Update volume
    useEffect(() => {
      if (playerRef.current && isReadyRef.current) {
        try {
          playerRef.current.setVolume(Math.round(Math.max(0, Math.min(1, volume)) * 100));
        } catch (e) {}
      }
    }, [volume]);

    return (
      <div
        style={{
          position: 'fixed',
          bottom: '-100px',
          right: '-100px',
          width: '1px',
          height: '1px',
          opacity: 0.01,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: -1,
        }}
      >
        <div id={containerId} />
      </div>
    );
  }
);
