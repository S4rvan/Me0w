using System;
using System.Threading.Tasks;
using Windows.Media.Control;

namespace Lyrix;

public sealed record Track(string Title, string Artist);

/// <summary>
/// Reads the current track and playback position from Windows' system media
/// controls (the same thing that powers the volume-flyout media widget).
/// Works with Spotify, Apple Music for Windows, browsers, etc.
/// </summary>
public sealed class NowPlayingService
{
    GlobalSystemMediaTransportControlsSessionManager? _mgr;
    GlobalSystemMediaTransportControlsSession? _session;

    public event Action<Track?>? TrackChanged;

    public async Task StartAsync()
    {
        _mgr = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
        _mgr.CurrentSessionChanged += (_, _) => Attach();
        Attach();
    }

    void Attach()
    {
        if (_session != null) _session.MediaPropertiesChanged -= OnPropsChanged;
        _session = _mgr?.GetCurrentSession();
        if (_session != null) _session.MediaPropertiesChanged += OnPropsChanged;
        _ = RefreshAsync();
    }

    async void OnPropsChanged(GlobalSystemMediaTransportControlsSession s, MediaPropertiesChangedEventArgs e)
        => await RefreshAsync();

    async Task RefreshAsync()
    {
        var s = _session;
        if (s == null) { TrackChanged?.Invoke(null); return; }
        try
        {
            var p = await s.TryGetMediaPropertiesAsync();
            if (string.IsNullOrWhiteSpace(p.Title)) { TrackChanged?.Invoke(null); return; }
            TrackChanged?.Invoke(new Track(p.Title, p.Artist ?? ""));
        }
        catch { /* session vanished mid-call */ }
    }

    /// <summary>Current position (extrapolated between Windows' sparse updates) and play state.</summary>
    public (TimeSpan Position, bool Playing)? GetPosition()
    {
        var s = _session;
        if (s == null) return null;
        try
        {
            var tl = s.GetTimelineProperties();
            bool playing = s.GetPlaybackInfo().PlaybackStatus ==
                           GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing;
            var pos = tl.Position;
            if (playing) pos += DateTimeOffset.UtcNow - tl.LastUpdatedTime;
            if (pos < TimeSpan.Zero) pos = TimeSpan.Zero;
            return (pos, playing);
        }
        catch { return null; }
    }
}
