# Verci Web 🎵

> Ultra-aesthetic, word-by-word synchronized lyrics display for your music. Inspired by [Verci](https://www.verci.xyz) for macOS, built as a modern web app for personal use and sharing with friends via Vercel.

![Verci Web Banner](https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- 🎤 **Word-by-Word Synchronized Lyrics**: Lights up each word fluidly as it is sung using real-time karaoke gradient wipes (powered by the free and open [LRCLIB](https://lrclib.net)).
- 🎨 **Dynamic Ambient Art Palette**: Automatically extracts dominant and accent colors from album artwork to produce breathing aurora mesh glow effects.
- ⚡ **Instant Music Search & Previews**: Search any song, artist, or album globally via iTunes API and test it immediately with full synced lyrics—no login required!
- 🎧 **Spotify Connect Mode**: Connect your Spotify account to automatically mirror and display live synced lyrics for whatever song is currently playing on your phone, Mac, Windows PC, or smart speaker.
- 📁 **Local Audio & Custom LRC**: Drag & drop your own MP3/WAV tracks or paste custom LRC timestamped lyrics.
- 📺 **Fullscreen & Screen Wake Lock**: Locks the screen awake so your monitor or phone never dims or sleeps while listening (replicating Verci's screensaver & lock screen aesthetic).
- 🕒 **Lockscreen Clock Overlay**: Sleek Apple-style minimalist digital clock and date.
- 🎛️ **5 Aesthetic Display Themes**:
  - **Verci Classic**: OLED pitch-black background with bright typography focus.
  - **Ambient Aurora**: Fluid blurred gradients sampled from album colors.
  - **Fisheye Lens**: Center line magnified with dynamic perspective depth.
  - **Cyberpunk**: Neon cyan and magenta laser glow.
  - **Minimalist**: Clean Swiss typography without visual distractions.
- ⏱️ **Sync Timing Nudge**: Offset lyrics by `±0.1s` or `±0.05s` with keyboard arrow keys.
- 💻 **Windows Desktop Companion Included**: Contains Claude's native C# .NET 8 desktop app and screensaver in `/windows-app` for friends who also want the Windows `.exe` / `.scr`.

---

## 🚀 1-Minute Deployment to Vercel

You can deploy this website to Vercel in just a few clicks to share with your friends:

### Step 1: Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new) (e.g. `verci-web`).
2. In your terminal, initialize and push the project:
   ```bash
   cd verci-web
   git init
   git add .
   git commit -m "Initial commit of Verci Web"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/verci-web.git
   git push -u origin main
   ```

### Step 2: Import to Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** > **"Project"**.
3. Select your `verci-web` repository from GitHub.
4. Vercel automatically detects the **Vite** framework preset:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**.

Your website will be live at `https://your-project.vercel.app`! You can now send the URL to your friends.

---

## 💻 Running Locally

Requirements: [Node.js](https://nodejs.org) (v18 or higher)

```bash
# 1. Navigate to project directory
cd verci-web

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / Pause |
| `F` | Toggle Fullscreen Mode |
| `S` | Open Music Search |
| `Left Arrow` | Nudge Sync -0.1s (lyrics later) |
| `Right Arrow` | Nudge Sync +0.1s (lyrics earlier) |
| `M` | Mute / Unmute Volume |
| `Click on Line` | Instantly jump / seek audio to that lyric line |

---

## 🪟 Windows Desktop App (`windows-app/`)

For friends on Windows who want the native desktop tray app or screensaver:

1. Install the free [.NET 8 SDK](https://dotnet.microsoft.com/download).
2. Run from terminal:
   ```bash
   cd windows-app
   dotnet run
   ```
3. To install as a screensaver: compile with `dotnet publish -c Release -r win-x64 --self-contained true` and rename the resulting `Lyrix.exe` to `Lyrix.scr`.

---

## 🔒 Privacy & Credits

- Lyrics provided by the community database at [LRCLIB](https://lrclib.net).
- Audio previews and metadata provided by Apple iTunes Search API.
- Spotify playback tracking uses official Spotify Web API PKCE OAuth.
- Concept inspired by [Verci](https://www.verci.xyz). Not officially affiliated with Verci.
