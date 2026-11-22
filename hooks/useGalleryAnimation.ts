import { useLayoutEffect } from "react";

const AUTO_SPEED = 120; // 2px per frame at 60Hz, expressed in px/s.
const MAX_FRAME_GAP_MS = 250;
const MAX_FRAME_STEP_MS = 1000 / 30;
const DRAG_THRESHOLD_PX = 8;
const VELOCITY_MAX_AGE_MS = 80;
const MIN_FLING_SPEED = 100;
const MAX_FLING_SPEED = 1800;
const FLING_SPEED_MULTIPLIER = 3;
const MOMENTUM_DECAY_RATE = -Math.log(0.95) * 60;
const MOMENTUM_STOP_THRESHOLD = 6;

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastMoveTime: number;
  velocity: number;
  isDragging: boolean;
};

function normalizePosition(position: number, distance: number) {
  if (distance <= 0) return position;
  return distance + (((position - distance) % distance) + distance) % distance;
}

export function useGalleryAnimation(galleryRef: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const gallery = galleryRef.current;
    const viewport = gallery?.parentElement;
    if (!gallery || !viewport) return;

    let position = 0;
    let renderedPosition = 0;
    let loopDistance = 0;
    let gesture: Gesture | null = null;
    let pendingDragDelta = 0;
    let momentumVelocity: number | null = null;
    let previousTimestamp: number | null = null;
    let animationFrameId: number;

    const renderPosition = () => {
      position = normalizePosition(position, loopDistance);
      if (position === renderedPosition) return;

      gallery.style.transform = `translate3d(${-position}px, 0, 0)`;
      renderedPosition = position;
    };

    const updateLoopDistance = () => {
      const children = gallery.children;
      if (children.length === 0) return;

      const firstSetStart = children[0];
      const secondSetStart = children[children.length / 3];
      const nextDistance = secondSetStart.getBoundingClientRect().left - firstSetStart.getBoundingClientRect().left;
      if (nextDistance <= 0) return;

      if (loopDistance > 0) {
        const progress = (position - loopDistance) / loopDistance;
        position = nextDistance + progress * nextDistance;
      } else {
        position = nextDistance;
      }
      loopDistance = nextDistance;
    };

    const animate = (timestamp: number) => {
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
      animationFrameId = requestAnimationFrame(animate);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (gesture || !event.isPrimary || event.button !== 0 || loopDistance <= 0) return;

      previousTimestamp = null;
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
    resizeObserver.observe(gallery);
    animationFrameId = requestAnimationFrame(animate);

    viewport.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerCancel, true);
    window.addEventListener("lostpointercapture", handleLostPointerCapture, true);
    window.addEventListener("blur", handleBlur);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      viewport.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("pointerup", handlePointerUp, true);
      window.removeEventListener("pointercancel", handlePointerCancel, true);
      window.removeEventListener("lostpointercapture", handleLostPointerCapture, true);
      window.removeEventListener("blur", handleBlur);
      endGesture();
    };
  }, [galleryRef]);
}
