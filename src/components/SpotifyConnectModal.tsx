import React, { useState } from 'react';
import { X, Radio, Key, ExternalLink, CheckCircle2, ShieldCheck, LogOut } from 'lucide-react';
import { initiateSpotifyLogin, setSpotifyToken, clearSpotifyAuth } from '../services/spotifyService';

interface SpotifyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onDisconnect: () => void;
  onTokenConnected: () => void;
}

export const SpotifyConnectModal: React.FC<SpotifyConnectModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  onDisconnect,
  onTokenConnected,
}) => {
  const [clientId, setClientId] = useState(
    localStorage.getItem('verci_spotify_client_id') || ''
  );
  const [tokenInput, setTokenInput] = useState('');
  const [mode, setMode] = useState<'oauth' | 'manual'>('oauth');
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  if (!isOpen) return null;

  const currentRedirectUri = window.location.origin + window.location.pathname;

  const handleOAuthConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) return;
    try {
      initiateSpotifyLogin(clientId.trim());
    } catch (err) {
      alert('Failed to start Spotify login. Check client ID.');
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
    navigator.clipboard.writeText(currentRedirectUri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#121216] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Connect Spotify</h3>
              <p className="text-xs text-white/50">Live sync with what's playing on any device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {isConnected ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Spotify is Active</h4>
                <p className="text-sm text-white/60 mt-1 max-w-xs mx-auto">
                  Play music in Spotify on your phone, PC, or Mac. Lyrics will sync automatically on this screen!
                </p>
              </div>
              <button
                onClick={() => {
                  clearSpotifyAuth();
                  onDisconnect();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold text-sm transition"
              >
                <LogOut className="w-4 h-4" /> Disconnect Spotify
              </button>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-white/5 rounded-2xl border border-white/10 text-xs">
                <button
                  onClick={() => setMode('oauth')}
                  className={`py-2 rounded-xl font-medium transition ${
                    mode === 'oauth' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Spotify Client ID (PKCE)
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`py-2 rounded-xl font-medium transition ${
                    mode === 'manual' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Quick OAuth Token
                </button>
              </div>

              {mode === 'oauth' ? (
                <form onSubmit={handleOAuthConnect} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Spotify Developer Client ID
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Paste your 32-character Client ID"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>

                  {/* Instructions Callout */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-xs text-white/70 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Free 1-Minute Setup:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-white/60">
                      <li>
                        Open{' '}
                        <a
                          href="https://developer.spotify.com/dashboard"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 underline inline-flex items-center gap-0.5"
                        >
                          Spotify Dashboard <ExternalLink className="w-3 h-3" />
                        </a>{' '}
                        and click "Create App".
                      </li>
                      <li>
                        In app settings, paste this exact <strong>Redirect URI</strong>:
                      </li>
                    </ol>
                    <div className="flex items-center justify-between bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-emerald-300">
                      <span className="truncate mr-2">{currentRedirectUri}</span>
                      <button
                        type="button"
                        onClick={handleCopyRedirect}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-sans text-xs transition"
                      >
                        {copiedRedirect ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold py-3.5 rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
                  >
                    Log In with Spotify
                  </button>
                </form>
              ) : (
                /* Manual Token input */
                <form onSubmit={handleManualTokenSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Spotify Access Token (Bearer)
                    </label>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Paste temporary Spotify OAuth Token..."
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                    />
                    <p className="text-[11px] text-white/40 mt-1.5">
                      Can be generated directly from the{' '}
                      <a
                        href="https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 underline"
                      >
                        Spotify Web API Console
                      </a>.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-white hover:bg-white/90 text-black font-bold py-3.5 rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" /> Save Token & Start Syncing
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
