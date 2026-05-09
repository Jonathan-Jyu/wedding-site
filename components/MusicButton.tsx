type MusicButtonProps = {
  isPlaying: boolean;
  toggleMusic: () => void;
};

export default function MusicButton({
  isPlaying,
  toggleMusic,
}: MusicButtonProps) {
  return (
    <button
      onClick={toggleMusic}
      className="fixed bottom-6 right-6 z-50 rounded-full border border-white/60 bg-white/70 px-5 py-3 text-sm font-medium text-stone-700 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white"
    >
      {isPlaying ? "⏸ Pause Music" : "♫ Play Music"}
    </button>
  );
}