using System;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;

namespace Lyrix;

/// <summary>Shared state: what's playing and its lyrics.</summary>
public sealed class Host
{
    public readonly NowPlayingService Player = new();
    public readonly LyricsService Lyrics = new();
    public Track? Current;
    public LyricLine[] Lines = Array.Empty<LyricLine>();

    public async Task StartAsync()
    {
        Player.TrackChanged += async t =>
        {
            if (t == Current) return;               // same song, ignore repeat events
            Current = t;
            Lines = Array.Empty<LyricLine>();
            if (t is null) return;
            var lines = await Lyrics.FetchAsync(t);
            if (t == Current) Lines = lines;        // still the same song? then use them
        };
        await Player.StartAsync();
    }
}

public static class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        // Windows screensavers get /s (run), /c (configure), /p (preview)
        string mode = (args.FirstOrDefault() ?? "").ToLowerInvariant();
        if (mode.StartsWith("/c") || mode.StartsWith("/p")) return;
        bool saver = mode.StartsWith("/s");

        var app = new Application
        {
            ShutdownMode = saver ? ShutdownMode.OnLastWindowClose : ShutdownMode.OnExplicitShutdown
        };

        var host = new Host();
        _ = host.StartAsync();

        if (saver) new OverlayWindow(host, saver: true).Show();
        else AddTray(app, host);

        app.Run();
    }

    static void AddTray(Application app, Host host)
    {
        OverlayWindow? open = null;

        void ShowOverlay()
        {
            if (open != null) { open.Activate(); return; }
            open = new OverlayWindow(host, saver: false);
            open.Closed += (_, _) => open = null;
            open.Show();
        }

        var menu = new System.Windows.Forms.ContextMenuStrip();
        menu.Items.Add("Show lyrics", null, (_, _) => app.Dispatcher.Invoke(() => ShowOverlay()));
        menu.Items.Add("Quit", null, (_, _) => app.Dispatcher.Invoke(() => app.Shutdown()));

        var icon = new System.Windows.Forms.NotifyIcon
        {
            Icon = System.Drawing.SystemIcons.Application,
            Text = "Lyrix",
            Visible = true,
            ContextMenuStrip = menu
        };
        icon.DoubleClick += (_, _) => app.Dispatcher.Invoke(() => ShowOverlay());
        app.Exit += (_, _) => icon.Dispose();
    }
}
