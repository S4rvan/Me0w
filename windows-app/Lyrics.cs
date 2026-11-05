using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Lyrix;

public sealed record Word(string Text, double Start, double End);
public sealed record LyricLine(double Start, double End, Word[] Words);

/// <summary>
/// Fetches line-synced lyrics from LRCLIB (free, open lyrics database) and
/// spreads each line's words across its time span to get per-word timing.
/// </summary>
public sealed class LyricsService
{
    // Tuning knob: how fast a line is "sung", in seconds per character.
    // Higher = words finish later within each line.
    const double SecondsPerChar = 0.09;

    static readonly Regex TimeTag = new(@"^\[(\d+):(\d+(?:\.\d+)?)\]", RegexOptions.Compiled);
    static readonly Regex WordTag = new(@"<\d+:\d+(?:\.\d+)?>", RegexOptions.Compiled);

    readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(10) };

    public LyricsService()
    {
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("Lyrix/0.1 (personal project)");
    }

    public async Task<LyricLine[]> FetchAsync(Track t)
    {
        // Try the exact title first, then one with "- Remastered" / "(feat. ...)" stripped
        foreach (var title in new[] { t.Title, CleanTitle(t.Title) }.Distinct())
        {
            try
            {
                var url = "https://lrclib.net/api/search" +
                          $"?track_name={Uri.EscapeDataString(title)}" +
                          $"&artist_name={Uri.EscapeDataString(t.Artist)}";
                using var doc = JsonDocument.Parse(await _http.GetStringAsync(url));
                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    if (el.TryGetProperty("syncedLyrics", out var s) && s.ValueKind == JsonValueKind.String)
                    {
                        var lrc = s.GetString();
                        if (!string.IsNullOrWhiteSpace(lrc)) return Parse(lrc);
                    }
                }
            }
            catch { /* network error or bad response: try next / give up */ }
        }
        return Array.Empty<LyricLine>();
    }

    static string CleanTitle(string title) =>
        Regex.Replace(title, @"\s*[-–(\[].*$", "").Trim();

    public static LyricLine[] Parse(string lrc)
    {
        var stamped = new List<(double T, string Text)>();

        foreach (var raw in lrc.Split('\n'))
        {
            var line = raw.Trim();
            var times = new List<double>();
            Match m;
            while ((m = TimeTag.Match(line)).Success)
            {
                times.Add(int.Parse(m.Groups[1].Value) * 60 +
                          double.Parse(m.Groups[2].Value, CultureInfo.InvariantCulture));
                line = line.Substring(m.Length);
            }
            line = WordTag.Replace(line, "").Trim();
            foreach (var t in times) stamped.Add((t, line));
        }

        var sorted = stamped.OrderBy(x => x.T).ToList();
        var result = new LyricLine[sorted.Count];
        for (int i = 0; i < sorted.Count; i++)
        {
            double start = sorted[i].T;
            double next = i + 1 < sorted.Count ? sorted[i + 1].T : start + 6;
            result[i] = new LyricLine(start, next, BuildWords(sorted[i].Text, start, next));
        }
        return result;
    }

    static Word[] BuildWords(string text, double start, double next)
    {
        var parts = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return Array.Empty<Word>();

        double totalChars = parts.Sum(p => p.Length + 1);
        double sing = Math.Min(next - start, totalChars * SecondsPerChar + 0.3);

        var words = new Word[parts.Length];
        double cursor = start;
        for (int i = 0; i < parts.Length; i++)
        {
            double d = sing * (parts[i].Length + 1) / totalChars;
            words[i] = new Word(parts[i], cursor, cursor + d);
            cursor += d;
        }
        return words;
    }
}
