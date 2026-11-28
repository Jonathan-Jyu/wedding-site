import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../hooks/useGalleryAnimation.ts", import.meta.url), "utf8");
const script = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function mount() {
  let height = 380;
  let period = 2400;
  let nextId = 0;
  let now = 0;
  let resizing, intersection, refIndex, effectIndex;
  let disconnected = 0;
  const frames = new Map();
  const refs = [];
  const effects = [];
  const document = Object.assign(new EventTarget(), { hidden: false });
  const window = new EventTarget();
  const viewport = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({ width: height }),
    hasPointerCapture: () => false,
    setPointerCapture() {},
  });
  const groups = [0, 1, 2].map(i => ({
    getBoundingClientRect: () => ({ left: i * period, width: period - 24 }),
  }));
  const galleryRef = { current: { parentElement: viewport, children: groups, style: {} } };
  const exports = {};
  const react = {
    useRef(initial) {
      const i = refIndex++;
      return refs[i] ?? (refs[i] = { current: initial });
    },
    useLayoutEffect(callback, deps) {
      const i = effectIndex++;
      if (effects[i]?.deps.every((prior, k) => Object.is(prior, deps[k]))) return;
      effects[i]?.cleanup?.();
      effects[i] = { deps, cleanup: callback() };
    },
  };
  runInNewContext(script, {
    exports, require: () => react, document, window,
    requestAnimationFrame: callback => { frames.set(++nextId, callback); return nextId; },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { constructor(fn) { resizing = fn; } observe() {} disconnect() { disconnected++; } },
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} disconnect() { disconnected++; } },
  });
  return {
    render: (open, reduced = false) => {
      refIndex = effectIndex = 0;
      exports.useGalleryAnimation(galleryRef, open, reduced);
    },
    see: visible => intersection([{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]),
    background: hidden => { document.hidden = hidden; document.dispatchEvent(new Event("visibilitychange")); },
    resize: (width, distance) => { height = width; period = distance; resizing(); },
    frame() {
      assert.ok(frames.size <= 1);
      now += 20;
      for (const [id, fn] of [...frames]) { frames.delete(id); fn(now); }
    },
    pointer(target, type, x, y = 0) {
      const event = new Event(type);
      Object.assign(event, {
        pointerId: 1, clientX: x, clientY: y, isPrimary: true, button: 0,
        buttons: 1, pointerType: "touch",
      });
      Object.defineProperty(event, "timeStamp", { value: now });
      (target === "viewport" ? viewport : window).dispatchEvent(event);
    },
    position: () => -Number(galleryRef.current.style.transform.match(/translate3d\(([-.\d]+)px/)[1]),
    frames,
    unmount: () => effects.forEach(({ cleanup }) => cleanup?.()),
    disconnected: () => disconnected,
  };
}

test("reduced motion survives resize, visibility and background; autoplay still honors each gate", () => {
  const g = mount();
  g.render(false);
  g.see(true);
  assert.equal(g.frames.size, 0);
  g.render(true);
  g.frame();
  g.frame();
  assert.ok(Math.abs(g.position() - 2400.6) < 1e-6);
  g.render(true, true);
  const paused = g.position();
  g.see(false);
  g.background(true);
  g.see(true);
  g.background(false);
  g.frame();
  assert.equal(g.position(), paused);
  assert.equal(g.frames.size, 0);
  g.resize(420, 3200);
  g.frame();
  const resized = g.position();
  assert.ok(Math.abs((paused - 2400) / 2400 - (resized - 3200) / 3200) < 1e-6);
  g.see(false);
  g.render(true);
  assert.equal(g.frames.size, 0);
  g.background(true);
  g.see(true);
  assert.equal(g.frames.size, 0);
  g.background(false);
  g.frame();
  g.frame();
  assert.ok(Math.abs(g.position() - resized - 0.6) < 1e-6);
  g.unmount();
  assert.equal(g.frames.size, 0);
  assert.equal(g.disconnected(), 2);
});

test("dragging in both directions works under reduced motion without autoplay or fling", () => {
  const g = mount();
  g.render(true, true);
  g.see(true);
  const initial = g.position();
  assert.equal(g.frames.size, 0);
  g.pointer("viewport", "pointerdown", 300);
  g.frame();
  g.pointer("window", "pointermove", 240);
  g.frame();
  g.pointer("window", "pointerup", 235);
  g.frame();
  assert.equal(g.position(), initial + 65);
  assert.equal(g.frames.size, 0);
  g.pointer("viewport", "pointerdown", 235);
  g.frame();
  g.pointer("window", "pointermove", 295);
  g.frame();
  g.pointer("window", "pointerup", 300);
  g.frame();
  assert.equal(g.position(), initial);
  assert.equal(g.frames.size, 0);
  g.unmount();
  g.pointer("viewport", "pointerdown", 300);
  g.pointer("window", "pointermove", 200);
  assert.equal(g.frames.size, 0);
});

test("normal dragging suspends autoplay, flings on release and settles back to 30 px/s", () => {
  const g = mount();
  g.render(true);
  g.see(true);
  g.pointer("viewport", "pointerdown", 300);
  g.frame();
  assert.equal(g.frames.size, 0);
  g.pointer("window", "pointermove", 240);
  g.frame();
  g.pointer("window", "pointerup", 240);
  g.frame();
  const released = g.position();
  g.frame();
  assert.ok(g.position() > released);
  for (let i = 0; i < 180; i++) g.frame();
  const settled = g.position();
  g.frame();
  const displacement = (g.position() - settled + 2400) % 2400;
  assert.ok(Math.abs(displacement - 0.6) < 1e-6);
  assert.equal(g.frames.size, 1);
  g.unmount();
  assert.equal(g.frames.size, 0);
});
