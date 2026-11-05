import React from 'react';
import { X, Monitor, Terminal, CheckCircle2, Copy } from 'lucide-react';

interface WindowsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsAppModal: React.FC<WindowsAppModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#121216] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Windows Desktop App (Lyrix)</h3>
              <p className="text-xs text-white/50">Native C# .NET 8 Screensaver & Tray Companion</p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-white/80">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> All Claude Files Are Included
            </h4>
            <p className="text-xs text-white/70 leading-relaxed">
              In addition to this web app, all native Windows desktop C# files provided by Claude (<code className="text-emerald-300 font-mono">Lyrix.csproj</code>, <code className="text-emerald-300 font-mono">Program.cs</code>, <code className="text-emerald-300 font-mono">NowPlaying.cs</code>, <code className="text-emerald-300 font-mono">Lyrics.cs</code>, <code className="text-emerald-300 font-mono">OverlayWindow.cs</code>) are safely included in this repository inside the <code className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">windows-app/</code> folder.
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> How to Run Native Desktop App:
            </h5>
            <ol className="list-decimal list-inside space-y-2 text-xs text-white/70">
              <li>
                Install the free <a href="https://dotnet.microsoft.com/download" target="_blank" rel="noreferrer" className="text-blue-400 underline">.NET 8 SDK</a> on Windows.
              </li>
              <li>
                Open PowerShell or Command Prompt in the repository's <code className="text-white font-mono">windows-app</code> folder:
              </li>
            </ol>
            <div className="mt-2 flex items-center justify-between bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-blue-300">
              <span>cd windows-app && dotnet run</span>
              <button
                onClick={() => copyCommand('cd windows-app && dotnet run')}
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
                title="Copy command"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            {copied && <p className="text-[11px] text-emerald-400 mt-1">Copied to clipboard!</p>}
          </div>

          <div>
            <h5 className="font-semibold text-white text-xs uppercase tracking-wider mb-1">
              Windows Screensaver Mode (.scr):
            </h5>
            <p className="text-xs text-white/60 leading-relaxed">
              When compiled, you can rename the output <code className="text-white font-mono">Lyrix.exe</code> to <code className="text-white font-mono">Lyrix.scr</code>, right-click it &gt; <strong>Install</strong>, and turn on <em>"On resume, display logon screen"</em> to make it behave just like a lockscreen lyrics player!
            </p>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-white/90 transition shadow-lg"
            >
              Back to Web Player
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
