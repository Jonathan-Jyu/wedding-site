import { useLayoutEffect, useRef, useCallback } from "react";

function normalizePosition(position: number, distance: number) {
  if (distance <= 0) return position;
  return distance + (((position - distance) % distance) + distance) % distance;
}

export function useGalleryAnimation(galleryRef: React.RefObject<HTMLDivElement | null>) {
  const currentPositionRef = useRef(0);
  const loopDistanceRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPositionRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);

  const calculateTotalDistance = useCallback(() => {
    if (!galleryRef.current || galleryRef.current.children.length === 0) {
      return 0;
    }
    const children = galleryRef.current.children;
    const setSize = children.length / 3;
    const firstSetStart = children[0] as HTMLElement;
    const secondSetStart = children[setSize] as HTMLElement;
    return secondSetStart.getBoundingClientRect().left - firstSetStart.getBoundingClientRect().left;
  }, [galleryRef]);

  const handleDragStart = useCallback((e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

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
      loopDistanceRef.current,
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
    galleryRef.current!.style.transform = `translate3d(-${newPosition}px, 0, 0)`;
  }, [galleryRef]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useLayoutEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const updateLoopDistance = () => {
      const nextDistance = calculateTotalDistance();
      const previousDistance = loopDistanceRef.current;
      if (nextDistance <= 0) return;

      if (previousDistance > 0) {
        const progress = (currentPositionRef.current - previousDistance) / previousDistance;
        currentPositionRef.current = nextDistance + progress * nextDistance;
      } else {
        currentPositionRef.current = nextDistance;
      }

      loopDistanceRef.current = nextDistance;
      currentPositionRef.current = normalizePosition(
        currentPositionRef.current,
        nextDistance,
      );
      gallery.style.transform = `translate3d(-${currentPositionRef.current}px, 0, 0)`;
    };

    updateLoopDistance();
    const resizeObserver = new ResizeObserver(updateLoopDistance);
    resizeObserver.observe(gallery);

    const speed = 2.0;
    let animationFrameId: number;
    let momentumVelocity = 0;

    const animate = () => {
      const distance = loopDistanceRef.current;
      if (distance > 0 && !isDraggingRef.current) {
        if (Math.abs(momentumVelocity) > 0.01) {
          currentPositionRef.current += momentumVelocity;
          momentumVelocity *= 0.95;
        } else if (Math.abs(velocityRef.current) < 0.1) {
          currentPositionRef.current += speed;
        } else {
          momentumVelocity = velocityRef.current * 50;
          velocityRef.current = 0;
        }

        currentPositionRef.current = normalizePosition(
          currentPositionRef.current,
          distance,
        );
        gallery.style.transform = `translate3d(-${currentPositionRef.current}px, 0, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    gallery.addEventListener("pointerdown", handleDragStart);
    gallery.addEventListener("pointermove", handleDragMove);
    gallery.addEventListener("pointerup", handleDragEnd);
    gallery.addEventListener("pointercancel", handleDragEnd);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      gallery.removeEventListener("pointerdown", handleDragStart);
      gallery.removeEventListener("pointermove", handleDragMove);
      gallery.removeEventListener("pointerup", handleDragEnd);
      gallery.removeEventListener("pointercancel", handleDragEnd);
    };
  }, [calculateTotalDistance, galleryRef, handleDragStart, handleDragMove, handleDragEnd]);
}
