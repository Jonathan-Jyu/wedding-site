"use client";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Gallery", href: "#gallery" },
  { label: "Story", href: "#story" },
  { label: "Timeline", href: "#timeline" },
  { label: "RSVP", href: "#rsvp" },
  { label: "Location", href: "#location" },
];

export default function FloatingNavbar() {
  return (
    <nav aria-label="婚禮導覽" className="fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-50 w-max max-w-[calc(100%-2*max(0.5rem,env(safe-area-inset-left),env(safe-area-inset-right)))] -translate-x-1/2 overflow-x-auto rounded-full border border-white/60 bg-white/55 px-2 shadow-lg [scrollbar-width:none] backdrop-blur-md md:top-[max(1.25rem,env(safe-area-inset-top))] md:px-4 md:py-1">
      <div className="flex w-max items-center gap-1 whitespace-nowrap text-xs text-stone-600 max-[350px]:gap-0.5 sm:gap-3 md:gap-4 md:text-sm">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex min-h-9 items-center rounded-full px-1 transition hover:text-rose-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stone-700"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
