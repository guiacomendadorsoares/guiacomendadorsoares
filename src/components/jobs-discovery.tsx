import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Pencil, Check, ExternalLink, Loader2, Save, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JOB_FILTERS, JOB_TYPE_LABELS } from "@/lib/jobs";
import { candidateToJobDraft, emptyJobDraft, canPublishJob, type JobDraft, type JobCandidate } from "@/lib/jobs-discovery";
import { searchLocalJobs, listDiscoveredJobs, saveJobDraft, publishDiscoveredJob, deleteDiscoveredJob } from "@/lib/jobs-discovery.functions";

export function JobsDiscovery() {
  const search=useServerFn(searchLocalJobs), list=useServerFn(listDiscoveredJobs), save=useServerFn(saveJobDraft), publish=useServerFn(publishDiscoveredJob), remove=useServerFn(deleteDiscoveredJob);
  const qc=useQueryClient();
  const [neighborhood,setNeighborhood]=useState("");
  const [type,setType]=useState<JobDraft["type"]|"todos">("todos");
  const [period,setPeriod]=useState<"qdr:d"|"qdr:w"|"qdr:m"|"all">("qdr:m");
  const [terms,setTerms]=useState("");
  const [results,setResults]=useState<JobCandidate[]>([]);
  const [searching,setSearching]=useState(false),[searched,setSearched]=useState(false);
  const [searchError,setSearchError]=useState<string|null>(null),[usage,setUsage]=useState(0);
  const [draft,setDraft]=useState<JobDraft|null>(null),[busy,setBusy]=useState(false),[preview,setPreview]=useState(false);
  const {data:rows=[],isLoading,error}=useQuery({queryKey:["jobs-editorial"],queryFn:()=>list(),retry:false});
  const selectClass="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";
  async function refresh(){await Promise.all([qc.invalidateQueries({queryKey:["jobs-editorial"]}),qc.invalidateQueries({queryKey:["home-items","jobs"]}),qc.invalidateQueries({queryKey:["jobs"]}),qc.invalidateQueries({queryKey:["vagas"]}),qc.invalidateQueries({queryKey:["admin-counts"]}),qc.invalidateQueries({queryKey:["pending","jobs"]})]);}
  async function runSearch(e:React.FormEvent){
    e.preventDefault();setSearching(true);setSearchError(null);setResults([]);
    try{const response=await search({data:{neighborhood,terms,type,period}});setResults(response.results);setSearchError(response.error);setUsage(response.creditsUsed);setSearched(true);}
    catch(e){setSearchError(e instanceof Error?e.message:"Não foi possível buscar vagas.");}
    finally{setSearching(false);}
  }
  function prepare(candidate?:JobCandidate){setPreview(false);setDraft(candidate?candidateToJobDraft(candidate,type==="todos"?(/est[aá]gio/i.test(candidate.title)?"estagio":"emprego"):type,neighborhood?`${neighborhood}, Nova Iguaçu`:"Nova Iguaçu"):emptyJobDraft());}
  async function submit(shouldPublish:boolean){
    if(!draft)return;setBusy(true);
    try{const saved=await save({data:draft});setDraft({...draft,id:saved.id});if(shouldPublish)await publish({data:{id:saved.id}});await refresh();toast.success(shouldPublish?"Vaga aprovada e publicada na Home e em Vagas.":"Rascunho salvo, sem publicação.");setDraft(null);}
    catch(e){toast.error(e instanceof Error?e.message:"Não foi possível salvar.");await refresh();}
    finally{setBusy(false);}
  }
  return <div className="space-y-8">
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-bold">Vagas · Nova Iguaçu</h1><Button onClick={()=>prepare()}><Plus className="h-4 w-4"/> Nova vaga</Button></div>
      <form onSubmit={runSearch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1"><Label htmlFor="jobs-neighborhood">Bairro</Label><Input id="jobs-neighborhood" placeholder="Todos os bairros" maxLength={100} value={neighborhood} onChange={e=>setNeighborhood(e.target.value)}/></div>
        <div className="space-y-1"><Label htmlFor="jobs-type">Categoria</Label><select id="jobs-type" className={selectClass} value={type} onChange={e=>setType(e.target.value as typeof type)}>{JOB_FILTERS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
        <div className="space-y-1"><Label htmlFor="jobs-period">Período</Label><select id="jobs-period" className={selectClass} value={period} onChange={e=>setPeriod(e.target.value as typeof period)}><option value="qdr:d">Últimas 24 horas</option><option value="qdr:w">Última semana</option><option value="qdr:m">Último mês</option><option value="all">Qualquer data</option></select></div>
        <div className="space-y-1"><Label htmlFor="jobs-terms">Cargo ou área</Label><Input id="jobs-terms" placeholder="Ex.: vendedor, administração" maxLength={120} value={terms} onChange={e=>setTerms(e.target.value)}/></div>
        <Button type="submit" disabled={searching} className="sm:col-span-2 lg:col-span-4 justify-self-start">{searching?<Loader2 className="h-4 w-4 animate-spin"/>:<Search className="h-4 w-4"/>}{searching?"Buscando…":"Buscar no RioVagas"}</Button>
      </form>
      {searchError&&<p role="alert" className="break-words text-sm text-destructive">{searchError}</p>}
      {searched&&!searchError&&<p role="status" className="text-xs text-muted-foreground">{results.length} resultados · Uso: ≈ {(usage*0.004).toLocaleString("pt-BR")} créditos Lovable ({(usage*0.002).toLocaleString("pt-BR")} no plano Business).</p>}
      {searched&&!searchError&&!results.length&&<p className="text-muted-foreground">Nenhuma vaga encontrada no RioVagas com estes filtros.</p>}
      <div className="grid gap-3 md:grid-cols-2">{results.map(item=>{
        const existing=rows.some(row=>row.source_url===item.url);
        return <article key={item.url} className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4"><p className="break-words text-xs text-muted-foreground">{item.source}</p><h2 className="break-words font-semibold">{item.title}</h2><p className="break-words text-sm text-muted-foreground">{item.snippet}</p><div className="mt-auto flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><a href={item.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4"/> Fonte original</a></Button><Button size="sm" disabled={existing} onClick={()=>prepare(item)}><Pencil className="h-4 w-4"/>{existing?"Já selecionada":"Selecionar vaga"}</Button></div></article>;
      })}</div>
    </section>
    <section className="space-y-3 border-t border-border pt-6"><h2 className="font-display text-xl font-bold">Vagas do Guia</h2>
      {isLoading&&<Loader2 className="h-5 w-5 animate-spin"/>}{error&&<p role="alert" className="text-destructive">{error.message}</p>}
      {!isLoading&&!error&&!rows.length&&<p className="text-muted-foreground">Nenhuma vaga cadastrada.</p>}
      {rows.map(row=><div key={row.id} className="flex items-center justify-between gap-3 border-b border-border py-3"><div className="min-w-0"><p className="break-words font-semibold">{row.title}</p><p className="break-words text-xs text-muted-foreground">{JOB_TYPE_LABELS[row.type as JobDraft["type"]]} · {row.company||"Empresa não informada"} · {row.status==="approved"&&row.active?"Publicada":row.status==="pending"?"Aguardando aprovação":"Rascunho / inativa"}</p></div><Button variant="outline" size="sm" aria-label={`Editar ${row.title}`} onClick={()=>{setPreview(false);setDraft({id:row.id,title:row.title,company:row.company,location:row.location,type:row.type as JobDraft["type"],description:row.description??"",salary:row.salary??"",apply_url:row.apply_url,whatsapp:row.whatsapp??"",source_url:row.source_url,source_name:row.source_name,expires_at:row.expires_at,urgent:row.urgent,active:row.active});}}><Pencil className="h-4 w-4"/></Button></div>)}
    </section>
    <Dialog open={!!draft} onOpenChange={open=>{if(!open&&!busy)setDraft(null);}}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Revisão da vaga · Guia Comendador Soares</DialogTitle></DialogHeader>
      {draft&&<div className="space-y-4">
        <div className="flex justify-between gap-2"><Button variant="outline" size="sm" onClick={()=>setPreview(!preview)}><Eye className="h-4 w-4"/>{preview?"Editar":"Prévia"}</Button>{draft.id&&<Button variant="outline" size="sm" disabled={busy} onClick={async()=>{if(!draft.id||!window.confirm("Excluir esta vaga permanentemente?"))return;setBusy(true);try{await remove({data:{id:draft.id}});await refresh();setDraft(null);toast.success("Vaga excluída.");}catch(e){toast.error(e instanceof Error?e.message:"Não foi possível excluir.");}finally{setBusy(false);}}}><Trash2 className="h-4 w-4 text-destructive"/> Excluir</Button>}</div>
        {preview?<article className="space-y-3"><p className="text-sm font-semibold text-primary">{JOB_TYPE_LABELS[draft.type]} · Guia Comendador Soares</p><h2 className="break-words font-display text-2xl font-bold">{draft.title}</h2><p className="break-words text-muted-foreground">{draft.company} · {draft.location}</p><p>{draft.salary||"Salário não informado"}</p><div className="whitespace-pre-wrap break-words">{draft.description}</div>{draft.source_url&&<a className="text-primary underline" href={draft.source_url} target="_blank" rel="noopener noreferrer">Fonte: {draft.source_name}</a>}</article>:<>
          <div className="space-y-1"><Label htmlFor="job-title">Título</Label><Input id="job-title" maxLength={200} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="job-company">Empresa</Label><Input id="job-company" maxLength={200} value={draft.company} onChange={e=>setDraft({...draft,company:e.target.value})}/></div><div className="space-y-1"><Label htmlFor="job-category">Categoria</Label><select id="job-category" className={selectClass} value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as JobDraft["type"]})}>{JOB_FILTERS.filter(f=>f.value!=="todos").map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select></div></div>
          <div className="space-y-1"><Label htmlFor="job-location">Local</Label><Input id="job-location" maxLength={300} value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})}/></div>
          <div className="space-y-1"><Label htmlFor="job-description">Descrição e requisitos</Label><Textarea id="job-description" rows={7} maxLength={20000} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="job-salary">Salário ou bolsa</Label><Input id="job-salary" maxLength={200} value={draft.salary} onChange={e=>setDraft({...draft,salary:e.target.value})}/></div><div className="space-y-1"><Label htmlFor="job-expiration">Encerramento</Label><Input id="job-expiration" type="date" value={draft.expires_at?.slice(0,10)??""} onChange={e=>setDraft({...draft,expires_at:e.target.value?`${e.target.value}T23:59:59.000Z`:null})}/></div></div>
          <div className="space-y-1"><Label htmlFor="job-apply">Link de candidatura</Label><Input id="job-apply" type="url" value={draft.apply_url??""} onChange={e=>setDraft({...draft,apply_url:e.target.value||null})}/></div>
          <div className="space-y-1"><Label htmlFor="job-whatsapp">WhatsApp</Label><Input id="job-whatsapp" maxLength={30} value={draft.whatsapp} onChange={e=>setDraft({...draft,whatsapp:e.target.value})}/></div>
          <div className="space-y-1"><Label htmlFor="job-source">Fonte original</Label><Input id="job-source" type="url" value={draft.source_url??""} onChange={e=>setDraft({...draft,source_url:e.target.value||null})}/></div>
          <div className="space-y-1"><Label htmlFor="job-source-name">Nome da fonte</Label><Input id="job-source-name" maxLength={200} value={draft.source_name??""} onChange={e=>setDraft({...draft,source_name:e.target.value||null})}/></div>
          <div className="flex flex-wrap gap-5"><div className="flex items-center gap-2"><Checkbox id="job-urgent" checked={draft.urgent} onCheckedChange={value=>setDraft({...draft,urgent:value===true})}/><Label htmlFor="job-urgent">Urgente</Label></div><div className="flex items-center gap-2"><Checkbox id="job-active" checked={draft.active} onCheckedChange={value=>setDraft({...draft,active:value===true})}/><Label htmlFor="job-active">Ativa</Label></div></div>
        </>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button variant="outline" disabled={busy||!draft.title.trim()} onClick={()=>submit(false)}><Save className="h-4 w-4"/> Salvar rascunho</Button><Button disabled={busy||!canPublishJob(draft)} onClick={()=>submit(true)}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Check className="h-4 w-4"/>} Aprovar e publicar</Button></div>
      </div>}
    </DialogContent></Dialog>
  </div>;
}