import { useState, useEffect } from "react";

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const weddingTime = Date.parse("2027-01-17T15:30:00+08:00");

function getCountdown(remainingMs: number): Countdown {
  const seconds = Math.ceil(remainingMs / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
}

export function useCountdown() {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function sync() {
      clearTimeout(timer);
      if (document.hidden) return;

      const remainingMs = Math.max(0, weddingTime - Date.now());
      setCountdown(getCountdown(remainingMs));
      if (remainingMs > 0) {
        timer = setTimeout(sync, (remainingMs - 1) % 1000 + 1);
      }
    }

    timer = setTimeout(sync, 0);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, []);

  return countdown;
}
