import { useEffect, useRef, useState, useCallback } from "react";

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
    const firstChild = galleryRef.current.children[0] as HTMLElement;
    const style = window.getComputedStyle(galleryRef.current);
    const gap = parseFloat(style.gap) || 0;
    const imageWidth = firstChild.offsetWidth;
    return (imageWidth + gap) * (galleryRef.current.children.length / 2);
  }, [galleryRef]);

  const handleDragStart = useCallback((e: MouseEvent | TouchEvent) => {
    if (isGalleryPausedRef.current) return;
    
    isDraggingRef.current = true;
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    dragStartXRef.current = clientX;
    dragStartPositionRef.current = currentPositionRef.current;
    lastXRef.current = clientX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  }, []);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;

    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const deltaX = clientX - dragStartXRef.current;
    const newPosition = dragStartPositionRef.current - deltaX;

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
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    gallery.addEventListener("mousedown", handleDragStart as any);
    gallery.addEventListener("touchstart", handleDragStart as any);
    window.addEventListener("mousemove", handleDragMove as any);
    window.addEventListener("touchmove", handleDragMove as any);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      gallery.removeEventListener("mousedown", handleDragStart as any);
      gallery.removeEventListener("touchstart", handleDragStart as any);
      window.removeEventListener("mousemove", handleDragMove as any);
      window.removeEventListener("touchmove", handleDragMove as any);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  useEffect(() => {
    let animationFrameId: number;
    const totalDistance = calculateTotalDistance();
    const speed = 0.2;
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

      // 無限環形滾動
      if (totalDistance > 0) {
        if (currentPositionRef.current >= totalDistance) {
          currentPositionRef.current -= totalDistance;
        } else if (currentPositionRef.current < 0) {
          currentPositionRef.current += totalDistance;
        }
      }

      setScrollPosition(currentPositionRef.current);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [calculateTotalDistance]);

  return { scrollPosition, setPaused };
}
