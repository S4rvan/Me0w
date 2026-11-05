# Lyrix

Word-by-word lyrics for Windows. Reads whatever is playing (Spotify, Apple Music, browser, etc.) and lights
each word as it’s sung on a fullscreen overlay. A from-scratch take on the idea behind Verci for macOS.

```
src/Lyrix/   the Windows app (C#, .NET 8, WPF)
web/         static download page (deploy this folder to Vercel)
.github/     CI: builds Lyrix.exe / Lyrix.scr, attaches them to releases
```

## Run it locally

Install the [.NET 8 SDK](https://dotnet.microsoft.com/download), then:

```
cd src/Lyrix
dotnet run
```

A tray icon appears. Double-click it, then play a song.
`Esc` or click closes the overlay; `Left`/`Right` nudge sync by 0.1 s.

## Screensaver mode (closest to a lock screen)

Windows doesn’t let normal apps draw on the real lock screen, so Lyrix doubles as a screensaver.
Download `Lyrix.scr` from Releases, right-click it > **Install**, and tick
**On resume, display logon screen** in Screen Saver Settings.

## Releasing

```
git tag v0.1.0
git push --tags
```

GitHub Actions builds the single-file `Lyrix.exe` and `Lyrix.scr` and attaches them to the release.
Every push to `main` also uploads them as a build artifact.

## Deploying the download page to Vercel

Vercel can’t run the Windows app; it only hosts the page in `web/`.

1. Edit `REPO` near the bottom of `web/index.html` to your `owner/repo`.
2. In Vercel: **Add New > Project**, import this repo.
3. Set **Root Directory** to `web`, **Framework Preset** to *Other*, leave build command empty.
4. Deploy.

## Tuning

- `src/Lyrix/Lyrics.cs`: `SecondsPerChar` controls how word timings spread across each line.
- `src/Lyrix/OverlayWindow.cs`: colors and font sizes at the top of the class.

## Known limits

- Word timing is estimated from line-synced lyrics (LRCLIB), not true per-word data.
- Screensaver mode covers only the primary monitor.
- Untested build: if `dotnet run` throws errors, fix or report them before tagging a release.
