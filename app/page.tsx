export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf7f2] flex items-center justify-center px-6">
      <section className="max-w-3xl text-center">
        <p className="mb-6 text-sm tracking-[0.35em] text-stone-500">
          OUR WEDDING
        </p>

        <h1 className="mb-6 text-5xl font-serif text-stone-800 md:text-7xl">
          Jonathan & Ramita
        </h1>

        <p className="mb-8 text-xl text-stone-600 md:text-2xl">
          2027 / 01 / 17
        </p>

        <div className="rounded-3xl border border-stone-200 bg-white/70 p-8 shadow-sm">
          <p className="mb-2 text-lg text-stone-700">文定儀式與家宴</p>
          <p className="text-stone-500">Taipei Marriott Hotel｜21樓 御廳</p>
        </div>

        <p className="mt-10 leading-8 text-stone-500">
          謝謝你們陪伴我們走到人生重要的一天，
          <br />
          期待與你們一起分享這份喜悅。
        </p>
      </section>
    </main>
  );
}