"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import HeroSection from "@/components/HeroSection";
import TimelineSection from "@/components/TimelineSection";
import LocationSection from "@/components/LocationSection";

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
const galleryImages = [
  "/gallery/20201226.jpg",
  "/gallery/20201227.jpg",
  "/gallery/20201228.jpg",
  "/gallery/20210101.jpg",
  "/gallery/20210110.jpg",
  "/gallery/20210112.jpg",
  "/gallery/20201226.jpg",
  "/gallery/20201227.jpg",
  "/gallery/20201228.jpg",
  "/gallery/20210101.jpg",
  "/gallery/20210110.jpg",
  "/gallery/20210112.jpg",
];

export default function Home() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [isGalleryPaused, setIsGalleryPaused] = useState(false);
  const isGalleryPausedRef = useRef(false);
  const currentPositionRef = useRef(0);

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

    // 輪播動畫 - 使用 requestAnimationFrame 確保與螢幕重新整理率同步
    let animationFrameId: number;
    let totalDistance = 0;
    const speed = 0.2; // 像素/幀 (60fps下約48像素/秒)

    const animate = () => {
      if (!galleryRef.current) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      const gallery = galleryRef.current;
      const children = gallery.children;
      if (children.length === 0) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      // 首次計算總距離
      if (totalDistance === 0) {
        const firstChild = children[0] as HTMLElement;
        const style = window.getComputedStyle(gallery);
        const gap = parseFloat(style.gap) || 0;
        const imageWidth = firstChild.offsetWidth;
        totalDistance = (imageWidth + gap) * 5;
      }
      
      if (!isGalleryPausedRef.current) {
        currentPositionRef.current += speed;

        if (currentPositionRef.current >= totalDistance) {
          currentPositionRef.current = 0;
        }

        setScrollPosition(currentPositionRef.current);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(animationFrameId);
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

  const openInvitation = async () => {
    setIsOpening(true);

    if (audioRef.current) {
      audioRef.current.volume = 0.15;

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        console.log("Music autoplay blocked");
      }
    }

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });

      setIsOpened(true);
    }, 1200);
  };


  return (
    <>
      <audio ref={audioRef} loop>
        <source src="/music/I Love You 3000.mp3" type="audio/mpeg" />
      </audio>
    <main className="bg-[#faf7f2] text-stone-800">
      <div className={`fixed inset-0 z-[100] overflow-hidden bg-[#faf7f2] transition-opacity duration-1000 ${
        isOpened ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}>
        {!isOpened && (
          <>
            <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-rose-200/50 blur-3xl" />
            <div className="absolute bottom-[-80px] right-[-80px] h-80 w-80 rounded-full bg-amber-200/50 blur-3xl" />

            <div className="flex min-h-screen items-center justify-center px-6">
            <div
              className={`relative h-[520px] w-[390px] max-w-[92vw] transition-all duration-700 ${
                isOpening ? "scale-105 opacity-0 blur-sm delay-[1000ms]" : "scale-100 opacity-100"
              }`}
            >
              {/* 卡片：一開始插在信封裡，點擊後往上飛出 */}
              <div
                className={`absolute left-1/2 z-30 w-[82%] -translate-x-1/2 rounded-[1.7rem] border border-white/80 bg-[#fffdf9] px-6 py-7 text-center shadow-2xl shadow-stone-200/70 transition-all duration-1000 ease-out ${
                  isOpening ? "top-0 opacity-100" : "top-[150px] opacity-100"
                }`}
              >
                <p className="mb-3 text-[11px] tracking-[0.35em] text-rose-300">
                  WEDDING INVITATION
                </p>

                <h1 className="font-serif text-3xl leading-tight text-stone-800">
                  Jonathan
                  <span className="mx-2 text-rose-300">&</span>
                  Ramita
                </h1>

                <div className="mx-auto my-5 flex items-center justify-center gap-3 text-rose-300">
                  <span className="h-px w-12 bg-rose-200" />
                  <span className="text-xl">♡</span>
                  <span className="h-px w-12 bg-rose-200" />
                </div>

                <p className="text-sm text-stone-500">2027 / 01 / 17</p>

                <p className="mt-6 text-sm leading-7 text-stone-500">
                  誠摯邀請您，
                  <br />
                  與我們一同分享這份喜悅。
                </p>
              </div>

              {/* 信封背板：開口朝上 */}
              <div className="absolute bottom-20 left-0 z-10 h-64 w-full rounded-[2rem] bg-gradient-to-br from-[#ffe9e3] to-[#f8cfc8] shadow-2xl shadow-stone-200/70" />

              {/* 信封內側陰影 */}
              <div className="absolute bottom-[260px] left-1/2 z-20 h-24 w-[92%] -translate-x-1/2 rounded-t-[2rem] bg-gradient-to-b from-[#eeb4aa] to-[#f8cfc8]" />

              {/* 左右信封摺片 */}
              <div className="absolute bottom-20 left-0 z-40 h-64 w-full overflow-hidden rounded-[2rem]">
                <div className="absolute bottom-0 left-0 h-0 w-0 border-b-[256px] border-r-[195px] border-b-[#fde1da] border-r-transparent" />
                <div className="absolute bottom-0 right-0 h-0 w-0 border-b-[256px] border-l-[195px] border-b-[#fbd6ce] border-l-transparent" />
              </div>

              {/* 信封正面：V 型 */}
              <div className="absolute bottom-20 left-0 z-50 h-64 w-full rounded-[2rem] bg-gradient-to-br from-[#fff0eb] to-[#f9d4cc] shadow-xl [clip-path:polygon(0_28%,50%_63%,100%_28%,100%_100%,0_100%)]" />

              {/* 金色愛心封口 */}
              <div className="absolute bottom-[146px] left-1/2 z-[60] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-300 text-xl shadow-lg shadow-amber-200/60">
                ♡
              </div>

              {/* 按鈕：信封下方 */}
              <button
                onClick={openInvitation}
                disabled={isOpening}
                className={`absolute bottom-0 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-stone-800 px-8 py-3 text-sm font-medium text-white shadow-xl transition hover:scale-105 hover:bg-stone-700 disabled:cursor-not-allowed ${
                  isOpening ? "opacity-0" : "opacity-100"
                }`}
              >
                開啟喜帖 ♡
              </button>
            </div>
          </div>
          </>
        )}
      </div>
      <HeroSection countdown={countdown} />
      <section className="overflow-hidden py-20">
        <div className="relative">
          {/* 漸層遮罩 */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#faf7f2] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#faf7f2] to-transparent" />

          {/* 自動輪播 */}
          <div
            ref={galleryRef}
            className="flex gap-6"
            onMouseDown={() => {
              setIsGalleryPaused(true);
              isGalleryPausedRef.current = true;
            }}
            onMouseUp={() => {
              setIsGalleryPaused(false);
              isGalleryPausedRef.current = false;
            }}
            onMouseLeave={() => {
              setIsGalleryPaused(false);
              isGalleryPausedRef.current = false;
            }}
            onTouchStart={() => {
              setIsGalleryPaused(true);
              isGalleryPausedRef.current = true;
            }}
            onTouchEnd={() => {
              setIsGalleryPaused(false);
              isGalleryPausedRef.current = false;
            }}
            style={{
              transform: `translateX(-${scrollPosition}px)`,
              transition: "transform 0.016s linear",
            }}
          >
            {galleryImages.map((src, index) => (
              <div
                key={index}
                className="min-w-[280px] overflow-hidden rounded-[2rem] shadow-2xl shadow-stone-200/50 md:min-w-[380px]"
              >
                <img
                  src={src}
                  alt={`gallery-${index}`}
                  className="h-[420px] w-full object-cover transition duration-700 hover:scale-105 md:h-[520px]"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <TimelineSection />

      <LocationSection />
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