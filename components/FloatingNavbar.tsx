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
    <nav className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full border border-white/60 bg-white/55 px-4 py-2 shadow-lg backdrop-blur-md md:top-5 md:px-5 md:py-3">
      <div className="flex items-center gap-3 text-xs text-stone-600 md:gap-6 md:text-sm">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="transition hover:text-rose-400"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}