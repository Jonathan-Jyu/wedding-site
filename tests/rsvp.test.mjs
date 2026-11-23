import assert from "node:assert/strict";
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

const validation = loadTypeScript("lib/rsvp-validation.ts");
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

function makeRoute() {
  const appends = [];
  let sheetClients = 0;
  const { POST } = loadTypeScript("app/api/rsvp/route.ts", {
    process: {
      env: {
        GOOGLE_PRIVATE_KEY: "fake-key",
        GOOGLE_CLIENT_EMAIL: "rsvp-test@example.invalid",
        GOOGLE_SHEET_ID: "mock-sheet-id",
      },
    },
  }, {
    "next/server": nextServer,
    "@/lib/timezone": timezone,
    "@/lib/rsvp-validation": validation,
    googleapis: {
      google: {
        auth: { GoogleAuth: class {} },
        sheets() {
          sheetClients++;
          return { spreadsheets: { values: {
            async append(options) { appends.push(structuredClone(options)); },
          } } };
        },
      },
    },
  });
  return {
    appends,
    get sheetClients() { return sheetClients; },
    post(body) {
      const request = new nextServer.NextRequest("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      return POST(request);
    },
  };
}

const route = makeRoute();

async function assertRejected(body) {
  const appendCount = route.appends.length;
  const clientCount = route.sheetClients;
  const response = await route.post(body);
  assert.equal(response.status, 400);
  const result = await response.json();
  assert.deepEqual(Object.keys(result).sort(), ["error", "success"]);
  assert.equal(result.success, false);
  assert.equal(typeof result.error, "string");
  assert.ok(result.error.length > 0);
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
  test(`rejects ${label} before Sheets`, () => assertRejected(body));
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
  "vegetarian count over guests": { vegetarian: 4 },
  "children count over guests": { children: 4 },
  "negative vegetarian count": { vegetarian: -1 },
  "fractional children count": { children: 1.5 },
  "declining with guests": { attending: false, guests: 1, vegetarian: 0, children: 0 },
  "declining with vegetarian count": { attending: false, guests: 0, vegetarian: 1, children: 0 },
  "declining with children count": { attending: false, guests: 0, vegetarian: 0, children: 1 },
  "null message": { message: null },
  "object message": { message: {} },
  "long message": { message: "文".repeat(2001) },
};
for (const [label, overrides] of Object.entries(invalidFields)) {
  test(`rejects ${label} before Sheets`, () => assertRejected(JSON.stringify({ ...valid, ...overrides })));
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
