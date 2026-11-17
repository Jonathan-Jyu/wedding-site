import { useEffect, useRef, useState, useCallback } from "react";

function normalizePosition(position: number, distance: number) {
  if (distance <= 0) return position;
  return ((position % distance) + distance) % distance;
}

export function useGalleryAnimation(galleryRef: React.RefObject<HTMLDivElement | null>) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const isGalleryPausedRef = useRef(false);
  const currentPositionRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPositionRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);

  const setPaused = (paused: boolean) => {
    isGalleryPausedRef.current = paused;
  };

  const calculateTotalDistance = useCallback(() => {
    if (!galleryRef.current || galleryRef.current.children.length === 0) {
      return 0;
    }
    const children = galleryRef.current.children;
    const secondSetStart = children[Math.floor(children.length / 2)] as HTMLElement;
    return secondSetStart.offsetLeft;
  }, [galleryRef]);

  const handleDragStart = useCallback((e: PointerEvent) => {
    if (isGalleryPausedRef.current) return;

    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const clientX = e.clientX;
    dragStartXRef.current = clientX;
    dragStartPositionRef.current = currentPositionRef.current;
    lastXRef.current = clientX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  }, []);

  const handleDragMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;

    const clientX = e.clientX;
    const deltaX = clientX - dragStartXRef.current;
    const newPosition = normalizePosition(
      dragStartPositionRef.current - deltaX,
      calculateTotalDistance(),
    );

    // 計算速度
    const now = Date.now();
    const timeDelta = now - lastTimeRef.current;
    if (timeDelta > 0) {
      velocityRef.current = (lastXRef.current - clientX) / timeDelta;
    }
    lastXRef.current = clientX;
    lastTimeRef.current = now;

    currentPositionRef.current = newPosition;
    setScrollPosition(newPosition);
  }, [calculateTotalDistance]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    gallery.addEventListener("pointerdown", handleDragStart);
    gallery.addEventListener("pointermove", handleDragMove);
    gallery.addEventListener("pointerup", handleDragEnd);
    gallery.addEventListener("pointercancel", handleDragEnd);

    return () => {
      gallery.removeEventListener("pointerdown", handleDragStart);
      gallery.removeEventListener("pointermove", handleDragMove);
      gallery.removeEventListener("pointerup", handleDragEnd);
      gallery.removeEventListener("pointercancel", handleDragEnd);
    };
  }, [galleryRef, handleDragStart, handleDragMove, handleDragEnd]);

  useEffect(() => {
    let animationFrameId: number;
    const totalDistance = calculateTotalDistance();
    const speed = 2.0; // 自動滾動速度（像素/幀）
    let momentumVelocity = 0;

    const animate = () => {
      if (!galleryRef.current) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      if (isDraggingRef.current) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      // 動量滾動（摩擦減速）
      if (Math.abs(momentumVelocity) > 0.01) {
        currentPositionRef.current += momentumVelocity;
        momentumVelocity *= 0.95; // 摩擦係數
      } else if (!isGalleryPausedRef.current && Math.abs(velocityRef.current) < 0.1) {
        // 自動滾動（沒有拖動時）
        currentPositionRef.current += speed;
      } else {
        // 用戶剛停止拖動，應用初始速度
        if (velocityRef.current !== 0) {
          momentumVelocity = velocityRef.current * 50;
          velocityRef.current = 0;
        }
      }

      currentPositionRef.current = normalizePosition(
        currentPositionRef.current,
        totalDistance,
      );

      setScrollPosition(currentPositionRef.current);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [calculateTotalDistance, galleryRef]);

  return { scrollPosition, setPaused };
}
