import React, { useState } from 'react';
import { X, Share2, Copy, Check, Globe, Send } from 'lucide-react';
import { Track } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, currentTrack }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate share link
  const shareUrl = new URL(window.location.origin + window.location.pathname);
  if (currentTrack) {
    shareUrl.searchParams.set('q', `${currentTrack.title} ${currentTrack.artist}`);
  }
  const shareString = shareUrl.toString();

  const handleCopy = () => {
    navigator.clipboard.writeText(shareString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121216] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Share with Friends</h3>
              <p className="text-xs text-white/50">Send synced lyrics directly to anyone</p>
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
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
              Shareable Web Link
            </label>
            <div className="flex items-center bg-black/50 border border-white/10 rounded-2xl p-2 pl-4">
              <span className="text-xs text-white/70 truncate flex-1 font-mono">
                {shareString}
              </span>
              <button
                onClick={handleCopy}
                className="ml-2 flex items-center gap-1.5 px-4 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-white/90 active:scale-95 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white/70 space-y-2">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-purple-400" />
              Cross-Platform for Everyone:
            </p>
            <p className="text-white/60 leading-relaxed">
              Your friends can open this link on iPhone, Android, iPad, Mac, Windows, or Linux. If they open it in fullscreen, it functions just like the Verci lockscreen display!
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
