"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const weddingDate = new Date("2027-01-17T18:00:00+08:00");

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

          <h1 className="relative mb-6 pt-10 font-serif text-4xl leading-tight text-stone-800 sm:text-5xl md:pt-12 md:text-7xl">
            <Image
              src="/kitty蝴蝶結_2.png"
              alt="kitty bow"
              width={64}
              height={64}
              className="absolute left-1/2 top-0 h-10 w-10 -translate-x-1/2 -rotate-6 opacity-90 md:h-14 md:w-14"
            />

          <span className="block md:inline">Jonathan</span>
          <span className="mx-2 text-rose-300 md:mx-3">&</span>
          <span className="block md:inline">Ramita</span>
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
    </main>
  );
}