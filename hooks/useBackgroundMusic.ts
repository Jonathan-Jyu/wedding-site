import { useEffect, useRef, useState } from "react";

const playbackEvents = ["play", "playing", "pause", "ended"] as const;

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pending = useRef<symbol | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncPlayback = () => {
      if (audio.ended || audio.error) pending.current = null;
      setIsPlaying(!audio.paused && !audio.ended && !audio.error);
    };
    const stopOnError = () => {
      if (!audio.error) return;
      pending.current = null;
      audio.pause();
      syncPlayback();
    };

    for (const event of playbackEvents) audio.addEventListener(event, syncPlayback);
    audio.addEventListener("error", stopOnError);
    window.addEventListener("pageshow", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      pending.current = null;
      for (const event of playbackEvents) audio.removeEventListener(event, syncPlayback);
      audio.removeEventListener("error", stopOnError);
      window.removeEventListener("pageshow", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      audio.pause();
    };
  }, []);

  function playMusic(volume: number, reloadOnError = false) {
    const audio = audioRef.current;
    if (!audio || pending.current || !audio.paused) return;
    audio.volume = volume;
    audio.muted = false;

    const attempt = Symbol();
    pending.current = attempt;
    const finish = () => {
      if (pending.current === attempt) pending.current = null;
    };
    const reject = () => {
      if (pending.current !== attempt) return;
      pending.current = null;
      audio.pause();
    };

    try {
      if (reloadOnError && audio.error) audio.load();
      void audio.play().then(finish, reject);
    } catch {
      reject();
    }
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (pending.current || !audio.paused) {
      pending.current = null;
      audio.pause();
    } else {
      playMusic(0.2, true);
    }
  }

  return { audioRef, isPlaying, playMusic, toggleMusic };
}
