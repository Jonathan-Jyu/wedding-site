"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flower2 } from "lucide-react";

type Petal = {
  id: number;
  x: number;
  drift: number;
  delay: number;
  duration: number;
  size: number;
};

export default function FooterSection() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    const generatedPetals = [...Array(12)].map((_, index) => ({
      id: index,
      x: Math.random() * window.innerWidth,
      drift: Math.random() * 160 - 80,
      delay: Math.random() * 8,
      duration: 18 + Math.random() * 10,
      size: 12 + Math.random() * 10,
    }));

    setPetals(generatedPetals);
  }, []);

  return (
    <section className="relative overflow-hidden px-6 py-28">
      {/* 花瓣 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {petals.map((petal) => (
          <motion.div
            key={petal.id}
            initial={{
              opacity: 0,
              y: -100,
              x: petal.x,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 0.7, 0],
              y: 1200,
              x: petal.x + petal.drift,
              rotate: 360,
            }}
            transition={{
              duration: petal.duration,
              repeat: Infinity,
              delay: petal.delay,
              ease: "linear",
            }}
            className="absolute top-0"
          >
            <Flower2
              className="text-rose-200/70"
              style={{
                width: petal.size,
                height: petal.size,
              }}
            />
          </motion.div>
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
          "With you, every ordinary moment
          <br />
          becomes something unforgettable."
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
