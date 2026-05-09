"use client";

import { motion } from "framer-motion";

type Story = {
  year: string;
  title: string;
  description: string;
  image?: string;
};

type StorySectionProps = {
  stories: Story[];
};

export default function StorySection({ stories }: StorySectionProps) {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs tracking-[0.4em] text-rose-300">
            OUR STORY
          </p>
          <h2 className="font-serif text-4xl text-stone-800 md:text-5xl">
            我們的故事
          </h2>
          <div className="mx-auto mt-5 h-px w-20 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
        </div>

        <div className="space-y-8">
          {stories.map((story, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{
                duration: 1.2,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-xl shadow-stone-200/50 backdrop-blur md:grid-cols-[220px_1fr] md:p-6"
            >
              <div className="overflow-hidden rounded-[1.5rem]">
                {story.image ? (
                    <img
                    src={story.image}
                    alt={story.title}
                    className="h-full w-full object-cover transition duration-700 hover:scale-105"
                    draggable={false}
                    />
                ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-rose-100 via-[#fff7f4] to-amber-100">
                    <p className="font-serif text-4xl text-rose-200">
                        {story.year}
                    </p>
                    </div>
                )}
            </div>

              <div className="flex flex-col justify-center">
                <p className="mb-2 font-serif text-3xl text-rose-700">
                  {story.year}
                </p>
                <h3 className="mb-3 text-xl font-semibold text-stone-800">
                  {story.title}
                </h3>
                <p className="leading-8 text-stone-500">
                  {story.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}