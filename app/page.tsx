"use client";

import { useEffect, useRef, useState } from "react";
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
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { useGalleryAnimation } from "@/hooks/useGalleryAnimation";

const INVITATION_OPEN_MS = 1200;
const INVITATION_FADE_FALLBACK_MS = 1100;

export default function Home() {
  const { audioRef, isPlaying, playMusic, toggleMusic } = useBackgroundMusic();
  const [isOpened, setIsOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isInvitationRevealed, setIsInvitationRevealed] = useState(false);
  const openingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  useGalleryAnimation(galleryRef, isInvitationRevealed);

  useEffect(() => {
    return () => {
      if (openingTimer.current !== null) clearTimeout(openingTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpened || isInvitationRevealed) return;
    // The opacity transition normally releases the Gallery. Allow for a skipped transition.
    const timer = setTimeout(() => setIsInvitationRevealed(true), INVITATION_FADE_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [isOpened, isInvitationRevealed]);

  function openInvitation() {
    if (openingTimer.current !== null || isOpened) return;
    setIsOpening(true);
    openingTimer.current = setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });

      setIsOpened(true);
    }, INVITATION_OPEN_MS);
    playMusic(0.15);
  }

  return (
    <>
      <audio ref={audioRef} src="/music/I Love You 3000.mp3" loop />
    <main className="bg-[#faf7f2] text-stone-800">
      <FloatingNavbar />
      <InvitationOverlay
        isOpened={isOpened}
        isOpening={isOpening}
        openInvitation={openInvitation}
        onRevealed={() => setIsInvitationRevealed(true)}
      />
      <HeroSection />
      <GallerySection
        images={galleryImages}
        galleryRef={galleryRef}
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
