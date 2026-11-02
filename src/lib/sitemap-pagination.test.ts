import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readAllSitemapRows } from "./sitemap-pagination";

test("sitemap includes records beyond the first database page", async () => {
  const source = Array.from({ length: 1201 }, (_, i) => ({ id: String(i), updated_at: null }));
  const ranges: number[][] = [];
  const rows = await readAllSitemapRows(async (from, to) => {
    ranges.push([from, to]);
    return { data: source.slice(from, to + 1), error: null };
  });
  assert.equal(rows.length, 1201);
  assert.equal(rows[1200].id, "1200");
  assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]]);
});

test("sitemap does not silently return partial records after a query failure", async () => {
  await assert.rejects(readAllSitemapRows(async (from) => from === 0
    ? { data: Array.from({ length: 500 }, (_, i) => ({ id: String(i), updated_at: null })), error: null }
    : { data: null, error: { message: "Read failed" } }), /Read failed/);
});

test("sitemap accepts an empty public content table", async () => {
  assert.deepEqual(await readAllSitemapRows(async () => ({ data: [], error: null })), []);
});