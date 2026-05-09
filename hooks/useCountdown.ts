import { useState, useEffect } from "react";

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const weddingDate = new Date("2027-01-17T15:30:00+08:00");

function getCountdown(): Countdown {
  const now = new Date();
  const diff = weddingDate.getTime() - now.getTime();

  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
  const minutes = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
  const seconds = Math.max(0, Math.floor((diff / 1000) % 60));

  return { days, hours, minutes, seconds };
}

export function useCountdown() {
  const [countdown, setCountdown] = useState<Countdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setCountdown(getCountdown());

    const timer = setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return countdown;
}
