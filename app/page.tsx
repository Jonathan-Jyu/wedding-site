"use client";

import { useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
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
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

const INVITATION_OPEN_MS = 1200;
const INVITATION_FADE_FALLBACK_MS = 1100;

export default function Home() {
  const reducedMotion = useReducedMotionPreference();
  const { audioRef, isPlaying, playMusic, toggleMusic } = useBackgroundMusic();
  const [isOpened, setIsOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isInvitationRevealed, setIsInvitationRevealed] = useState(false);
  const openingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const homeHeading = useRef<HTMLHeadingElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  useGalleryAnimation(galleryRef, isInvitationRevealed, reducedMotion);

  useEffect(() => {
    return () => {
      if (openingTimer.current !== null) clearTimeout(openingTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpened || isInvitationRevealed) return;
    // The opacity transition normally releases the Gallery. Allow for a skipped transition.
    const timer = setTimeout(() => setIsInvitationRevealed(true), reducedMotion ? 0 : INVITATION_FADE_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [isOpened, isInvitationRevealed, reducedMotion]);

  useEffect(() => {
    if (isInvitationRevealed) homeHeading.current?.focus({ preventScroll: true });
  }, [isInvitationRevealed]);

  function openInvitation() {
    if (openingTimer.current !== null || isOpened) return;
    setIsOpening(true);
    openingTimer.current = setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });

      setIsOpened(true);
      if (reducedMotion) setIsInvitationRevealed(true);
    }, reducedMotion ? 0 : INVITATION_OPEN_MS);
    playMusic(0.15);
  }

  return (
    <MotionConfig reducedMotion="user">
      <audio ref={audioRef} src="/music/I Love You 3000.mp3" loop />
      <InvitationOverlay
        isOpened={isOpened}
        isOpening={isOpening}
        isRevealed={isInvitationRevealed}
        openInvitation={openInvitation}
        onRevealed={() => setIsInvitationRevealed(true)}
      />
    <main inert={!isInvitationRevealed} className="bg-[#faf7f2] text-stone-800">
      <FloatingNavbar />
      <HeroSection headingRef={homeHeading} />
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
    </MotionConfig>
  );
}
