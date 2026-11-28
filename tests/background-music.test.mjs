import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../hooks/useBackgroundMusic.ts", import.meta.url), "utf8");
const script = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function mount() {
  let playing = false;
  let effect;
  const attempts = [];
  const operations = [];
  const document = new EventTarget();
  const window = new EventTarget();
  const audio = Object.assign(new EventTarget(), {
    paused: true,
    ended: false,
    error: null,
    volume: 1,
    muted: true,
    currentTime: 0,
    load() {
      operations.push("load");
      audio.error = null;
      audio.currentTime = 0;
    },
    play() {
      operations.push("play");
      return new Promise((resolve, reject) => attempts.push({ resolve, reject }));
    },
    pause() {
      audio.paused = true;
      audio.dispatchEvent(new Event("pause"));
    },
  });
  function startPlaying() {
    audio.paused = false;
    audio.dispatchEvent(new Event("playing"));
  }
  const exports = {};
  const react = {
    useRef: initial => ({ current: initial }),
    useState: initial => [initial, value => { playing = value; }],
    useEffect: callback => { effect = callback; },
  };
  runInNewContext(script, { exports, require: () => react, window, document });
  const controls = exports.useBackgroundMusic();
  controls.audioRef.current = audio;
  const unmount = effect();
  function failMedia() {
    audio.error = { code: 4 };
    audio.dispatchEvent(new Event("error"));
  }
  return { ...controls, attempts, operations, audio, startPlaying, failMedia, unmount, document, window, playing: () => playing };
}

test("one invitation gesture starts one play attempt and the media event drives the button", async () => {
  const music = mount();
  music.playMusic(0.15);
  music.playMusic(0.15);
  assert.equal(music.attempts.length, 1);
  assert.equal(music.audio.volume, 0.15);
  assert.equal(music.audio.muted, false);
  music.attempts[0].resolve();
  await Promise.resolve();
  assert.equal(music.playing(), false);
  music.startPlaying();
  assert.equal(music.playing(), true);
  music.toggleMusic();
  assert.equal(music.playing(), false);
  music.document.dispatchEvent(new Event("click"));
  assert.equal(music.attempts.length, 1);
  music.unmount();
});

test("pending playback can be paused and stale rejection cannot pause a newer attempt", async () => {
  const music = mount();
  music.playMusic(0.15);
  music.toggleMusic();
  music.toggleMusic();
  assert.equal(music.attempts.length, 2);
  assert.equal(music.audio.volume, 0.2);
  music.startPlaying();
  music.attempts[0].reject(new Error("stale"));
  await Promise.resolve();
  assert.equal(music.playing(), true);
  assert.equal(music.audio.paused, false);
  music.attempts[1].resolve();
  await Promise.resolve();
  music.unmount();
});

test("resolving a stale play promise after pausing cannot mark the music as playing", async () => {
  const music = mount();
  music.toggleMusic();
  music.toggleMusic();
  music.attempts[0].resolve();
  await Promise.resolve();
  assert.equal(music.playing(), false);
  assert.equal(music.audio.paused, true);
  music.toggleMusic();
  assert.equal(music.attempts.length, 2);
  assert.deepEqual(music.operations, ["play", "play"]);
  music.unmount();
});

test("only a manual play reloads a failed resource, then plays in the same gesture", async () => {
  const music = mount();
  music.failMedia();
  music.playMusic(0.15);
  assert.deepEqual(music.operations, ["play"]);
  music.attempts[0].reject(new Error("source unavailable"));
  await Promise.resolve();
  music.toggleMusic();
  assert.deepEqual(music.operations, ["play", "load", "play"]);
  assert.equal(music.audio.error, null);
  music.startPlaying();
  music.attempts[1].resolve();
  await Promise.resolve();
  assert.equal(music.audio.paused, false);
  assert.equal(music.playing(), true);
  music.unmount();
});

