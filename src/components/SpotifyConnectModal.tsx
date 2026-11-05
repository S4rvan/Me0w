import React, { useState } from 'react';
import {
  X,
  Radio,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  Search,
  Disc3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import {
  initiateSpotifyLogin,
  setSpotifyToken,
  clearSpotifyAuth,
  getEffectiveClientId,
  saveClientId,
  getRedirectUri,
} from '../services/spotifyService';

interface SpotifyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onDisconnect: () => void;
  onTokenConnected: () => void;
  onOpenSearch?: () => void;
}

export const SpotifyConnectModal: React.FC<SpotifyConnectModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  onDisconnect,
  onTokenConnected,
  onOpenSearch,
}) => {
  const currentClientId = getEffectiveClientId();
  const [clientIdInput, setClientIdInput] = useState(currentClientId);
  const [tokenInput, setTokenInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [mode, setMode] = useState<'oneclick' | 'manual'>('oneclick');

  if (!isOpen) return null;

  const redirectUri = getRedirectUri();
  const hasConfiguredClientId = currentClientId.length > 0;

  const handleStartConnect = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const idToUse = clientIdInput.trim() || currentClientId;
    if (!idToUse) {
      setShowAdvanced(true);
      return;
    }
    saveClientId(idToUse);
    try {
      initiateSpotifyLogin(idToUse);
    } catch (err) {
      alert('Failed to connect to Spotify. Please check the Client ID.');
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setSpotifyToken(tokenInput.trim());
    onTokenConnected();
    onClose();
  };

  const handleCopyRedirect = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#111116] border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1db954]/20 border border-[#1db954]/40 flex items-center justify-center text-[#1db954]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Spotify Live Sync</h3>
              <p className="text-xs text-white/50">Real-time synchronized celestial lyrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {isConnected ? (
            /* Already Connected Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1db954]/20 text-[#1db954] mx-auto flex items-center justify-center border border-[#1db954]/40 shadow-[0_0_30px_rgba(29,185,84,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Spotify is Active & Syncing</h4>
                <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
                  Play any song in Spotify on your phone, Mac, or PC. Lyrics will trace across the stars automatically!
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 transition shadow-lg"
                >
                  Watch Lyrics
                </button>
                <button
                  onClick={() => {
                    clearSpotifyAuth();
                    onDisconnect();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold text-xs transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Disconnect
                </button>
              </div>
            </div>
          ) : (
            /* Connection Options */
            <>
              {/* Option A: 1-Click Spotify Connect */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1db954]/15 to-transparent border border-[#1db954]/30 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1db954]/25 text-[#1db954] text-[10px] font-bold uppercase tracking-wider mb-1">
                        <Sparkles className="w-3 h-3" /> Recommended
                      </span>
                      <h4 className="text-sm font-bold text-white">One-Click Spotify Connect</h4>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        Log in with your normal Spotify account. No developer setup needed for visitors!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartConnect()}
                    className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold py-3.5 px-4 rounded-xl transition shadow-[0_10px_25px_rgba(29,185,84,0.35)] flex items-center justify-center gap-2 text-sm active:scale-[0.99]"
                  >
                    <Radio className="w-4 h-4 text-black" /> Connect with Spotify
                  </button>
                </div>

                {/* Option B: Direct Play Mode (Zero Spotify Needed!) */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Or Play Directly (No Spotify Account Needed)
                      </h4>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Search any song online, listen to audio previews, or play retro vinyl.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenSearch) onOpenSearch();
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition border border-white/10"
                    >
                      <Search className="w-3.5 h-3.5 text-rose-400" /> Search Any Song
                    </button>
                    <button
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition border border-white/10"
                    >
                      <Disc3 className="w-3.5 h-3.5 text-amber-400" /> Spin Demo Vinyl
                    </button>
                  </div>
                </div>

                {/* Option C: Advanced / Custom Spotify Client ID & OAuth Token */}
                <div className="border-t border-white/10 pt-3">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between text-xs text-white/50 hover:text-white transition py-1"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <KeyRound className="w-3.5 h-3.5" />
                      {hasConfiguredClientId ? 'Advanced: Custom Client ID or Token' : 'Site Owner: Configure Client ID'}
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 p-4 rounded-2xl bg-black/60 border border-white/10 space-y-4 animate-fade-in text-xs">
                      {/* Mode toggle */}
                      <div className="grid grid-cols-2 p-0.5 bg-white/5 rounded-xl border border-white/10 text-[11px]">
                        <button
                          onClick={() => setMode('oneclick')}
                          className={`py-1.5 rounded-lg font-medium transition ${
                            mode === 'oneclick' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Spotify Client ID (PKCE)
                        </button>
                        <button
                          onClick={() => setMode('manual')}
                          className={`py-1.5 rounded-lg font-medium transition ${
                            mode === 'manual' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Temporary Bearer Token
                        </button>
                      </div>

                      {mode === 'oneclick' ? (
                        <form onSubmit={handleStartConnect} className="space-y-3">
                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">
                              Spotify Developer Client ID
                            </label>
                            <input
                              type="text"
                              value={clientIdInput}
                              onChange={(e) => setClientIdInput(e.target.value)}
                              placeholder="Paste 32-character Spotify Client ID"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                            />
                            <p className="text-[10px] text-white/40 mt-1">
                              Tip: Add <code className="text-white/70">VITE_SPOTIFY_CLIENT_ID</code> in your Vercel Project Settings so all your visitors can connect with 1-click!
                            </p>
                          </div>

                          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-[11px] text-white/70 space-y-2">
                            <div className="flex items-center gap-1 font-semibold text-white">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#1db954]" />
                              Redirect URI for Spotify Dashboard:
                            </div>
                            <div className="flex items-center justify-between bg-black/70 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-emerald-300">
                              <span className="truncate mr-2">{redirectUri}</span>
                              <button
                                type="button"
                                onClick={handleCopyRedirect}
                                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-sans text-[10px] transition"
                              >
                                {copiedRedirect ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <p className="text-[10px] text-white/50">
                              In Spotify Developer Dashboard &gt; Settings &gt; Redirect URIs, add both <code className="text-emerald-300">{redirectUri}</code> and <code className="text-emerald-300">{redirectUri.replace(/\/$/, '')}</code>.
                            </p>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold py-2.5 rounded-xl transition text-xs"
                          >
                            Save Client ID & Authorize
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleManualTokenSubmit} className="space-y-3">
                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1">
                              Spotify Access Token (Bearer)
                            </label>
                            <input
                              type="password"
                              value={tokenInput}
                              onChange={(e) => setTokenInput(e.target.value)}
                              placeholder="Paste temporary Spotify OAuth Token..."
                              required
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                            />
                            <p className="text-[10px] text-white/40 mt-1">
                              Get one in 10 seconds from{' '}
                              <a
                                href="https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track"
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 underline"
                              >
                                Spotify Web API Console <ExternalLink className="w-2.5 h-2.5 inline" />
                              </a>
                            </p>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-white hover:bg-white/90 text-black font-bold py-2.5 rounded-xl transition text-xs"
                          >
                            Save Token & Start Live Sync
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
