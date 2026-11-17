"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type GallerySectionProps = {
  images: string[];
  galleryRef: React.RefObject<HTMLDivElement | null>;
};

export default function GallerySection({
  images,
  galleryRef,
}: GallerySectionProps) {
  return (
    <section id="gallery" className="overflow-hidden py-20">
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#faf7f2] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#faf7f2] to-transparent" />

        <div
          ref={galleryRef}
          className="flex gap-6 cursor-grab active:cursor-grabbing select-none touch-pan-y"
        >
          {[...images, ...images, ...images].map((src, index) => (
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
              className="relative h-[420px] w-[280px] shrink-0 overflow-hidden rounded-[2rem] shadow-2xl shadow-stone-200/50 md:h-[520px] md:w-[380px]"
              draggable={false}
            >
              <Image
                src={src}
                alt={`gallery-${index}`}
                fill
                sizes="(max-width: 767px) 280px, 380px"
                loading={index < images.length ? "lazy" : "eager"}
                draggable={false}
                className="select-none object-cover transition-all duration-700 hover:brightness-110"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}