import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import nextServer from "next/server.js";
import ts from "typescript";

function loadTypeScript(path, context = {}, imports = {}) {
  const filename = fileURLToPath(new URL(`../${path}`, import.meta.url));
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  runInNewContext(outputText, {
    ...context,
    exports,
    require(id) {
      assert.ok(Object.hasOwn(imports, id), `Unexpected test import: ${id}`);
      return imports[id];
    },
  }, { filename });
  return exports;
}

const errors = loadTypeScript("lib/rsvp-errors.ts", { SyntaxError });
const validation = loadTypeScript("lib/rsvp-validation.ts", {}, { "./rsvp-errors": errors });
const timestamp = "2026-11-23 09:02:03";
class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : ["2026-11-23T01:02:03Z"]));
  }
}
const timezone = loadTypeScript("lib/timezone.ts", { Date: FixedDate });

const valid = {
  name: "王・Test O’Neil",
  phone: "0912345678",
  attending: true,
  guests: 3,
  vegetarian: 2,
  children: 2,
  message: "  期待相聚！♡\r\n第二行 & <家宴>  ",
};

const mockEnv = {
  GOOGLE_PRIVATE_KEY: "test-private-key",
  GOOGLE_CLIENT_EMAIL: "rsvp-test@example.invalid",
  GOOGLE_SHEET_ID: "mock-sheet-id",
};

function makeRoute({ env = mockEnv, buildClient, append = () => ({ data: { updates: { updatedRows: 1 } } }) } = {}) {
  const appends = [];
  const appendOptions = [];
  const logs = [];
  let sheetClients = 0;
  const { POST } = loadTypeScript("app/api/rsvp/route.ts", {
    process: { env },
    console: { error: (...args) => logs.push(args) },
    performance,
  }, {
    "node:crypto": { randomUUID },
    "next/server": nextServer,
    "@/lib/timezone": timezone,
    "@/lib/rsvp-validation": validation,
    "@/lib/rsvp-errors": errors,
    googleapis: {
      google: {
        auth: { GoogleAuth: class {} },
        sheets() {
          sheetClients++;
          buildClient?.();
          return { spreadsheets: { values: {
            async append(params, options) {
              appends.push(structuredClone(params));
              appendOptions.push(structuredClone(options));
              return append();
            },
          } } };
        },
      },
    },
  });
  return {
    appends,
    appendOptions,
    logs,
    get sheetClients() { return sheetClients; },
    post(body, headers = {}) {
      const request = new nextServer.NextRequest("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body,
      });
      return POST(request);
    },
  };
}

const route = makeRoute();

async function assertRejected(body, expectedError, expectedCode = "RSVP_VALIDATION_ERROR") {
  const appendCount = route.appends.length;
  const clientCount = route.sheetClients;
  const response = await route.post(body);
  assert.equal(response.status, 400);
  const result = await response.json();
  assert.deepEqual(Object.keys(result).sort(), ["code", "error", "requestId", "success"]);
  assert.equal(result.success, false);
  assert.equal(result.code, expectedCode);
  assert.match(result.requestId, /^[\da-f-]{36}$/);
  assert.equal(typeof result.error, "string");
  assert.ok(result.error.length > 0);
  if (expectedError !== undefined) {
    assert.equal(result.error, expectedError);
  }
  assert.ok(!result.error.includes(valid.phone) && !result.error.includes(valid.name));
  assert.equal(route.sheetClients, clientCount);
  assert.equal(route.appends.length, appendCount);
}

async function assertWritten(payload, expectedRow) {
  const appendCount = route.appends.length;
  const response = await route.post(JSON.stringify(payload));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(route.appends.length, appendCount + 1);
  assert.deepEqual(route.appendOptions.at(-1), { retry: false, redirect: "error", timeout: 10_000 });
  assert.deepEqual(route.appends.at(-1), {
    spreadsheetId: "mock-sheet-id",
    range: "工作表1!A:H",
    valueInputOption: "RAW",
    requestBody: { values: [expectedRow] },
  });
}

