"use client";

import { motion } from "framer-motion";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type GallerySectionProps = {
  images: string[];
  galleryRef: React.RefObject<HTMLDivElement | null>;
};

function GalleryPhotoCard({ src, alt, loading }: Pick<ImageProps, "src" | "alt" | "loading">) {
  const [failed, setFailed] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-[420px] w-[280px] shrink-0 overflow-hidden rounded-[2rem] shadow-2xl shadow-stone-200/50 md:h-[520px] md:w-[380px]"
      draggable={false}
      onLoadCapture={() => setFailed(false)}
    >
      {failed && (
        <div
          role="img"
          aria-label="照片暫時無法顯示"
          className="absolute inset-0 flex items-center justify-center bg-stone-100 p-4 text-center text-sm text-stone-600"
        >
          照片暫時無法顯示
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 767px) 280px, 380px"
        loading={loading}
        draggable={false}
        aria-hidden={failed || undefined}
        onError={() => setFailed(true)}
        className={failed ? "invisible" : "select-none object-cover transition-all duration-700 hover:brightness-110"}
      />
    </motion.div>
  );
}

export default function GallerySection({
  images,
  galleryRef,
}: GallerySectionProps) {
  return (
    <section id="gallery" className="overflow-hidden py-20">
      <div className="relative cursor-grab select-none touch-pan-y touch-pinch-zoom active:cursor-grabbing">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#faf7f2] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#faf7f2] to-transparent" />

        <div
          ref={galleryRef}
          className="flex gap-6"
        >
          {[0, 1, 2].map((group) => (
            <div key={group} className="flex shrink-0 gap-6">
              {images.map((src, index) => (
                <GalleryPhotoCard
                  key={`${index}-${src}`}
                  src={src}
                  alt={`gallery-${group * images.length + index}`}
                  loading={group === 0 ? "lazy" : "eager"}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