test("a failed reload stays paused and a later manual attempt can recover", async () => {
  const music = mount();
  music.failMedia();
  music.toggleMusic();
  music.failMedia();
  music.attempts[0].reject(new Error("still offline"));
  await Promise.resolve();
  assert.equal(music.audio.paused, true);
  assert.equal(music.playing(), false);
  assert.deepEqual(music.operations, ["load", "play"]);
  music.toggleMusic();
  music.startPlaying();
  music.attempts[1].resolve();
  await Promise.resolve();
  assert.deepEqual(music.operations, ["load", "play", "load", "play"]);
  assert.equal(music.audio.paused, false);
  assert.equal(music.playing(), true);
  music.unmount();
});

test("resuming a normally paused track does not reset playback progress", async () => {
  const music = mount();
  music.playMusic(0.15);
  music.startPlaying();
  music.attempts[0].resolve();
  await Promise.resolve();
  music.audio.currentTime = 12;
  music.toggleMusic();
  music.toggleMusic();
  assert.deepEqual(music.operations, ["play", "play"]);
  assert.equal(music.audio.currentTime, 12);
  music.unmount();
});

test("rapid toggles during recovery honor pause and ignore errors and rejections from the old attempt", async () => {
  const music = mount();
  music.toggleMusic();
  music.failMedia();
  const load = music.audio.load;
  music.audio.load = () => {
    load();
    music.attempts[0].reject(new Error("aborted by load"));
  };
  music.toggleMusic();
  music.audio.dispatchEvent(new Event("error"));
  music.toggleMusic();
  assert.equal(music.audio.paused, true);
  assert.equal(music.playing(), false);
  assert.deepEqual(music.operations, ["play", "load", "play"]);

  music.toggleMusic();
  music.startPlaying();
  music.attempts[1].reject(new Error("aborted by pause"));
  music.attempts[2].resolve();
  await Promise.resolve();
  assert.deepEqual(music.operations, ["play", "load", "play", "play"]);
  assert.equal(music.audio.paused, false);
  assert.equal(music.playing(), true);
  music.unmount();
});

test("blocked or synchronously failed playback can be retried manually", async () => {
  const music = mount();
  const original = music.audio.play;
  music.audio.play = () => { throw new Error("not available"); };
  assert.doesNotThrow(() => music.playMusic(0.15));
  music.audio.play = original;
  music.toggleMusic();
  music.attempts[0].reject(new Error("autoplay rejected"));
  await Promise.resolve();
  assert.equal(music.playing(), false);
  music.toggleMusic();
  assert.equal(music.attempts.length, 2);
  assert.deepEqual(music.operations, ["play", "play"]);
  music.unmount();
});

test("visibility, pageshow, ended and error synchronize against media state", () => {
  const music = mount();
  music.playMusic(0.15);
  music.startPlaying();
  music.audio.paused = true;
  music.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(music.playing(), false);
  music.audio.paused = false;
  music.window.dispatchEvent(new Event("pageshow"));
  assert.equal(music.playing(), true);
  music.audio.ended = true;
  music.audio.dispatchEvent(new Event("ended"));
  assert.equal(music.playing(), false);
  music.audio.ended = false;
  music.startPlaying();
  music.audio.error = {};
  music.audio.dispatchEvent(new Event("error"));
  assert.equal(music.playing(), false);
  assert.equal(music.audio.paused, true);
  music.unmount();
});

test("unmount pauses the element and removes event handlers and pending results", async () => {
  const music = mount();
  music.playMusic(0.15);
  music.unmount();
  music.audio.paused = false;
  music.attempts[0].reject(new Error("late"));
  await Promise.resolve();
  music.audio.dispatchEvent(new Event("play"));
  music.document.dispatchEvent(new Event("visibilitychange"));
  music.window.dispatchEvent(new Event("pageshow"));
  assert.equal(music.playing(), false);
  assert.equal(music.audio.paused, false);
});