test("attending writes exactly A:H, trims name/phone and preserves counts and multiline text", async () => {
  await assertWritten(
    { ...valid, name: ` ${valid.name} `, phone: ` ${valid.phone} ` },
    [timestamp, valid.name, "0912345678", "是", 3, 2, 2, valid.message],
  );
});

test("declining writes numeric zeros and an empty optional message", async () => {
  await assertWritten(
    { ...valid, attending: false, guests: 0, vegetarian: 0, children: 0, message: undefined },
    [timestamp, valid.name, valid.phone, "否", 0, 0, 0, ""],
  );
});

for (const guests of [1, 10]) {
  test(`attending accepts the ${guests} guest boundary`, async () => {
    await assertWritten(
      { ...valid, guests, vegetarian: guests, children: guests },
      [timestamp, valid.name, valid.phone, "是", guests, guests, guests, valid.message],
    );
  });
}

for (const phone of ["+886912345678", "+1 (415) 555-0123 ext. 42", "(02) 2345-6789 轉 123", "０９１２３４５６７８"]) {
  test(`preserves phone text: ${phone}`, async () => {
    await assertWritten({ ...valid, phone }, [timestamp, valid.name, phone, "是", 3, 2, 2, valid.message]);
  });
}

for (const text of ["=1+1", "+SUM(1,2)", "-1+2", "@SUM(A1:A2)", "2026-11-23"]) {
  test(`sends literal text with RAW: ${text}`, async () => {
    await assertWritten({ ...valid, name: text, message: text }, [timestamp, text, valid.phone, "是", 3, 2, 2, text]);
  });
}

test("accepts the name, phone and message length limits", async () => {
  const name = "名".repeat(100);
  const phone = "+1  2  3  4  5  6  7  8  9 x1234";
  const message = "文".repeat(2000);
  assert.equal(phone.length, 32);
  await assertWritten({ ...valid, name, phone, message }, [timestamp, name, phone, "是", 3, 2, 2, message]);
});

const invalidBodies = {
  "invalid JSON": "{",
  "empty body": "",
  "null payload": "null",
  "array payload": "[]",
  "string payload": '"test"',
  "number payload": "42",
  "boolean payload": "true",
  "non-JSON NaN": JSON.stringify(valid).replace('"guests":3', '"guests":NaN'),
  "overflow number": JSON.stringify(valid).replace('"guests":3', '"guests":1e999'),
};
for (const [label, body] of Object.entries(invalidBodies)) {
  const parseFails = ["invalid JSON", "empty body", "non-JSON NaN"].includes(label);
  test(`rejects ${label} before Sheets`, () =>
    assertRejected(body, undefined, parseFails ? "RSVP_INVALID_JSON" : "RSVP_VALIDATION_ERROR"));
}

const invalidFields = {
  "blank name": { name: " \t " },
  "numeric name": { name: 100 },
  "long name": { name: "王".repeat(101) },
  "blank phone": { phone: "" },
  "numeric phone": { phone: 912345678 },
  "non-phone characters": { phone: "0912abcdef" },
  "misplaced plus": { phone: "0912+345678" },
  "unbalanced phone parentheses": { phone: "(02 23456789" },
  "too few phone digits": { phone: "123456" },
  "too many phone digits": { phone: "+1234567890123456" },
  "long phone": { phone: `0912${" ".repeat(23)}345678` },
  "string attending": { attending: "false" },
  "null attending": { attending: null },
  "zero attending guests": { guests: 0 },
  "eleven guests": { guests: 11 },
  "negative guests": { guests: -1 },
  "fractional guests": { guests: 1.5 },
  "string guests": { guests: "3" },
  "declining with guests": { attending: false, guests: 1, vegetarian: 0, children: 0 },
  "null message": { message: null },
  "object message": { message: {} },
  "long message": { message: "文".repeat(2001) },
};
for (const [label, overrides] of Object.entries(invalidFields)) {
  test(`rejects ${label} before Sheets`, () => assertRejected(JSON.stringify({ ...valid, ...overrides })));
}

