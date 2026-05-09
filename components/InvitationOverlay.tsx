type InvitationOverlayProps = {
  isOpened: boolean;
  isOpening: boolean;
  openInvitation: () => void;
};

export default function InvitationOverlay({
  isOpened,
  isOpening,
  openInvitation,
}: InvitationOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-[#faf7f2] transition-opacity duration-1000 ${
        isOpened ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {!isOpened && (
        <>
          <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-rose-200/50 blur-3xl" />
          <div className="absolute bottom-[-80px] right-[-80px] h-80 w-80 rounded-full bg-amber-200/50 blur-3xl" />

          <div className="flex min-h-screen items-center justify-center px-6">
            <div
              className={`relative h-[520px] w-[390px] max-w-[92vw] transition-all duration-700 ${
                isOpening
                  ? "scale-105 opacity-0 blur-sm delay-[1000ms]"
                  : "scale-100 opacity-100"
              }`}
            >
              <div
                className={`absolute left-1/2 z-30 w-[82%] -translate-x-1/2 rounded-[1.7rem] border border-white/80 bg-[#fffdf9] px-6 py-7 text-center shadow-2xl shadow-stone-200/70 transition-all duration-1000 ease-out ${
                  isOpening ? "top-0 opacity-100" : "top-[150px] opacity-100"
                }`}
              >
                <p className="mb-3 text-[11px] tracking-[0.35em] text-rose-300">
                  WEDDING INVITATION
                </p>

                <h1 className="font-serif text-3xl leading-tight text-stone-800">
                  Jonathan
                  <span className="mx-2 text-rose-300">&</span>
                  Ramita
                </h1>

                <div className="mx-auto my-5 flex items-center justify-center gap-3 text-rose-300">
                  <span className="h-px w-12 bg-rose-200" />
                  <span className="text-xl">♡</span>
                  <span className="h-px w-12 bg-rose-200" />
                </div>

                <p className="text-sm text-stone-500">2027 / 01 / 17</p>

                <p className="mt-6 text-sm leading-7 text-stone-500">
                  誠摯邀請您，
                  <br />
                  與我們一同分享這份喜悅。
                </p>
              </div>

              <div className="absolute bottom-20 left-0 z-10 h-64 w-full rounded-[2rem] bg-gradient-to-br from-[#ffe9e3] to-[#f8cfc8] shadow-2xl shadow-stone-200/70" />

              <div className="absolute bottom-[260px] left-1/2 z-20 h-24 w-[92%] -translate-x-1/2 rounded-t-[2rem] bg-gradient-to-b from-[#eeb4aa] to-[#f8cfc8]" />

              <div className="absolute bottom-20 left-0 z-40 h-64 w-full overflow-hidden rounded-[2rem]">
                <div className="absolute bottom-0 left-0 h-0 w-0 border-b-[256px] border-r-[195px] border-b-[#fde1da] border-r-transparent" />
                <div className="absolute bottom-0 right-0 h-0 w-0 border-b-[256px] border-l-[195px] border-b-[#fbd6ce] border-l-transparent" />
              </div>

              <div className="absolute bottom-20 left-0 z-50 h-64 w-full rounded-[2rem] bg-gradient-to-br from-[#fff0eb] to-[#f9d4cc] shadow-xl [clip-path:polygon(0_28%,50%_63%,100%_28%,100%_100%,0_100%)]" />

              <div className="absolute bottom-[146px] left-1/2 z-[60] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-300 text-xl shadow-lg shadow-amber-200/60">
                ♡
              </div>

              <button
                onClick={openInvitation}
                disabled={isOpening}
                className={`absolute bottom-0 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-stone-800 px-8 py-3 text-sm font-medium text-white shadow-xl transition hover:scale-105 hover:bg-stone-700 disabled:cursor-not-allowed ${
                  isOpening ? "opacity-0" : "opacity-100"
                }`}
              >
                開啟喜帖 ♡
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}