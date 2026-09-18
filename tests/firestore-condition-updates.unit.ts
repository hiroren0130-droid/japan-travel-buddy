import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const deleted = Symbol("deleteField");
const writes: Array<{ ref: unknown; data: Record<string, unknown> }> = [];
const replacements = new Map([
  [require.resolve("firebase/firestore"), {
    doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
    deleteField: () => deleted,
    updateDoc: async (ref: unknown, data: Record<string, unknown>) => { writes.push({ ref, data }); },
  }],
  [require.resolve("../lib/firebase"), { db: {} }],
]);
const originals = new Map([...replacements.keys()].map((path) => [path, require.cache[path]]));
let updateTravelPlanDetails: typeof import("../lib/firestore").updateTravelPlanDetails;
try {
  for (const [path, exports] of replacements) {
    require.cache[path] = { id: path, filename: path, loaded: true, exports } as NodeModule;
  }
  ({ updateTravelPlanDetails } = require("../lib/firestore"));
} finally {
  for (const [path, original] of originals) {
    if (original) require.cache[path] = original;
    else delete require.cache[path];
  }
}

test.beforeEach(() => { writes.length = 0; });
const base = { title: "Changed", summary: "Summary" };

test("production updater omits untouched fields from the SDK payload", async () => {
  await updateTravelPlanDetails("plan-id", { ...base, startTime: undefined });
  assert.deepEqual(writes, [{ ref: "travelPlans/plan-id", data: base }]);
});

test("production updater uses deleteField only for explicitly cleared fields", async () => {
  await updateTravelPlanDetails("plan-id", { ...base, startLocation: "", endTime: "17:30" });
  assert.deepEqual(writes, [{ ref: "travelPlans/plan-id", data: {
    ...base, startLocation: deleted, endTime: "17:30",
  } }]);
});

test("production updater rejects invalid time before any SDK write", async () => {
  await assert.rejects(updateTravelPlanDetails("plan-id", { ...base, startLocation: "", startTime: "24:00" }), /HH:mm/);
  assert.equal(writes.length, 0);
});