for (const [field, label] of [["vegetarian", "素食"], ["children", "兒童"]]) {
  const exceedsGuests = `${label}人數不能超過出席人數，請再確認一下喔！`;
  const invalidCount = `請填寫正確的${label}人數。`;

  test(`reports ${field} count above the guest count`, () =>
    assertRejected(JSON.stringify({ ...valid, [field]: 4 }), exceedsGuests));

  test(`reports a nonzero ${field} count when declining`, () =>
    assertRejected(
      JSON.stringify({ ...valid, attending: false, guests: 0, vegetarian: 0, children: 0, [field]: 1 }),
      exceedsGuests,
    ));

  for (const value of [-1, 1.5, "2"]) {
    test(`reports invalid ${field} count ${JSON.stringify(value)}`, () =>
      assertRejected(JSON.stringify({ ...valid, [field]: value }), invalidCount));
  }
}

for (const field of ["name", "phone", "attending", "guests", "vegetarian", "children"]) {
  test(`rejects missing ${field} before Sheets`, () => {
    const payload = { ...valid };
    delete payload[field];
    return assertRejected(JSON.stringify(payload));
  });
}

test("validator rejects runtime NaN without relying on JSON coercion", () => {
  const result = validation.validateRSVP({ ...valid, guests: NaN });
  assert.equal(result.success, false);
});

const secret = `${valid.name} ${valid.phone} ${valid.message} ${mockEnv.GOOGLE_PRIVATE_KEY} test-access-token raw-exception`;

async function assertServiceError(client, code, status, appendCount, upstreamStatus) {
  const response = await client.post(JSON.stringify(valid), {
    "x-request-id": "spoofed-request-id",
    Authorization: "Bearer test-access-token",
  });
  const body = await response.json();
  assert.equal(response.status, status);
  assert.deepEqual(body, {
    success: false, code, error: errors.RSVP_ERRORS[code].message, requestId: body.requestId,
  });
  assert.match(body.requestId, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
  assert.equal(client.appends.length, appendCount);
  assert.equal(client.logs.length, 1);
  const [log] = client.logs[0].map((entry) => structuredClone(entry));
  assert.equal(client.logs[0].length, 1);
  assert.deepEqual(log, {
    event: "rsvp_submission_failed", requestId: body.requestId, code,
    durationMs: log.durationMs, ...(upstreamStatus === undefined ? {} : { upstreamStatus }),
  });
  assert.ok(Number.isInteger(log.durationMs) && log.durationMs >= 0);
  const serialized = JSON.stringify({ body, log });
  for (const value of [valid.name, valid.phone, valid.message, mockEnv.GOOGLE_PRIVATE_KEY, "test-access-token", "raw-exception"]) {
    assert.ok(!serialized.includes(JSON.stringify(value).slice(1, -1)));
  }
}

test("missing Sheets configuration returns a safe 500 without creating a client", async () => {
  const client = makeRoute({ env: { ...mockEnv, GOOGLE_PRIVATE_KEY: " " } });
  await assertServiceError(client, "RSVP_CONFIGURATION_ERROR", 500, 0);
  assert.equal(client.sheetClients, 0);
});

test("client initialization exceptions are safe", () => assertServiceError(
  makeRoute({ buildClient() { throw new Error(secret); } }), "RSVP_CONFIGURATION_ERROR", 500, 0,
));

for (const [upstream, code, status] of [
  [400, "RSVP_SUBMISSION_FAILED", 502],
  [401, "RSVP_CONFIGURATION_ERROR", 500],
  [403, "RSVP_SUBMISSION_FAILED", 502],
  [408, "RSVP_SUBMISSION_UNCERTAIN", 502],
  [429, "RSVP_SUBMISSION_FAILED", 502],
  [500, "RSVP_SUBMISSION_UNCERTAIN", 502],
  [503, "RSVP_SUBMISSION_UNCERTAIN", 502],
]) {
  test(`maps upstream ${upstream} without echoing its response`, () => assertServiceError(
    makeRoute({ append() { throw Object.assign(new Error(secret), { response: { status: upstream, data: secret } }); } }),
    code, status, 1, upstream,
  ));
}

for (const [label, failure] of [
  ["timeout", Object.assign(new Error(secret), { code: "ETIMEDOUT" })],
  ["connection reset", Object.assign(new Error(secret), { code: "ECONNRESET" })],
  ["unknown error shape", { response: { status: secret } }],
  ["throwing status getter", { get response() { throw new Error(secret); } }],
  ["non-Error throw", secret],
]) {
  test(`${label} yields a safe uncertain response after one append`, () => assertServiceError(
    makeRoute({ append() { throw failure; } }), "RSVP_SUBMISSION_UNCERTAIN", 502, 1,
  ));
}

for (const updatedRows of [undefined, 0, 2]) {
  test(`does not retry when updatedRows is ${updatedRows}`, () => assertServiceError(
    makeRoute({ append: () => ({ data: { updates: { updatedRows } } }) }),
    "RSVP_SUBMISSION_UNCERTAIN", 502, 1,
  ));
}

test("request IDs are distinct and never taken from request headers", async () => {
  const headers = { "x-request-id": "client-id" };
  const ids = [];
  for (const payload of ["{", "{}"]) {
    const response = await route.post(payload, headers);
    ids.push((await response.json()).requestId);
  }
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) assert.notEqual(id, headers["x-request-id"]);
});

