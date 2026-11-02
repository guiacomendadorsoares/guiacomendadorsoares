import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { buildJobSearchQuery, isRioVagasSource, canManageJobDiscovery, canPublishJob, candidateToJobDraft, emptyJobDraft } from "./jobs-discovery";
describe("job discovery rules", () => {
  test("search is restricted to RioVagas and rejects other sources", () => {
    assert.equal(buildJobSearchQuery("Comendador Soares", "vagas estágio", "administração"), 'site:riovagas.com.br "Nova Iguaçu" "Comendador Soares" vagas estágio administração');
    assert.equal(isRioVagasSource("https://riovagas.com.br/riovagas/vaga/"), true);
    assert.equal(isRioVagasSource("https://www.riovagas.com.br/vaga/"), true);
    for (const url of ["https://example.org/vaga", "https://riovagas.com.br.example.org/vaga", "https://example.org/?source=riovagas.com.br", "https://riovagas.com.br@example.org/vaga", "http://riovagas.com.br/vaga", "invalid"]) {
      assert.equal(isRioVagasSource(url), false, url);
    }
  });
  test("only admin can search, select and publish", () => {
    assert.equal(canManageJobDiscovery(["admin"]), true);
    for (const role of ["editor", "user", "partner", "broker"]) assert.equal(canManageJobDiscovery([role]), false);
  });
  test("selection preserves local category and source without authorizing publication", () => {
    const draft = candidateToJobDraft({title:"Estágio",url:"https://example.org/vaga",snippet:"Requisitos da fonte",source:"example.org"},"estagio","Comendador Soares, Nova Iguaçu");
    assert.equal(draft.type,"estagio"); assert.equal(draft.location,"Comendador Soares, Nova Iguaçu");
    assert.equal(draft.source_url,"https://example.org/vaga"); assert.equal(canPublishJob(draft),false);
    assert.equal("status" in draft,false);
  });
  test("publication requires review and a valid application contact", () => {
    const draft = {...emptyJobDraft(),title:"Atendente",company:"Empresa",description:"Requisitos"};
    assert.equal(canPublishJob(draft),false);
    assert.equal(canPublishJob({...draft,apply_url:"https://example.org/vaga"}),true);
  });
  test("expired vacancies cannot be published", () => {
    assert.equal(canPublishJob({...emptyJobDraft(),title:"Estágio",company:"Empresa",description:"Requisitos",apply_url:"https://example.org/vaga",expires_at:"2026-10-31T00:00:00.000Z"},Date.parse("2026-11-01T15:26:00Z")),false);
  });
});