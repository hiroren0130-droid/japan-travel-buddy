/** Run: node --import tsx --test tests/pdf-characterization.unit.ts
 * Characterizes renderer calls, not actual font metrics or PDF file fidelity.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import type { TravelPlan } from "../types/travel";
import { getAllSpots } from "../lib/spotService";
import { getLocalizedSpotName } from "../lib/localizedSpot";
import { createTravelPlanPdfFilename } from "../lib/travelPlanExport";

const require = createRequire(import.meta.url);
type Call = { method: string; args: unknown[] };
let calls: Call[] = [];
const record = (method: string, ...args: unknown[]) => { calls.push({ method, args }); };
class FakePdf {
  constructor() { record("new"); }
  setFontSize(size: number) { record("font", size); }
  text(...args: unknown[]) { record("text", ...args); }
  splitTextToSize(text: string, width: number) {
    record("wrap", text, width);
    // Deterministic test metrics: deliberately not an emulation of jsPDF fonts.
    return text.match(/.{1,60}/gu) ?? [""];
  }
  addPage() { record("page"); }
  addImage(...args: unknown[]) { record("image", ...args); }
  save(filename: string) { record("save", filename); }
}

// tsx's CJS loader reads this test-only cache substitution before loading pdf.ts.
// Restore it immediately so other imports cannot receive our fake constructor.
const jsPdfPath = require.resolve("jspdf");
const previousModule = require.cache[jsPdfPath];
const fakeModule = { id: jsPdfPath, filename: jsPdfPath, loaded: true, exports: FakePdf };
require.cache[jsPdfPath] = fakeModule as NodeModule;
let downloadTravelPlanPdf: typeof import("../lib/pdf").downloadTravelPlanPdf;
try {
  ({ downloadTravelPlanPdf } = require("../lib/pdf"));
} finally {
  if (previousModule) require.cache[jsPdfPath] = previousModule;
  else delete require.cache[jsPdfPath];
}

const spot = getAllSpots().find((item) => getLocalizedSpotName(item, "en") !== item.name);
assert.ok(spot, "Fixture needs a real Spot Database entry with an English translation");
const plan: TravelPlan = {
  title: "Kyoto: trip/one. ", summary: "SUMMARY_SENTINEL",
  startLocation: "START_LOCATION_SENTINEL", startTime: "START_TIME_SENTINEL",
  endLocation: "END_LOCATION_SENTINEL", endTime: "END_TIME_SENTINEL",
  days: [{ day: 1, items: [{ time: "09:15", spotId: spot.id, description: "DESCRIPTION_SENTINEL", transport: "徒歩", duration: "15 min" }] }],
};
const by = (method: string) => calls.filter((call) => call.method === method);
const drawn = () => calls.filter((call) => ["text", "draw"].includes(call.method)).map((call) => call.args[0]).join("");

let oldDocument: PropertyDescriptor | undefined;
test.beforeEach(() => {
  calls = [];
  oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const context = {
    font: "", fillStyle: "", textBaseline: "",
    fillRect: (...args: unknown[]) => record("clear", ...args),
    measureText: (text: string) => { record("measure", text); return { width: [...text].length * 12 }; },
    fillText: (...args: unknown[]) => record("draw", ...args),
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElement: (tag: string) => {
      assert.equal(tag, "canvas");
      record("canvas");
      return { width: 0, height: 0, getContext: (kind: string) => {
        assert.equal(kind, "2d"); return context;
      }, toDataURL: (type: string, quality: number) => {
        record("encode", type, quality); return "data:image/jpeg;base64,TEST";
      } };
    },
  } });
});
test.afterEach(() => {
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else Reflect.deleteProperty(globalThis, "document");
});

for (const locale of ["en", "ja"] as const) {
  test(`${locale}: current rendering path, localized real spot, content and filename`, () => {
    downloadTravelPlanPdf(plan, locale);
    assert.equal(by("new").length, 1);
    assert.deepEqual(by("save").map((call) => call.args), [["Kyoto- trip-one.pdf"]]);
    const text = drawn();
    for (const value of [plan.title, plan.summary, "09:15", "DESCRIPTION_SENTINEL", "15 min", getLocalizedSpotName(spot, locale)]) assert.ok(text.includes(value), value);
    assert.ok(text.includes(locale === "en" ? "Day 1" : "1日目"));
    if (locale === "en") {
      assert.ok(by("text").length > 0);
      assert.ok(by("wrap").length > 0);
      assert.equal(by("canvas").length, 0);
      assert.equal(by("image").length, 0);
    } else {
      assert.equal(by("canvas").length, 1);
      assert.equal(by("text").length, 0);
      assert.equal(by("wrap").length, 0);
      assert.equal(by("image").length, 1);
      assert.ok(calls.findIndex((c) => c.method === "draw") < calls.findIndex((c) => c.method === "image"));
      assert.deepEqual(by("encode")[0].args, ["image/jpeg", 0.92]);
      assert.deepEqual(by("image")[0].args.slice(1), ["JPEG", 0, 0, 210, 297]);
    }
    const labels = locale === "en" ? ["Start", "Start time", "End", "End time"] : ["出発", "出発時刻", "到着", "到着時刻"];
    const values = [plan.startLocation, plan.startTime, plan.endLocation, plan.endTime];
    let previousIndex = text.indexOf(locale === "en" ? "Day 1" : "1日目");
    values.forEach((value, index) => {
      const position = text.indexOf(`${labels[index]}: ${value}`);
      assert.ok(position > previousIndex);
      previousIndex = position;
    });
    assert.ok(previousIndex < text.indexOf("09:15"), "Boundary details precede itinerary items");
    assert.equal(calls.at(-1)?.method, "save");
  });

  test(`${locale}: multiple days and long descriptions wrap and paginate without losing final item`, () => {
    const large: TravelPlan = { ...plan, days: Array.from({ length: 3 }, (_, i) => ({ day: i + 1,
      items: Array.from({ length: 12 }, () => ({ ...plan.days[0].items[0], description: "long description ".repeat(60) + "END_DESCRIPTION" })),
    })) };
    assert.doesNotThrow(() => downloadTravelPlanPdf(large, locale));
    assert.ok(by("page").length > 0);
    assert.equal(by("save").length, 1);
    assert.ok(drawn().includes(locale === "en" ? "Day 3" : "3日目"));
    assert.equal(drawn().split("END_DESCRIPTION").length - 1, 36);
    for (const value of [plan.startLocation, plan.startTime, plan.endLocation, plan.endTime]) {
      assert.equal(drawn().split(value!).length - 1, 3, "Plan boundary is printed on each day");
    }
    assert.ok(by(locale === "en" ? "wrap" : "measure").length > 0);
    if (locale === "ja") assert.equal(by("image").length, by("page").length + 1);
  });

  test(`${locale}: blank title fallback filename and unknown spot fallback`, () => {
    downloadTravelPlanPdf({ ...plan, title: "  ", days: [{ day: 1, items: [{ ...plan.days[0].items[0], spotId: "__nonexistent_test_id__" }] }] }, locale);
    assert.deepEqual(by("save")[0].args, [locale === "en" ? "travel-plan.pdf" : "旅行プラン.pdf"]);
    assert.ok(drawn().includes(locale === "en" ? "Unknown spot" : "不明なスポット"));
  });

  test(`${locale}: partial boundary values omit blanks, undefined and runtime null`, () => {
    const partial = { ...plan, startLocation: "  Kyoto Station  ", startTime: null,
      endLocation: undefined, endTime: "  " } as unknown as TravelPlan;
    assert.doesNotThrow(() => downloadTravelPlanPdf(partial, locale));
    const text = drawn();
    assert.ok(text.includes(locale === "en" ? "Start: Kyoto Station" : "出発: Kyoto Station"));
    assert.doesNotMatch(text, /undefined|null|Start time:|End:|End time:|出発時刻:|到着:|到着時刻:/);
    assert.equal(by("save").length, 1);
  });

  test(`${locale}: entirely absent boundary fields keep generating the itinerary`, () => {
    for (const missing of [undefined, null, "", "   "]) {
      calls = [];
      const without = { ...plan, startLocation: missing, startTime: missing,
        endLocation: missing, endTime: missing } as unknown as TravelPlan;
      assert.doesNotThrow(() => downloadTravelPlanPdf(without, locale));
      assert.doesNotMatch(drawn(), /undefined|null|Start:|Start time:|End:|End time:|出発:|出発時刻:|到着:|到着時刻:/);
      assert.ok(drawn().includes("DESCRIPTION_SENTINEL"));
      assert.equal(by("save").length, 1);
    }
  });

  test(`${locale}: long boundary locations wrap and paginate using the existing renderer`, () => {
    const longLocation = "LOCATION ".repeat(600) + "LOCATION_END";
    assert.doesNotThrow(() => downloadTravelPlanPdf({ ...plan, startLocation: longLocation }, locale));
    assert.ok(by("page").length > 0);
    assert.ok(by(locale === "en" ? "wrap" : "measure").length > 0);
    assert.ok(drawn().includes("LOCATION_END"));
    assert.ok(drawn().includes("DESCRIPTION_SENTINEL"));
    assert.equal(by("save").length, 1);
  });
}

for (const duration of ["0分", "15分", "5分", "17分"]) {
  test(`en: renders ${duration} in minutes without changing the plan`, () => {
    const input: TravelPlan = { ...plan, days: [{ day: 1, items: [{ ...plan.days[0].items[0], duration }] }] };
    const original = structuredClone(input);
    downloadTravelPlanPdf(input, "en");
    assert.ok(drawn().includes(`${duration.slice(0, -1)} min`));
    assert.ok(!drawn().includes(duration));
    assert.deepEqual(input, original);
  });
}

for (const duration of ["15 min", "about 15 minutes", "1時間", "不明"]) {
  test(`en: preserves duration format ${duration}`, () => {
    downloadTravelPlanPdf({ ...plan, days: [{ day: 1, items: [{ ...plan.days[0].items[0], duration }] }] }, "en");
    assert.ok(drawn().includes(duration));
  });
}

test("ja: preserves Japanese duration when drawing on canvas", () => {
  downloadTravelPlanPdf({ ...plan, days: [{ day: 1, items: [{ ...plan.days[0].items[0], duration: "15分" }] }] }, "ja");
  assert.ok(drawn().includes("15分"));
  assert.ok(!drawn().includes("15 min"));
  assert.ok(by("draw").length > 0);
});

test("filename sanitization, trailing punctuation and 100-character limit remain unchanged", () => {
  assert.equal(createTravelPlanPdfFilename('  A<>:"/\\|?*B.  ', "en"), "A---------B.pdf");
  assert.equal(createTravelPlanPdfFilename("x".repeat(101), "ja"), "x".repeat(100) + ".pdf");
});
