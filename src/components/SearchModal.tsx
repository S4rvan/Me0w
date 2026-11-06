import React, { useState } from 'react';
import { Search, X, Music, Sparkles, Upload, FileText, Loader2 } from 'lucide-react';
import { Track } from '../types';
import { searchTracks, DEMO_TRACKS } from '../services/musicService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
  onCustomAudio: (file: File, title: string, artist: string, lrcContent?: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTrack,
  onCustomAudio,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'local'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Local file upload states
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localTitle, setLocalTitle] = useState('');
  const [localArtist, setLocalArtist] = useState('');
  const [localLrc, setLocalLrc] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const tracks = await searchTracks(query);
      setResults(tracks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFile(file);
      // Guess title from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      if (cleanName.includes('-')) {
        const parts = cleanName.split('-');
        setLocalArtist(parts[0].trim());
        setLocalTitle(parts.slice(1).join('-').trim());
      } else {
        setLocalTitle(cleanName);
      }
    }
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localFile && localTitle.trim()) {
      onCustomAudio(localFile, localTitle, localArtist || 'Unknown Artist', localLrc);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#121216] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header & Tabs */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-white">Find Music</h3>
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'search' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Search & Stream (Full Songs)
              </button>
              <button
                onClick={() => setActiveTab('local')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'local' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Custom Audio & LRC
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {activeTab === 'search' ? (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any song to stream full music (e.g. Starboy, Bohemian Rhapsody, Flowers)..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pl-12 text-white placeholder-white/40 focus:outline-none focus:border-white/30 text-sm md:text-base"
                autoFocus
              />
              <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white text-white hover:text-black px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Popular Quick Start Picks */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-white/40 uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Instant Demo Hits (1-Click Test)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_TRACKS.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => {
                      onSelectTrack(track);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-white/20 cursor-pointer transition group"
                  >
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-12 h-12 rounded-xl object-cover shadow"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-amber-300 transition">
                        {track.title}
                      </p>
                      <p className="text-xs text-white/50 truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Results */}
            {results.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-white/40 uppercase mb-3">
                  <Music className="w-3.5 h-3.5" /> Search Results ({results.length})
                </div>
                <div className="space-y-2">
                  {results.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => {
                        onSelectTrack(track);
                        onClose();
                      }}
                      className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-white/20 cursor-pointer transition group"
                    >
                      <img
                        src={track.artworkUrl}
                        alt={track.title}
                        className="w-12 h-12 rounded-xl object-cover shadow flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate group-hover:text-white transition">
                          {track.title}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {track.artist} · {track.album}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-pink-300 px-2 py-1 bg-pink-500/10 border border-pink-500/20 rounded-lg flex items-center gap-1 flex-shrink-0">
                        <Sparkles className="w-3 h-3 text-pink-400" /> Full Song
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Local File & Custom LRC Form */
          <form onSubmit={handleLocalSubmit} className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                1. Select Audio File (MP3, WAV, M4A)
              </label>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-white/40 rounded-2xl cursor-pointer bg-white/[0.02] transition">
                <Upload className="w-8 h-8 text-white/40 mb-2" />
                <span className="text-sm text-white/80 font-medium">
                  {localFile ? localFile.name : 'Click to browse or drop an audio file'}
                </span>
                <span className="text-xs text-white/40 mt-1">Plays in browser locally</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                  Track Title
                </label>
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="e.g. Bohemian Rhapsody"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                  Artist Name
                </label>
                <input
                  type="text"
                  value={localArtist}
                  onChange={(e) => setLocalArtist(e.target.value)}
                  placeholder="e.g. Queen"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Optional: Paste Custom LRC Timed Lyrics
                </label>
                <span className="text-[11px] text-white/40 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Auto-fetches from LRCLIB if left blank
                </span>
              </div>
              <textarea
                value={localLrc}
                onChange={(e) => setLocalLrc(e.target.value)}
                placeholder="[00:12.50] Lyric line 1&#10;[00:18.20] Lyric line 2..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!localFile || !localTitle.trim()}
              className="w-full bg-white hover:bg-white/90 disabled:opacity-40 text-black font-bold py-3 rounded-2xl transition shadow-xl"
            >
              Play Local Song & Display Lyrics
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
