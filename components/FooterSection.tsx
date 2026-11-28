"use client";

import { useRef, type CSSProperties } from "react";
import { motion, useInView } from "framer-motion";
import { Flower2 } from "lucide-react";

const petals = Array.from({ length: 12 }, (_, id) => ({
  id,
  size: 12 + (id * 7) % 10,
  style: {
    left: `${(id * 37 + 8) % 100}%`,
    "--petal-drift": `${(id * 57 + 31) % 160 - 80}px`,
    animationDelay: `${(id * 2.7) % 8}s`,
    animationDuration: `${18 + (id * 3.1) % 10}s`,
  } satisfies CSSProperties & { "--petal-drift": string },
}));

export default function FooterSection() {
  const section = useRef<HTMLElement>(null);
  const visible = useInView(section);

  return (
    <section ref={section} className="relative overflow-hidden px-6 py-28">
      {/* 花瓣 */}
      <div aria-hidden="true" data-petals-visible={visible} className="pointer-events-none absolute inset-0 overflow-hidden">
        {petals.map((petal) => (
          <div
            key={petal.id}
            className="footer-petal absolute top-0"
            style={petal.style}
          >
            <Flower2
              className="text-rose-200/70"
              style={{
                width: petal.size,
                height: petal.size,
              }}
            />
          </div>
        ))}
      </div>

      {/* 背景光暈 */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-100/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{
          duration: 1.8,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <p className="mb-5 text-xs tracking-[0.45em] text-rose-300">
          THANK YOU
        </p>

        <h2 className="mb-8 font-serif text-5xl text-stone-800 md:text-6xl">
          With Love
        </h2>

        <div className="mx-auto mb-10 h-px w-24 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />

        <p className="mx-auto max-w-2xl font-serif text-[1.25rem] italic leading-[2.6rem] text-[#8f8178] md:text-[1.45rem]">
          Thank you for being part of our journey,
          <br />
          for every moment of love, laughter, and kindness along the way.
        </p>

        <p className="mt-14 font-serif text-2xl italic tracking-[0.02em] leading-10 text-[#c6a77d] md:text-3xl">
          &quot;With you, every ordinary moment
          <br />
          becomes something unforgettable.&quot;
        </p>

        <div className="mt-16">
          <p className="font-serif text-4xl tracking-wide text-stone-800 md:text-5xl">
            Jonathan & Ramita
          </p>

          <p className="mt-4 tracking-[0.45em] text-stone-400">
            JANUARY 17, 2027
          </p>
        </div>
      </motion.div>
    </section>
  );
}
