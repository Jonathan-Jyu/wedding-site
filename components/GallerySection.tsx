"use client";

import { motion } from "framer-motion";
import { useCallback } from "react";

type GallerySectionProps = {
  images: string[];
  galleryRef: React.RefObject<HTMLDivElement | null>;
  scrollPosition: number;
  setPaused: (paused: boolean) => void;
};

export default function GallerySection({
  images,
  galleryRef,
  scrollPosition,
  setPaused,
}: GallerySectionProps) {
  // 統一的暫停/繼續處理
  const handlePauseStart = useCallback(() => {
    setPaused(true);
  }, [setPaused]);

  const handlePauseEnd = useCallback(() => {
    setPaused(false);
  }, [setPaused]);

  return (
    <section id="gallery" className="overflow-hidden py-20">
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#faf7f2] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#faf7f2] to-transparent" />

        <div
          ref={galleryRef}
          className="flex gap-6"
          onMouseDown={handlePauseStart}
          onMouseUp={handlePauseEnd}
          onMouseLeave={handlePauseEnd}
          onTouchStart={handlePauseStart}
          onTouchEnd={handlePauseEnd}
          style={{
            transform: `translateX(-${scrollPosition}px)`,
            transition: "transform 0.016s linear",
          }}
        >
          {[...images, ...images].map((src, index) => (
            <motion.div
              key={index}
              whileHover={{
                scale: 1.03,
                y: -8,
              }}
              transition={{
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="min-w-[280px] overflow-hidden rounded-[2rem] shadow-2xl shadow-stone-200/50 md:min-w-[380px]"
            >
              <img
                src={src}
                alt={`gallery-${index}`}
                draggable={false}
                className="
                  h-[420px] w-full object-cover
                  select-none
                  transition-all duration-700
                  hover:brightness-110
                  md:h-[520px]
                "
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}