const id = "abcdf123-aaaa-4aaa-8aaa-bbbbbbbbbbbb";
const known = { success: false, code: "RSVP_VALIDATION_ERROR", error: valid.name, requestId: id };
for (const [label, response, match, uncertain] of [
  ["HTML 503", () => new Response("<html>proxy</html>", { status: 503 }), /非預期/, true],
  ["JSON schema mismatch", () => Response.json({ status: "ok" }), /非預期/, true],
  ["arbitrary HTTP 200", () => Response.json({ success: true, error: "extra" }), /非預期/, true],
  ["wrong status despite success", () => Response.json({ success: true }, { status: 500 }), /非預期/, true],
  ["unknown error code", () => Response.json({ ...known, code: "OTHER" }, { status: 400 }), /非預期/, true],
  ["invalid request ID schema", () => Response.json({ ...known, requestId: "fake" }, { status: 400 }), /非預期/, true],
  ["known code with unsafe text", () => Response.json(known, { status: 400 }), /確認填寫/, false],
  ["known validation message", () => Response.json({ ...known, error: errors.RSVP_VALIDATION_MESSAGES.childrenLimit }, { status: 400 }), /兒童人數不能超過/, false],
  ["upstream or other definitive 5xx", () => Response.json({ ...known, code: "RSVP_CONFIGURATION_ERROR" }, { status: 500 }), /無法送出回覆/, false],
  ["explicit uncertain response", () => Response.json({ ...known, code: "RSVP_SUBMISSION_UNCERTAIN" }, { status: 502 }), /無法確認/, true],
  ["connection interruption while reading", () => ({ json() { throw new TypeError(secret); } }), /連線中斷/, true],
]) {
  test(`client classifies ${label}`, async () => {
    const result = await errors.readRSVPResponse(response());
    assert.equal(result.success, false);
    assert.match(result.error, match);
    assert.ok(!result.error.includes(valid.name) && !result.error.includes("proxy"));
    assert.equal(result.uncertain, uncertain);
  });
}

test("client accepts HTTP 200 only with the established success contract", async () => {
  assert.equal((await errors.readRSVPResponse(Response.json({ success: true }))).success, true);
});
