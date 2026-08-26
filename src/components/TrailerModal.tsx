import React, { useEffect } from 'react';
import { X, AlertCircle, Play } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  trailerUrl?: string;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({
  isOpen,
  onClose,
  title,
  trailerUrl,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Helper to convert YouTube URL into embed link
  const getEmbedUrl = (url?: string): string | null => {
    if (!url) return null;

    try {
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        const v = urlParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}?autoplay=1&rel=0` : null;
      }
      if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/');
        const id = parts[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
      }
      // If it's already an https video or embed
      return url;
    } catch {
      return null;
    }
  };

  const embedUrl = getEmbedUrl(trailerUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#11121b] border border-[#272938] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202230] bg-[#141520]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
              <p className="text-xs text-gray-400">Official Cinema Trailer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#202232] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player or Fallback */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
              <AlertCircle className="w-12 h-12 text-red-500/80" />
              <p className="text-lg font-semibold text-gray-200">Trailer unavailable</p>
              <p className="text-xs max-w-md text-gray-400">
                The official video preview for this title has not been linked or is temporarily offline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
