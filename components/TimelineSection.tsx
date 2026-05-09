export default function TimelineSection() {
  return (
    <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs tracking-[0.4em] text-rose-300">
              WEDDING TIMELINE
            </p>

            <h2 className="font-serif text-4xl text-stone-800 md:text-5xl">
              婚禮時光
            </h2>

            <div className="mx-auto mt-5 h-px w-20 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />

            <p className="mx-auto mt-5 max-w-md leading-7 text-stone-500">
              在這一天，
              <br className="hidden md:block" />
              我們將與最重要的人一起分享幸福與喜悅。
            </p>
          </div>

          <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl shadow-stone-200/50 backdrop-blur md:p-8">
            <div className="relative space-y-8">
              <div className="absolute left-6 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-rose-200 via-amber-200 to-rose-100 md:block" />

              <div className="relative grid gap-5 rounded-3xl bg-[#fffaf7] p-6 md:grid-cols-[120px_1fr] md:p-7">
                <div className="flex items-center gap-4 md:block">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-lg shadow-sm md:mb-4">
                    💍
                  </div>
                  <p className="font-serif text-3xl text-rose-700 md:text-4xl">
                    15:30
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xl font-semibold text-stone-800">
                    文定儀式
                  </p>
                  <p className="leading-7 text-stone-500">
                    於 21 樓御廳舉行文定儀式，邀請親友一同見證我們重要的時刻。
                  </p>
                </div>
              </div>

              <div className="relative grid gap-5 rounded-3xl bg-[#fffaf7] p-6 md:grid-cols-[120px_1fr] md:p-7">
                <div className="flex items-center gap-4 md:block">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg shadow-sm md:mb-4">
                    🍽️
                  </div>
                  <p className="font-serif text-3xl text-amber-700 md:text-4xl">
                    18:30
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xl font-semibold text-stone-800">
                    家宴
                  </p>
                  <p className="leading-7 text-stone-500">
                    與家人好友共享晚宴，在溫馨氛圍中一起留下美好的回憶。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}