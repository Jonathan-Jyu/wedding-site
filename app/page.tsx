"use client";

import { useEffect, useState } from "react";

const weddingDate = new Date("2027-01-17T15:00:00+08:00");

function getCountdown() {
  const now = new Date();
  const diff = weddingDate.getTime() - now.getTime();

  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
  const minutes = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
  const seconds = Math.max(0, Math.floor((diff / 1000) % 60));

  return { days, hours, minutes, seconds };
}

export default function Home() {
  const [countdown, setCountdown] = useState(getCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#faf7f2] text-stone-800">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-5 text-sm tracking-[0.35em] text-stone-500">
            OUR WEDDING
          </p>

          <h1 className="mb-6 font-serif text-5xl leading-tight text-stone-800 md:text-7xl">
            Jonathan
            <span className="mx-3 text-rose-300">&</span>
            Ramita
          </h1>

          <p className="mb-10 text-xl text-stone-600 md:text-2xl">
            2027 / 01 / 17
          </p>

          <div className="mx-auto mb-10 grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <p className="text-3xl font-semibold">{countdown.days}</p>
              <p className="mt-1 text-sm text-stone-500">Days</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <p className="text-3xl font-semibold">{countdown.hours}</p>
              <p className="mt-1 text-sm text-stone-500">Hours</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <p className="text-3xl font-semibold">{countdown.minutes}</p>
              <p className="mt-1 text-sm text-stone-500">Minutes</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <p className="text-3xl font-semibold">{countdown.seconds}</p>
              <p className="mt-1 text-sm text-stone-500">Seconds</p>
            </div>
          </div>

          <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-xl shadow-stone-200/50 backdrop-blur">
            <p className="mb-3 text-lg font-medium text-stone-700">
              文定儀式與家宴
            </p>
            <p className="text-stone-500">
              Taipei Marriott Hotel｜21樓 御廳
            </p>
            <div className="my-6 h-px bg-stone-200" />
            <p className="leading-8 text-stone-500">
              謝謝你們陪伴我們走到人生重要的一天，
              <br className="hidden md:block" />
              期待與你們一起分享這份喜悅。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}