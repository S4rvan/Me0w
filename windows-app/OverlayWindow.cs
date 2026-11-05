using System;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;

namespace Lyrix;

/// <summary>
/// Fullscreen black window showing five lines of lyrics; the current line's
/// words light up as they're sung. Esc / click closes it. Left/Right nudge sync.
/// In screensaver mode any key or mouse movement closes it.
/// </summary>
public sealed class OverlayWindow : Window
{
    // ---- Look & feel: tweak these ----
    static readonly Color Lit = Colors.White;
    static readonly Color Dim = Color.FromArgb(0x66, 0xFF, 0xFF, 0xFF);
    const double CurrentFontSize = 60;
    const double OtherFontSize = 36;
    // -----------------------------------

    static readonly SolidColorBrush LitBrush = Solid(Lit);
    static readonly SolidColorBrush DimBrush = Solid(Dim);

    [DllImport("kernel32.dll")] static extern uint SetThreadExecutionState(uint flags);
    const uint ES_CONTINUOUS = 0x80000000;
    const uint ES_DISPLAY_REQUIRED = 0x00000002;

    readonly Host _host;
    readonly bool _saver;
    readonly StackPanel _stack = new()
    {
        VerticalAlignment = VerticalAlignment.Center,
        HorizontalAlignment = HorizontalAlignment.Center
    };
    readonly TextBlock _status = new()
    {
        Foreground = DimBrush,
        FontSize = 16,
        Margin = new Thickness(32),
        VerticalAlignment = VerticalAlignment.Bottom,
        HorizontalAlignment = HorizontalAlignment.Left
    };
    readonly TextBlock _message = new()
    {
        Foreground = DimBrush,
        FontSize = 32,
        HorizontalAlignment = HorizontalAlignment.Center
    };
    readonly DispatcherTimer _timer = new() { Interval = TimeSpan.FromMilliseconds(33) };

    LyricLine[]? _shown;
    int _shownIdx = -99;
    TextBlock[] _currentBlocks = Array.Empty<TextBlock>();
    double _offset;          // manual sync nudge, seconds
    Point? _mouseStart;

    public OverlayWindow(Host host, bool saver)
    {
        _host = host;
        _saver = saver;

        WindowStyle = WindowStyle.None;
        ResizeMode = ResizeMode.NoResize;
        WindowState = WindowState.Maximized;
        Topmost = true;
        ShowInTaskbar = false;
        Background = Brushes.Black;
        Cursor = Cursors.None;

        var grid = new Grid();
        grid.Children.Add(_stack);
        grid.Children.Add(_status);
        Content = grid;

        Loaded += (_, _) =>
        {
            SetThreadExecutionState(ES_CONTINUOUS | ES_DISPLAY_REQUIRED); // keep the display awake
            _timer.Start();
        };
        Closed += (_, _) =>
        {
            _timer.Stop();
            SetThreadExecutionState(ES_CONTINUOUS);
        };
        _timer.Tick += (_, _) => Tick();

        KeyDown += OnKey;
        MouseDown += (_, _) => Close();
        MouseMove += OnMove;
    }

    void OnKey(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Left) _offset -= 0.1;        // lyrics later
        else if (e.Key == Key.Right) _offset += 0.1;  // lyrics earlier
        else if (e.Key == Key.Escape || _saver) Close();
    }

    void OnMove(object sender, MouseEventArgs e)
    {
        if (!_saver) return;
        var p = e.GetPosition(this);
        if (_mouseStart is null) { _mouseStart = p; return; }
        if ((p - _mouseStart.Value).Length > 12) Close();
    }

    void Tick()
    {
        var lines = _host.Lines;
        var track = _host.Current;
        var pos = _host.Player.GetPosition();

        _status.Text = track is null
            ? ""
            : $"{track.Title} — {track.Artist}" + (_offset != 0 ? $"    (sync {_offset:+0.0;-0.0}s)" : "");

        if (pos is null || lines.Length == 0)
        {
            if (_shownIdx != -100)
            {
                _stack.Children.Clear();
                _stack.Children.Add(_message);
                _currentBlocks = Array.Empty<TextBlock>();
                _shown = null;
                _shownIdx = -100;
            }
            _message.Text = track is null ? "Play something…" : "No synced lyrics found for this track";
            return;
        }

        double t = pos.Value.Position.TotalSeconds + _offset;

        int idx = -1;
        for (int i = 0; i < lines.Length; i++)
        {
            if (lines[i].Start <= t) idx = i; else break;
        }

        if (!ReferenceEquals(lines, _shown) || idx != _shownIdx) Rebuild(lines, idx);
        LightWords(lines, idx, t);
    }

    void Rebuild(LyricLine[] lines, int idx)
    {
        _shown = lines;
        _shownIdx = idx;
        _stack.Children.Clear();
        _currentBlocks = Array.Empty<TextBlock>();

        int center = Math.Max(idx, 0);
        for (int k = -2; k <= 2; k++)
        {
            int li = center + k;
            if (li < 0 || li >= lines.Length) continue;

            var line = lines[li];
            var panel = new WrapPanel
            {
                HorizontalAlignment = HorizontalAlignment.Center,
                MaxWidth = SystemParameters.PrimaryScreenWidth * 0.8,
                Margin = new Thickness(0, 10, 0, 10),
                Opacity = k == 0 ? 1.0 : (Math.Abs(k) == 1 ? 0.45 : 0.2)
            };

            double size = k == 0 ? CurrentFontSize : OtherFontSize;
            Brush brush = k < 0 ? LitBrush : DimBrush;   // lines already sung stay lit

            var blocks = new System.Collections.Generic.List<TextBlock>();
            if (line.Words.Length == 0)
            {
                blocks.Add(MakeBlock("♪", size, DimBrush));
            }
            else
            {
                foreach (var w in line.Words)
                    blocks.Add(MakeBlock(w.Text + " ", size, brush));
            }
            foreach (var b in blocks) panel.Children.Add(b);
            _stack.Children.Add(panel);

            if (li == idx) _currentBlocks = blocks.ToArray();
        }
    }

    void LightWords(LyricLine[] lines, int idx, double t)
    {
        if (idx < 0 || _currentBlocks.Length == 0) return;
        var words = lines[idx].Words;
        for (int i = 0; i < words.Length && i < _currentBlocks.Length; i++)
        {
            var w = words[i];
            Brush b;
            if (t >= w.End) b = LitBrush;
            else if (t <= w.Start) b = DimBrush;
            else b = Sweep((t - w.Start) / (w.End - w.Start));   // partial fill, left to right
            _currentBlocks[i].Foreground = b;
        }
    }

    static Brush Sweep(double f)
    {
        var g = new LinearGradientBrush { StartPoint = new Point(0, 0), EndPoint = new Point(1, 0) };
        g.GradientStops.Add(new GradientStop(Lit, 0));
        g.GradientStops.Add(new GradientStop(Lit, f));
        g.GradientStops.Add(new GradientStop(Dim, f));
        g.GradientStops.Add(new GradientStop(Dim, 1));
        return g;
    }

    static TextBlock MakeBlock(string text, double size, Brush brush) => new()
    {
        Text = text,
        FontSize = size,
        FontWeight = FontWeights.Bold,
        FontFamily = new FontFamily("Segoe UI"),
        Foreground = brush
    };

    static SolidColorBrush Solid(Color c)
    {
        var b = new SolidColorBrush(c);
        b.Freeze();
        return b;
    }
}
