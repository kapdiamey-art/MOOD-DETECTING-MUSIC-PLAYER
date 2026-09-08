import React, { createContext, useContext, useState, useRef, useEffect } from "react";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(() => {
    try {
      const saved = localStorage.getItem("moodify_current_track");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [playlist, setPlaylist] = useState(() => {
    try {
      const saved = localStorage.getItem("moodify_recommendations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(0.8);
  const [errorMsg, setErrorMsg] = useState(null);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      playNext();
    };

    const handleError = () => {
      setIsPlaying(false);
      setErrorMsg("Audio preview unavailable. Click to open in Spotify.");
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Find the next track in `list` starting from `fromIdx` (wraps around)
  // that actually has a preview_url so playback never silently stops.
  const findNextPlayable = (list, fromIdx) => {
    if (!list || list.length === 0) return null;
    for (let i = 1; i <= list.length; i++) {
      const candidate = list[(fromIdx + i) % list.length];
      if (candidate?.preview_url) return candidate;
    }
    return null; // whole list has no previews
  };

  const playTrack = (track, newPlaylist = null) => {
    if (!track) return;
    setErrorMsg(null);

    const resolvedPlaylist = newPlaylist && Array.isArray(newPlaylist)
      ? newPlaylist
      : playlist;

    if (newPlaylist && Array.isArray(newPlaylist)) {
      setPlaylist(newPlaylist);
      try {
        localStorage.setItem("moodify_recommendations", JSON.stringify(newPlaylist));
      } catch {}
    }

    // If this track has no preview, auto-skip to the nearest playable one
    if (!track.preview_url) {
      const idx = resolvedPlaylist.findIndex(
        (s) => s.track_name === track.track_name && s.artists === track.artists
      );
      const next = findNextPlayable(resolvedPlaylist, idx >= 0 ? idx : 0);
      if (next) {
        setErrorMsg(`"${track.track_name}" has no preview – skipped to next available track.`);
        // Re-call with the next playable track (don't pass newPlaylist again, already set)
        setCurrentTrack(next);
        try { localStorage.setItem("moodify_current_track", JSON.stringify(next)); } catch {}
        const audio = audioRef.current;
        audio.src = next.preview_url;
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        return;
      } else {
        // No previews anywhere – set track for display, open Spotify
        setCurrentTrack(track);
        try { localStorage.setItem("moodify_current_track", JSON.stringify(track)); } catch {}
        setIsPlaying(false);
        setErrorMsg("No audio preview available. Opening Spotify…");
        if (track.spotify_url) window.open(track.spotify_url, "_blank");
        return;
      }
    }

    setCurrentTrack(track);
    try {
      localStorage.setItem("moodify_current_track", JSON.stringify(track));
    } catch {}

    const audio = audioRef.current;
    audio.src = track.preview_url;
    audio.currentTime = 0;
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.warn("Autoplay blocked or playback error:", err);
        setIsPlaying(false);
      });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!currentTrack) {
      if (playlist.length > 0) {
        playTrack(playlist[0], playlist);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack.preview_url) {
        if (!audio.src || audio.src !== currentTrack.preview_url) {
          audio.src = currentTrack.preview_url;
        }
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else if (currentTrack.spotify_url) {
        window.open(currentTrack.spotify_url, "_blank");
      }
    }
  };

  const playNext = () => {
    if (!playlist || playlist.length === 0) return;
    const currentIdx = playlist.findIndex(
      (s) => s.track_name === currentTrack?.track_name && s.artists === currentTrack?.artists
    );
    // Skip straight to the next one that has a preview
    const next = findNextPlayable(playlist, currentIdx >= 0 ? currentIdx : 0);
    if (next) playTrack(next);
  };

  const playPrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    if (!playlist || playlist.length === 0) return;
    const currentIdx = playlist.findIndex(
      (s) => s.track_name === currentTrack?.track_name && s.artists === currentTrack?.artists
    );
    const prevIdx = (currentIdx - 1 + playlist.length) % playlist.length;
    playTrack(playlist[prevIdx]);
  };

  const seek = (time) => {
    if (audioRef.current && isFinite(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        playlist,
        setPlaylist,
        isPlaying,
        currentTime,
        duration,
        volume,
        setVolume,
        errorMsg,
        playTrack,
        togglePlay,
        playNext,
        playPrev,
        seek,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
