import { useLayoutEffect, useRef } from "react";

// 調整 Gallery 的自動播放速度、拖曳閾值、最大幀間隔等參數，以提供更流暢的動畫體驗
const AUTO_SPEED = 60; // 2px per frame at 60Hz, expressed in px/s.
const MAX_FRAME_GAP_MS = 250;
const MAX_FRAME_STEP_MS = 1000 / 30;
const DRAG_THRESHOLD_PX = 8;
const VELOCITY_MAX_AGE_MS = 80;
const MIN_FLING_SPEED = 100;
const MAX_FLING_SPEED = 1800;
const FLING_SPEED_MULTIPLIER = 3;
const MOMENTUM_DECAY_RATE = -Math.log(0.95) * 60;
const MOMENTUM_STOP_THRESHOLD = 6;
const START_VISIBILITY_RATIO = 0.01;

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastMoveTime: number;
  velocity: number;
  isDragging: boolean;
};

function wrapPosition(position: number, distance: number, start = 0) {
  return start + (((position - start) % distance) + distance) % distance;
}

export function useGalleryAnimation(
  galleryRef: React.RefObject<HTMLDivElement | null>,
  isInvitationOpen: boolean,
) {
  const updateInvitation = useRef<((isOpen: boolean) => void) | null>(null);

  useLayoutEffect(() => {
    const gallery = galleryRef.current;
    const viewport = gallery?.parentElement;
    if (!gallery || !viewport) return;

    let position = 0;
    let renderedPosition = 0;
    let loopDistance = 0;
    let loopStart = 0;
    let viewportWidth = 0;
    let invitationOpen = false;
    let inView = false;
    let disposed = false;
    let gesture: Gesture | null = null;
    let pendingDragDelta = 0;
    let momentumVelocity: number | null = null;
    let previousTimestamp: number | null = null;
    let animationFrameId: number | null = null;

    const canAnimate = () => !disposed && invitationOpen && inView && !document.hidden;

    const requestFrame = () => {
      const needsFrame = pendingDragDelta !== 0 || position !== renderedPosition || (!gesture && loopDistance > 0);
      if (animationFrameId === null && canAnimate() && needsFrame) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const cancelFrame = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      previousTimestamp = null;
    };

    const renderPosition = () => {
      if (loopDistance > 0) position = wrapPosition(position, loopDistance, loopStart);
      if (position === renderedPosition) return;

      gallery.style.transform = `translate3d(${-position}px, 0, 0)`;
      renderedPosition = position;
    };

    const animate = (timestamp: number) => {
      animationFrameId = null;
      if (!canAnimate()) {
        pausePlayback();
        return;
      }

      const elapsed = previousTimestamp === null ? 0 : timestamp - previousTimestamp;
      const dt = elapsed > MAX_FRAME_GAP_MS ? 0 : Math.min(elapsed, MAX_FRAME_STEP_MS) / 1000;
      previousTimestamp = timestamp;

      if (pendingDragDelta !== 0) {
        position += pendingDragDelta;
        pendingDragDelta = 0;
      } else if (!gesture && loopDistance > 0 && dt > 0) {
        position += AUTO_SPEED * dt;
        if (momentumVelocity !== null) {
          // Integrate exponential decay toward autoplay speed over this frame.
          const speedDifference = momentumVelocity - AUTO_SPEED;
          const decay = Math.exp(-MOMENTUM_DECAY_RATE * dt);
          position += speedDifference * (1 - decay) / MOMENTUM_DECAY_RATE;
          const remainingSpeed = speedDifference * decay;
          momentumVelocity = Math.abs(remainingSpeed) <= MOMENTUM_STOP_THRESHOLD
            ? null
            : AUTO_SPEED + remainingSpeed;
        }
      }

      renderPosition();
      requestFrame();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!canAnimate() || gesture || !event.isPrimary || event.button !== 0 || loopDistance <= 0) return;

      cancelFrame();
      momentumVelocity = null;
      gesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastMoveTime: event.timeStamp,
        velocity: 0,
        isDragging: false,
      };
      requestFrame();
    };

    const recordDrag = (active: Gesture, event: PointerEvent) => {
      const delta = active.lastX - event.clientX;
      if (delta === 0) return;

      pendingDragDelta += delta;
      active.lastX = event.clientX;
      const elapsed = event.timeStamp - active.lastMoveTime;
      if (elapsed > 0) {
        active.velocity = elapsed <= VELOCITY_MAX_AGE_MS ? delta * 1000 / elapsed : 0;
        active.lastMoveTime = event.timeStamp;
      }
    };

    const endGesture = (release?: PointerEvent) => {
      if (!gesture) return;

      const active = gesture;
      gesture = null;
      previousTimestamp = null;
      momentumVelocity = null;

      if (release && active.isDragging) {
        recordDrag(active, release);
        const velocity = active.velocity;
        if (release.timeStamp - active.lastMoveTime <= VELOCITY_MAX_AGE_MS && Math.abs(velocity) >= MIN_FLING_SPEED) {
          const flingSpeed = Math.min(Math.abs(velocity) * FLING_SPEED_MULTIPLIER, MAX_FLING_SPEED);
          momentumVelocity = Math.sign(velocity) * flingSpeed;
        }
      }

      if (viewport.hasPointerCapture(active.pointerId)) {
        viewport.releasePointerCapture(active.pointerId);
      }
      requestFrame();
    };

    const pausePlayback = () => {
      cancelFrame();
      pendingDragDelta = 0;
      momentumVelocity = null;
      endGesture();
    };

    const syncPlayback = () => {
      if (canAnimate()) requestFrame();
      else pausePlayback();
    };

    const cancelDragForResize = () => {
      if (!gesture && pendingDragDelta === 0) return;

      pendingDragDelta = 0;
      momentumVelocity = null;
      endGesture();
    };

    const [firstGroup, secondGroup] = Array.from(gallery.children);
    const updateLoopDistance = () => {
      if (disposed) return;

      const width = viewport.getBoundingClientRect().width;
      const firstBounds = firstGroup?.getBoundingClientRect();
      const secondBounds = secondGroup?.getBoundingClientRect();
      const groupWidth = firstBounds?.width ?? 0;
      // Group bounds ignore card hover. Subtracting their origins includes the gap
      // between groups and cancels the track's shared translation.
      const stride = firstBounds && secondBounds ? secondBounds.left - firstBounds.left : 0;
      const availableStart = stride + groupWidth - width;
      const nextDistance = groupWidth > 0 && stride > 0 && availableStart >= 0 ? stride : 0;
      // Keep the middle copy as the loop origin when a full cycle still fits.
      const nextStart = Math.min(nextDistance, Math.max(0, availableStart));
      if (nextDistance === loopDistance && nextStart === loopStart && width === viewportWidth) return;

      const phase = loopDistance > 0 ? wrapPosition(position, loopDistance) / loopDistance : 0;
      cancelDragForResize();
      cancelFrame();
      loopDistance = nextDistance;
      loopStart = nextStart;
      viewportWidth = width;
      position = nextDistance > 0 ? wrapPosition(phase * nextDistance, nextDistance, nextStart) : 0;
      requestFrame();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const active = gesture;
      if (!active || event.pointerId !== active.pointerId) return;

      if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
        endGesture();
        return;
      }

      if (!active.isDragging) {
        const dx = Math.abs(event.clientX - active.startX);
        const dy = Math.abs(event.clientY - active.startY);
        if (Math.max(dx, dy) < DRAG_THRESHOLD_PX) return;
        if (dy >= dx) {
          endGesture();
          return;
        }

        active.isDragging = true;
        viewport.setPointerCapture(event.pointerId);
      }

      recordDrag(active, event);
      requestFrame();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId === gesture?.pointerId) endGesture(event);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId === gesture?.pointerId) endGesture();
    };

    const handleLostPointerCapture = (event: PointerEvent) => {
      // A touch may lose its implicit capture when we transfer it to the viewport.
      if (event.target !== viewport && viewport.hasPointerCapture(event.pointerId)) return;
      handlePointerCancel(event);
    };

    const handleBlur = () => endGesture();

    updateLoopDistance();
    renderPosition();
    const resizeObserver = new ResizeObserver(updateLoopDistance);
    resizeObserver.observe(viewport);
    if (firstGroup) resizeObserver.observe(firstGroup);

    const intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      if (!entry || disposed) return;

      // Start after entering a small band. Keep playing until leaving the viewport.
      inView = entry.isIntersecting && entry.intersectionRatio > 0
        && (inView || entry.intersectionRatio >= START_VISIBILITY_RATIO);
      syncPlayback();
    }, { threshold: [0, START_VISIBILITY_RATIO] });
    intersectionObserver.observe(viewport);

    updateInvitation.current = (isOpen) => {
      invitationOpen = isOpen;
      syncPlayback();
    };

    viewport.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerCancel, true);
    window.addEventListener("lostpointercapture", handleLostPointerCapture, true);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("resize", cancelDragForResize);
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      disposed = true;
      updateInvitation.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      viewport.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("pointerup", handlePointerUp, true);
      window.removeEventListener("pointercancel", handlePointerCancel, true);
      window.removeEventListener("lostpointercapture", handleLostPointerCapture, true);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", cancelDragForResize);
      pausePlayback();
    };
  }, [galleryRef]);

  useLayoutEffect(() => {
    updateInvitation.current?.(isInvitationOpen);
  }, [galleryRef, isInvitationOpen]);
}
