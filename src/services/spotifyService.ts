import { SpotifyPlaybackState } from '../types';

const SPOTIFY_CLIENT_ID_KEY = 'verci_spotify_client_id';
const SPOTIFY_TOKEN_KEY = 'verci_spotify_token';
const SPOTIFY_REFRESH_TOKEN_KEY = 'verci_spotify_refresh_token';
const SPOTIFY_CODE_VERIFIER_KEY = 'verci_spotify_code_verifier';

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function initiateSpotifyLogin(clientId: string) {
  if (!clientId) throw new Error('Client ID required');
  localStorage.setItem(SPOTIFY_CLIENT_ID_KEY, clientId);

  const codeVerifier = generateRandomString(64);
  localStorage.setItem(SPOTIFY_CODE_VERIFIER_KEY, codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  const redirectUri = window.location.origin + window.location.pathname;
  const scope = 'user-read-currently-playing user-read-playback-state';

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  }).toString();

  window.location.href = authUrl.toString();
}

export async function handleSpotifyCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return false;

  const codeVerifier = localStorage.getItem(SPOTIFY_CODE_VERIFIER_KEY);
  const clientId = localStorage.getItem(SPOTIFY_CLIENT_ID_KEY);
  const redirectUri = window.location.origin + window.location.pathname;

  if (!codeVerifier || !clientId) return false;

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      setSpotifyToken(data.access_token);
      if (data.refresh_token) {
        localStorage.setItem(SPOTIFY_REFRESH_TOKEN_KEY, data.refresh_token);
      }
      // Clean query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
  } catch (err) {
    console.error('Spotify token exchange failed:', err);
  }
  return false;
}

export function getStoredSpotifyToken(): string | null {
  return localStorage.getItem(SPOTIFY_TOKEN_KEY);
}

export function setSpotifyToken(token: string) {
  localStorage.setItem(SPOTIFY_TOKEN_KEY, token);
}

export function clearSpotifyAuth() {
  localStorage.removeItem(SPOTIFY_TOKEN_KEY);
  localStorage.removeItem(SPOTIFY_REFRESH_TOKEN_KEY);
  localStorage.removeItem(SPOTIFY_CODE_VERIFIER_KEY);
}

export async function fetchCurrentlyPlaying(token: string): Promise<SpotifyPlaybackState | null> {
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 204 || res.status === 202) {
      // Nothing is currently playing
      return null;
    }

    if (res.status === 401) {
      // Token expired
      clearSpotifyAuth();
      return null;
    }

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.item) return null;

    const item = data.item;
    const artists = (item.artists || []).map((a: any) => a.name).join(', ');
    const albumArt = item.album?.images?.[0]?.url || '';

    return {
      isPlaying: data.is_playing,
      progressMs: data.progress_ms || 0,
      durationMs: item.duration_ms || 0,
      trackName: item.name || 'Unknown Track',
      artistName: artists || 'Unknown Artist',
      albumName: item.album?.name || 'Unknown Album',
      albumArt,
      trackId: item.id || '',
    };
  } catch (err) {
    console.error('Error fetching currently playing Spotify track:', err);
    return null;
  }
}
