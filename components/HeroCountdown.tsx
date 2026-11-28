"use client";

import { useCountdown } from "@/hooks/useCountdown";
import CountdownCard from "./CountdownCard";

export default function HeroCountdown() {
  const countdown = useCountdown();

  return (
    <div className="mx-auto mb-10 grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4">
      <CountdownCard label="Days" value={countdown?.days ?? null} />
      <CountdownCard label="Hours" value={countdown?.hours ?? null} />
      <CountdownCard label="Minutes" value={countdown?.minutes ?? null} />
      <CountdownCard label="Seconds" value={countdown?.seconds ?? null} />
    </div>
  );
}
