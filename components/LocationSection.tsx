import { weddingInfo } from "@/data/wedding";

export default function LocationSection() {
  return (
    <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs tracking-[0.4em] text-rose-300">
              LOCATION
            </p>

            <h2 className="font-serif text-4xl text-stone-800 md:text-5xl">
              交通地點
            </h2>

            <div className="mx-auto mt-5 h-px w-20 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-2 font-semibold text-stone-700">{weddingInfo.venue.name}</p>
              <p className="mb-4 text-sm text-stone-500">
                {weddingInfo.venue.address}
              </p>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src={weddingInfo.venue.embedUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="space-y-4 rounded-2xl border border-white/70 bg-white/75 p-6 backdrop-blur">
                <div>
                  <p className="mb-1 text-sm font-medium text-stone-600">地址</p>
                  <p className="text-stone-700">
                    {weddingInfo.venue.address}
                  </p>
                </div>
                <div className="h-px bg-stone-200" />
                <div>
                  <p className="mb-1 text-sm font-medium text-stone-600">交通方式</p>
                  <ul className="space-y-2 text-sm text-stone-600">
                    <li>🚇 捷運：劍南路站 步行約 10 分鐘</li>
                    <li>🅿️ 停車：飯店地下停車場</li>
                  </ul>
                </div>
                <div className="h-px bg-stone-200" />
                <a
                  href={weddingInfo.venue.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-rose-200 px-4 py-2 text-sm font-medium text-rose-800 transition hover:bg-rose-300"
                >
                  開啟 Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}