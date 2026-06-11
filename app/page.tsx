"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import HeroSection from "@/components/HeroSection";
import TimelineSection from "@/components/TimelineSection";
import LocationSection from "@/components/LocationSection";
import RSVPSection from "@/components/RSVPSection";
import MusicButton from "@/components/MusicButton";
import GallerySection from "@/components/GallerySection";
import InvitationOverlay from "@/components/InvitationOverlay";
import StorySection from "@/components/StorySection";
import FooterSection from "@/components/FooterSection";
import FloatingNavbar from "@/components/FloatingNavbar";
import { galleryImages } from "@/data/wedding";
import { storyTimeline } from "@/data/story";
import { useCountdown } from "@/hooks/useCountdown";
import { useGalleryAnimation } from "@/hooks/useGalleryAnimation";

export default function Home() {
  const countdown = useCountdown();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const { scrollPosition, setPaused } = useGalleryAnimation(galleryRef);

  // 首次點擊播放音樂
  useEffect(() => {
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

    return () => {
      document.removeEventListener("click", handleFirstClick);
    };
  }, []);

  const toggleMusic = useCallback(async () => {
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
  }, [isPlaying]);

  const openInvitation = useCallback(async () => {
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
  }, []);

  return (
    <>
      <audio ref={audioRef} loop>
        <source src="/music/I Love You 3000.mp3" type="audio/mpeg" />
      </audio>
    <main className="bg-[#faf7f2] text-stone-800">
      <FloatingNavbar />
      <InvitationOverlay
        isOpened={isOpened}
        isOpening={isOpening}
        openInvitation={openInvitation}
      />
      <HeroSection countdown={countdown} />
      <GallerySection
        images={galleryImages}
        galleryRef={galleryRef}
        scrollPosition={scrollPosition}
        setPaused={setPaused}
      />
      
      <StorySection stories={storyTimeline} />
      <TimelineSection />

      <RSVPSection />

      <LocationSection />
      <FooterSection />
      <MusicButton
        isPlaying={isPlaying}
        toggleMusic={toggleMusic}
      />
    </main>
    </>
  );
}