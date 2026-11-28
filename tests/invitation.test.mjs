import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const script = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount() {
  const states = [];
  const refs = [];
  const effects = [];
  const timers = new Map();
  const plays = [];
  const scrolls = [];
  let stateIndex, refIndex, effectIndex;
  let nextTimer = 0;
  let galleryMayPlay = false;
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const react = {
    useState(initial) {
      const i = stateIndex++;
      if (i === states.length) states.push(initial);
      return [states[i], update => { states[i] = update; }];
    },
    useRef(initial) {
      const i = refIndex++;
      return refs[i] ?? (refs[i] = { current: initial });
    },
    useEffect(callback, deps) {
      const i = effectIndex++;
      const prior = effects[i];
      if (prior?.deps.every((value, index) => Object.is(value, deps[index]))) return;
      prior?.cleanup?.();
      effects[i] = { deps, cleanup: callback() };
    },
  };
  const modules = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "@/hooks/useBackgroundMusic": {
      useBackgroundMusic: () => ({ playMusic: volume => { plays.push(volume); return new Promise(() => {}); } }),
    },
    "@/hooks/useGalleryAnimation": {
      useGalleryAnimation: (_, ready) => { galleryMayPlay = ready; },
    },
  };
  runInNewContext(script, {
    exports,
    require: path => modules[path] ?? { default: path },
    window: { scrollTo: options => scrolls.push(options.top) },
    setTimeout: (callback, delay) => {
      const id = ++nextTimer;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout: id => timers.delete(id),
  });
  return {
    render: () => {
      stateIndex = refIndex = effectIndex = 0;
      const root = exports.default();
      const overlay = root.props.children.find(child => child.type === "main").props.children
        .find(child => child.type === "@/components/InvitationOverlay");
      return { ...overlay.props, galleryMayPlay };
    },
    timers, plays, scrolls,
    runTimer: () => {
      const [[id, { callback }]] = [...timers];
      timers.delete(id);
      callback();
    },
    unmount: () => effects.forEach(({ cleanup }) => cleanup?.()),
  };
}

test("a pending play promise and duplicate invitation clicks leave a single opening timer", () => {
  const home = mount();
  const { openInvitation } = home.render();
  openInvitation();
  openInvitation();
  assert.deepEqual(home.plays, [0.15]);
  assert.deepEqual([...home.timers.values()].map(timer => timer.delay), [1200]);
  assert.equal(home.render().isOpening, true);
  assert.equal(home.render().galleryMayPlay, false);
  home.runTimer();
  const revealing = home.render();
  assert.equal(revealing.isOpened, true);
  assert.equal(revealing.galleryMayPlay, false);
  assert.deepEqual(home.scrolls, [0]);
  revealing.onRevealed();
  assert.equal(home.render().galleryMayPlay, true);
  assert.equal(home.timers.size, 0);
  home.unmount();
});

test("the invitation reveal fallback and both phases clean up their timers on unmount", () => {
  const duringOpening = mount();
  duringOpening.render().openInvitation();
  duringOpening.unmount();
  assert.equal(duringOpening.timers.size, 0);
  assert.deepEqual(duringOpening.scrolls, []);

  const duringFade = mount();
  duringFade.render().openInvitation();
  duringFade.runTimer();
  assert.equal(duringFade.render().galleryMayPlay, false);
  assert.deepEqual([...duringFade.timers.values()].map(timer => timer.delay), [1100]);
  duringFade.unmount();
  assert.equal(duringFade.timers.size, 0);

  const fallback = mount();
  fallback.render().openInvitation();
  fallback.runTimer();
  fallback.render();
  fallback.runTimer();
  assert.equal(fallback.render().galleryMayPlay, true);
  assert.equal(fallback.timers.size, 0);
  fallback.unmount();
});
