import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../lib/timezone.ts", import.meta.url), "utf8");
const script = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const cases = [
  ["2026-11-26T01:02:03Z", "2026-11-26 09:02:03"],
  ["2026-01-31T15:59:59Z", "2026-01-31 23:59:59"],
  ["2026-01-31T16:00:00Z", "2026-02-01 00:00:00"],
  ["2026-12-31T15:59:59Z", "2026-12-31 23:59:59"],
  ["2026-12-31T16:00:00Z", "2027-01-01 00:00:00"],
  ["2028-02-28T16:00:00Z", "2028-02-29 00:00:00"],
  ["2026-03-07T18:30:00Z", "2026-03-08 02:30:00"],
];

for (const hostTimeZone of ["UTC", "Asia/Taipei", "America/New_York"]) {
  test(`Taipei timestamps in an isolated ${hostTimeZone} process`, () => {
    const output = execFileSync(process.execPath, [
      "--input-type=commonjs", "-e",
      `${script}
      const cases = ${JSON.stringify(cases)};
      console.log(JSON.stringify({
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offsets: [new Date(cases[0][0]).getTimezoneOffset(), new Date(cases[6][0]).getTimezoneOffset()],
        actual: cases.map(([instant]) => exports.getTimeInTaipei(new Date(instant)))
      }));`,
    ], { encoding: "utf8", env: { ...process.env, TZ: hostTimeZone } });
    const { timeZone, offsets, actual } = JSON.parse(output);
    assert.equal(timeZone, hostTimeZone);
    assert.deepEqual(offsets, { UTC: [0, 0], "Asia/Taipei": [-480, -480], "America/New_York": [300, 300] }[hostTimeZone]);
    assert.deepEqual(actual, cases.map(([, expected]) => expected));
  });
}
