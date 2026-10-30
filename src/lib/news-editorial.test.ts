import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { canPublishNews, isPublicNews, candidateToDraft } from "./news-editorial";
describe("news editorial rules", () => {
  test("only an administrator can publish news", () => {
    assert.equal(canPublishNews(["admin"]), true);
    for (const role of ["editor", "user", "partner", "broker"]) assert.equal(canPublishNews([role]), false);
  });
  test("news requires approval and publication before appearing on Home", () => {
    assert.equal(isPublicNews({ published: false, status: "draft" }), false);
    assert.equal(isPublicNews({ published: true, status: "pending" }), false);
    assert.equal(isPublicNews({ published: true, status: "approved" }), true);
  });
  test("preparing a search result preserves the source without inventing an article", () => {
    const draft = candidateToDraft({ title: "Notícia local", snippet: "Fato informado pela fonte", url: "https://example.org/noticia", date: "2026-10-30", source: "example.org" });
    assert.equal(draft.source_url, "https://example.org/noticia");
    assert.equal(draft.content, "");
    assert.equal("published" in draft, false);
  });
});