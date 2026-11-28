import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../hooks/useCountdown.ts", import.meta.url), "utf8");
const script = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const weddingTime = Date.parse("2027-01-17T15:30:00+08:00");

function mount(remainingMs) {
  let now = weddingTime - remainingMs;
  let nextId = 0;
  let latest;
  let effect;
  const timers = new Map();
  const document = Object.assign(new EventTarget(), { hidden: false });
  const window = new EventTarget();
  const exports = {};
  const react = {
    useState: initial => [initial, value => { latest = { ...value }; }],
    useEffect: callback => { effect = callback; },
  };
  runInNewContext(script, {
    exports, require: () => react, window, document,
    Date: { parse: Date.parse, now: () => now },
    setTimeout: (callback, delay) => {
      const id = ++nextId;
      timers.set(id, { callback, time: now + delay });
      return id;
    },
    clearTimeout: id => timers.delete(id),
  });
  const initial = exports.useCountdown();
  const unmount = effect();
  return {
    initial, timers, unmount, document, window,
    read: () => latest,
    advance: ms => {
      now += ms;
      for (const [id, { callback, time }] of [...timers]) {
        if (time <= now) {
          timers.delete(id);
          callback();
        }
      }
    },
  };
}

for (const [remaining, expected] of [
  [90061000, [1, 1, 1, 1]],
  [86400000, [1, 0, 0, 0]],
  [86399000, [0, 23, 59, 59]],
  [3600000, [0, 1, 0, 0]],
  [3599000, [0, 0, 59, 59]],
  [60000, [0, 0, 1, 0]],
  [59000, [0, 0, 0, 59]],
  [1, [0, 0, 0, 1]],
  [0, [0, 0, 0, 0]],
  [-1000, [0, 0, 0, 0]],
]) {
  test(`countdown at ${remaining} ms from the wedding`, () => {
    const clock = mount(remaining);
    assert.equal(clock.initial, null);
    clock.advance(0);
    assert.deepEqual(Object.values(clock.read()), expected);
    assert.equal(clock.timers.size, remaining > 0 ? 1 : 0);
    clock.unmount();
  });
}

test("delayed ticks synchronize against the clock and stop exactly at zero", () => {
  const clock = mount(4300);
  clock.advance(0);
  assert.equal(clock.read().seconds, 5);
  clock.advance(3700);
  assert.equal(clock.read().seconds, 1);
  clock.advance(600);
  assert.equal(clock.read().seconds, 0);
  assert.equal(clock.timers.size, 0);
  clock.unmount();
});

test("visibility and pageshow resync, and unmount removes timers and listeners", () => {
  const clock = mount(10000);
  clock.advance(0);
  clock.document.hidden = true;
  clock.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(clock.timers.size, 0);
  clock.advance(8500);
  assert.equal(clock.read().seconds, 10);
  clock.document.hidden = false;
  clock.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(clock.read().seconds, 2);
  clock.window.dispatchEvent(new Event("pageshow"));
  assert.equal(clock.timers.size, 1);
  clock.unmount();
  clock.advance(500);
  clock.document.dispatchEvent(new Event("visibilitychange"));
  clock.window.dispatchEvent(new Event("pageshow"));
  assert.equal(clock.read().seconds, 2);
  assert.equal(clock.timers.size, 0);
});
