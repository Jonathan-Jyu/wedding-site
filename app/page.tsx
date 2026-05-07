"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const weddingDate = new Date("2027-01-17T15:30:00+08:00");

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
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCountdown(getCountdown());

    if (audioRef.current) {
      audioRef.current.volume = 0.15;
    }

    const handleFirstClick = async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log("Play failed");
        }
      }
      document.removeEventListener("click", handleFirstClick);
    };

    document.addEventListener("click", handleFirstClick);

    const timer = setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener("click", handleFirstClick);
    };
  }, []);
  const toggleMusic = async () => {
    if (!audioRef.current) return;

    audioRef.current.volume = 0.2;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.muted = false;
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <>
      <audio ref={audioRef} loop>
        <source src="/music/I Do.mp3" type="audio/mpeg" />
      </audio>
    <main className="min-h-screen bg-[#faf7f2] text-stone-800">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-5 text-sm tracking-[0.35em] text-stone-500">
            OUR WEDDING
          </p>

          <h1 className="mb-6 flex flex-wrap items-center justify-center gap-2 font-serif text-4xl leading-tight text-stone-800 sm:text-5xl md:text-7xl">
            <span>Jonathan</span>

            <Image
              src="/kitty蝴蝶結_2.png"
              alt="kitty bow"
              width={80}
              height={80}
              className="translate-y-[-4px] object-contain w-12 md:w-16"
            />

            <span>Ramita</span>
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
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs tracking-[0.4em] text-rose-300">
              WEDDING TIMELINE
            </p>

            <h2 className="font-serif text-4xl text-stone-800 md:text-5xl">
              婚禮時光
            </h2>

            <div className="mx-auto mt-5 h-px w-20 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />

            <p className="mx-auto mt-5 max-w-md leading-7 text-stone-500">
              在這一天，
              <br className="hidden md:block" />
              我們將與最重要的人一起分享幸福與喜悅。
            </p>
          </div>

          <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl shadow-stone-200/50 backdrop-blur md:p-8">
            <div className="relative space-y-8">
              <div className="absolute left-6 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-rose-200 via-amber-200 to-rose-100 md:block" />

              <div className="relative grid gap-5 rounded-3xl bg-[#fffaf7] p-6 md:grid-cols-[120px_1fr] md:p-7">
                <div className="flex items-center gap-4 md:block">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-lg shadow-sm md:mb-4">
                    💍
                  </div>
                  <p className="font-serif text-3xl text-rose-700 md:text-4xl">
                    15:30
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xl font-semibold text-stone-800">
                    文定儀式
                  </p>
                  <p className="leading-7 text-stone-500">
                    於 21 樓御廳舉行文定儀式，邀請親友一同見證我們重要的時刻。
                  </p>
                </div>
              </div>

              <div className="relative grid gap-5 rounded-3xl bg-[#fffaf7] p-6 md:grid-cols-[120px_1fr] md:p-7">
                <div className="flex items-center gap-4 md:block">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg shadow-sm md:mb-4">
                    🍽️
                  </div>
                  <p className="font-serif text-3xl text-amber-700 md:text-4xl">
                    18:30
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xl font-semibold text-stone-800">
                    家宴
                  </p>
                  <p className="leading-7 text-stone-500">
                    與家人好友共享晚宴，在溫馨氛圍中一起留下美好的回憶。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center font-serif text-4xl text-stone-800">
            交通地點
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-2 font-semibold text-stone-700">台北萬豪酒店</p>
              <p className="mb-4 text-sm text-stone-500">
                台北市中山區樂群二路 199 號 21 樓 御廳
              </p>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps?q=Taipei%20Marriott%20Hotel%2C%20No.%20199%20Lequn%202nd%20Road%2C%20Zhongshan%20District%2C%20Taipei&output=embed"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="space-y-4 rounded-2xl border border-white/70 bg-white/75 p-6 backdrop-blur">
                <div>
                  <p className="mb-1 text-sm font-medium text-stone-600">地址</p>
                  <p className="text-stone-700">
                    台北市中山區樂群二路 199 號
                  </p>
                </div>
                <div className="h-px bg-stone-200" />
                <div>
                  <p className="mb-1 text-sm font-medium text-stone-600">交通方式</p>
                  <ul className="space-y-2 text-sm text-stone-600">
                    <li>🚇 捷運：劍南路站 步行約 10 分鐘</li>
                    <li>🅿️ 停車：飯店地下停車場</li>
                  </ul>
                </div>
                <div className="h-px bg-stone-200" />
                <a
                  href="https://maps.app.goo.gl/6hDxZpcdpKC5K3Rx5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-rose-200 px-4 py-2 text-sm font-medium text-rose-800 transition hover:bg-rose-300"
                >
                  開啟 Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <button
        onClick={toggleMusic}
        className="fixed bottom-6 right-6 z-50 rounded-full border border-white/60 bg-white/70 px-5 py-3 text-sm font-medium text-stone-700 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white"
      >
        {isPlaying ? "⏸ Pause Music" : "♫ Play Music"}
      </button>
    </main>
    </>
  );
}