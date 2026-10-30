import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Pencil, Check, ExternalLink, Loader2, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SingleImageUploader } from "@/components/image-uploader";
import { NEWS_FILTERS } from "@/lib/news";
import { candidateToDraft, type EditorialDraft, type NewsCandidate } from "@/lib/news-editorial";
import { searchLocalNews, listEditorialNews, saveEditorialDraft, publishEditorialNews } from "@/lib/news-editorial.functions";

export function NewsEditorial() {
  const search = useServerFn(searchLocalNews);
  const list = useServerFn(listEditorialNews);
  const save = useServerFn(saveEditorialDraft);
  const publish = useServerFn(publishEditorialNews);
  const qc = useQueryClient();
  const [location, setLocation] = useState<"Comendador Soares" | "Nova Iguaçu">("Comendador Soares");
  const [period, setPeriod] = useState<"qdr:d" | "qdr:w" | "qdr:m" | "all">("qdr:w");
  const [terms, setTerms] = useState("");
  const [results, setResults] = useState<NewsCandidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [usage, setUsage] = useState(0);
  const [draft, setDraft] = useState<EditorialDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["editorial-news"], queryFn: () => list(), retry: false });
  const selectClass = "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground";

  async function runSearch(e: React.FormEvent) {
    e.preventDefault(); setSearching(true); setSearchError(null); setResults([]);
    try { const response = await search({ data: { location, terms, period } }); setResults(response.results); setSearchError(response.error); setUsage(response.creditsUsed); setSearched(true); }
    catch (e) { setSearchError(e instanceof Error ? e.message : "Não foi possível buscar."); }
    finally { setSearching(false); }
  }
  async function submit(shouldPublish: boolean) {
    if (!draft) return;
    setBusy(true);
    try {
      const saved = await save({ data: draft });
      setDraft({ ...draft, id: saved.id });
      if (shouldPublish) await publish({ data: { id: saved.id } });
      await Promise.all([qc.invalidateQueries({ queryKey: ["editorial-news"] }), qc.invalidateQueries({ queryKey: ["home-items", "news"] }), qc.invalidateQueries({ queryKey: ["news"] })]);
      toast.success(shouldPublish ? "Notícia aprovada e publicada na Home e em Notícias." : "Rascunho salvo, sem publicação.");
      setDraft(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); void qc.invalidateQueries({ queryKey: ["editorial-news"] }); }
    finally { setBusy(false); }
  }
  function prepare(candidate?: NewsCandidate) {
    setPreview(false); setUploading(false);
    setDraft(candidate ? candidateToDraft(candidate) : { title: "", summary: "", content: "", category: "bairro", cover_url: null, source_url: null, source_name: null, source_date: null });
  }
  return <div className="space-y-8">
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-bold">Notícias locais</h1><Button onClick={() => prepare()}><Plus className="h-4 w-4" /> Nova notícia</Button></div>
      <form onSubmit={runSearch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr_auto]">
        <div className="space-y-1"><Label htmlFor="news-location">Local</Label><select id="news-location" className={`${selectClass} w-full`} value={location} onChange={e => setLocation(e.target.value as typeof location)}><option>Comendador Soares</option><option>Nova Iguaçu</option></select></div>
        <div className="space-y-1"><Label htmlFor="news-period">Período</Label><select id="news-period" className={`${selectClass} w-full`} value={period} onChange={e => setPeriod(e.target.value as typeof period)}><option value="qdr:d">Últimas 24 horas</option><option value="qdr:w">Última semana</option><option value="qdr:m">Último mês</option><option value="all">Qualquer data</option></select></div>
        <div className="space-y-1"><Label htmlFor="news-terms">Assunto</Label><Input id="news-terms" placeholder="Ex.: saúde, obras, transporte" maxLength={120} value={terms} onChange={e => setTerms(e.target.value)} /></div>
        <Button className="self-end" type="submit" disabled={searching}>{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{searching ? "Buscando…" : "Buscar notícias"}</Button>
      </form>
      {searchError && <p role="alert" className="break-words text-sm text-destructive">{searchError}</p>}
      {searched && !searchError && <p role="status" className="text-xs text-muted-foreground">{results.length} resultados · Uso: {usage} créditos Firecrawl (≈ {(usage * 0.004).toLocaleString("pt-BR")} créditos Lovable; metade no plano Business).</p>}
      {searched && !searchError && !results.length && <p className="text-sm text-muted-foreground">Nenhuma notícia encontrada neste período.</p>}
      <div className="grid gap-3 md:grid-cols-2">{results.map(item => {
        const existing = rows.some(row => row.source_url === item.url);
        return <article key={item.url} className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <p className="break-words text-xs text-muted-foreground">{item.source} · {item.date || "Data não informada"}</p><h2 className="font-semibold">{item.title}</h2><p className="text-sm text-muted-foreground">{item.snippet}</p>
          <div className="mt-auto flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><a href={item.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Fonte original</a></Button><Button size="sm" disabled={existing} onClick={() => prepare(item)}><Pencil className="h-4 w-4" />{existing ? "Já preparada" : "Preparar notícia"}</Button></div>
        </article>;
      })}</div>
    </section>
    <section className="space-y-3 border-t border-border pt-6"><h2 className="font-display text-xl font-bold">Redação do Guia</h2>
      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}{error && <p role="alert" className="text-destructive">{error.message}</p>}
      {!isLoading && !error && !rows.length && <p className="text-muted-foreground">Nenhuma notícia cadastrada.</p>}
      {rows.map(row => <div key={row.id} className="flex items-center justify-between gap-3 border-b border-border py-3"><div className="min-w-0"><p className="font-semibold break-words">{row.title}</p><p className="text-xs text-muted-foreground">{row.published && row.status === "approved" ? "Publicada" : "Rascunho · aguardando revisão"}</p></div><Button variant="outline" size="sm" aria-label={`Editar ${row.title}`} onClick={() => { setPreview(false); setDraft({ id: row.id, title: row.title, summary: row.summary ?? "", content: row.content ?? "", category: row.category, cover_url: row.cover_url, source_url: row.source_url, source_name: row.source_name, source_date: row.source_date }); }}><Pencil className="h-4 w-4" /></Button></div>)}
    </section>
    <Dialog open={!!draft} onOpenChange={open => { if (!open && !busy && !uploading) setDraft(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Redação · Guia Comendador Soares</DialogTitle></DialogHeader>
      {draft && <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}><Eye className="h-4 w-4" />{preview ? "Editar" : "Prévia"}</Button>
        {preview ? <article className="space-y-4">{draft.cover_url && <img src={draft.cover_url} alt={draft.title} className="aspect-video w-full rounded-lg object-cover" />}<p className="text-xs font-semibold text-primary">Guia Comendador Soares</p><h2 className="font-display text-2xl font-bold">{draft.title}</h2><p className="text-muted-foreground">{draft.summary}</p><div className="whitespace-pre-wrap">{draft.content}</div>{draft.source_url && <a className="text-sm text-primary underline" href={draft.source_url} target="_blank" rel="noopener noreferrer">Fonte: {draft.source_name}</a>}</article> : <>
          <div className="space-y-1"><Label htmlFor="editor-title">Título</Label><Input id="editor-title" value={draft.title} maxLength={200} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="editor-category">Categoria</Label><select id="editor-category" className={`${selectClass} w-full`} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as EditorialDraft["category"] })}>{NEWS_FILTERS.filter(f => f.value !== "todos").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
          <div className="space-y-1"><Label htmlFor="editor-summary">Resumo</Label><Textarea id="editor-summary" rows={3} maxLength={500} value={draft.summary} onChange={e => setDraft({ ...draft, summary: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="editor-content">Texto da notícia</Label><Textarea id="editor-content" rows={9} maxLength={20000} value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} /></div>
          <div className="space-y-1"><Label>Foto autorizada</Label><SingleImageUploader value={draft.cover_url} onChange={url => setDraft({ ...draft, cover_url: url })} folder="news/cover" aspect="wide" onUploadStateChange={setUploading} /></div>
          <div className="space-y-1"><Label htmlFor="editor-source">Fonte original</Label><Input id="editor-source" type="url" value={draft.source_url ?? ""} onChange={e => setDraft({ ...draft, source_url: e.target.value || null })} /></div>
          <div className="space-y-1"><Label htmlFor="editor-source-name">Nome da fonte</Label><Input id="editor-source-name" value={draft.source_name ?? ""} onChange={e => setDraft({ ...draft, source_name: e.target.value || null })} /></div>
        </>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button variant="outline" disabled={busy || uploading || !draft.title.trim()} onClick={() => submit(false)}><Save className="h-4 w-4" /> Salvar rascunho</Button><Button disabled={busy || uploading || !draft.title.trim() || !draft.content.trim()} onClick={() => submit(true)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Aprovar e publicar</Button></div>
      </div>}
    </DialogContent></Dialog>
  </div>;
}