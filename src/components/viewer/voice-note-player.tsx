"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Mic } from "lucide-react";

interface VoiceNotePlayerProps {
  audioDataUrl: string;
  durationSec?: number;
  title?: string;
  pageNumber: number;
}

export function VoiceNotePlayer({
  audioDataUrl,
  durationSec = 0,
  title,
  pageNumber,
}: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSec || 0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset audio state on page transition
    setIsPlaying(false);
    setCurrentTime(0);
    setTotalDuration(durationSec || 0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [pageNumber, audioDataUrl, durationSec]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
    if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
      setTotalDuration(e.currentTarget.duration);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
      setTotalDuration(e.currentTarget.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur-md transition hover:border-purple-500/50">
      <audio
        ref={audioRef}
        src={audioDataUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        muted={isMuted}
      />

      {/* Mic Badge */}
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
        <Mic className="h-4 w-4" />
      </div>

      <div className="flex flex-col min-w-[140px] max-w-[200px]">
        <div className="flex items-center justify-between text-[11px] font-bold text-white">
          <span className="truncate">{title || `Founder Note — Slide ${pageNumber}`}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="relative h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-purple-300 shrink-0">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500 text-slate-950 hover:bg-purple-400 transition shadow-md shadow-purple-500/20"
        title={isPlaying ? "Pause audio walkthrough" : "Listen to founder walkthrough"}
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </button>

      {/* Mute Toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="text-slate-400 hover:text-white p-1 transition"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
