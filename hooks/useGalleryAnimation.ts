import { useEffect, useRef, useState } from "react";

export function useGalleryAnimation(galleryRef: React.RefObject<HTMLDivElement | null>) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const isGalleryPausedRef = useRef(false);
  const currentPositionRef = useRef(0);

  const setPaused = (paused: boolean) => {
    isGalleryPausedRef.current = paused;
  };

  useEffect(() => {
    let animationFrameId: number;
    let totalDistance = 0;
    const speed = 0.2; // 像素/幀 (60fps下約48像素/秒)

    const animate = () => {
      if (!galleryRef.current) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const gallery = galleryRef.current;
      const children = gallery.children;
      if (children.length === 0) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      // 首次計算總距離
      if (totalDistance === 0) {
        const firstChild = children[0] as HTMLElement;
        const style = window.getComputedStyle(gallery);
        const gap = parseFloat(style.gap) || 0;
        const imageWidth = firstChild.offsetWidth;
        totalDistance = (imageWidth + gap) * 5;
      }

      if (!isGalleryPausedRef.current) {
        currentPositionRef.current += speed;

        if (currentPositionRef.current >= totalDistance) {
          currentPositionRef.current = 0;
        }

        setScrollPosition(currentPositionRef.current);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [galleryRef]);

  return { scrollPosition, setPaused };
}
