import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildJobSearchQuery, isRioVagasSource, canPublishJob, jobDraftSchema, type JobCandidate } from "./jobs-discovery";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const {data,error} = await context.supabase.rpc("has_role",{_user_id:context.userId,_role:"admin"});
  if(error || !data) throw new Error("Somente administradores podem acessar o buscador de vagas.");
}
export const searchLocalJobs = createServerFn({method:"POST"}).middleware([requireSupabaseAuth])
  .inputValidator((input:unknown)=>z.object({neighborhood:z.string().trim().max(100),terms:z.string().trim().max(120),type:z.enum(["todos","emprego","estagio","jovem-aprendiz","freelancer"]),period:z.enum(["qdr:d","qdr:w","qdr:m","all"])}).parse(input))
  .handler(async ({data,context})=>{
    await assertAdmin(context);
    const key=process.env["FIRECRAWL_API_KEY"], lovableKey=process.env["LOVABLE_API_KEY"];
    if(!key || !lovableKey) throw new Error("A conexão de busca não está disponível.");
    const kinds={todos:"(emprego OR estágio OR vagas)",emprego:"vagas emprego",estagio:"vagas estágio","jovem-aprendiz":"vagas jovem aprendiz",freelancer:"vagas freelancer"};
    const response=await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/search",{
      method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${lovableKey}`,"X-Connection-Api-Key":key},
      body:JSON.stringify({query:buildJobSearchQuery(data.neighborhood,kinds[data.type],data.terms),limit:10,sources:[{type:"web"}],location:"Nova Iguaçu, Rio de Janeiro, Brazil",...(data.period==="all"?{}:{tbs:data.period})}),
      signal:AbortSignal.timeout(45000),
    });
    if(!response.ok){const body=await response.text();console.error(`Job search failed [${response.status}]: ${body}`);return {results:[] as JobCandidate[],error:`Busca indisponível (${response.status}): ${body}`,creditsUsed:0};}
    const result=await response.json() as {success:boolean;error?:string;creditsUsed?:number;data?:{web?:Array<{title?:string;url?:string;description?:string;snippet?:string}>}|Array<{title?:string;url?:string;description?:string;snippet?:string}>};
    if(!result.success)return {results:[] as JobCandidate[],error:result.error||"Não foi possível buscar vagas.",creditsUsed:0};
    const results:JobCandidate[]=[], seen=new Set<string>();
    for(const row of (Array.isArray(result.data)?result.data:result.data?.web??[])){
      if(!row.url || !isRioVagasSource(row.url) || !row.title)continue;
      try{const url=new URL(row.url);url.hash="";for(const param of [...url.searchParams.keys()]) if(param.startsWith("utm_"))url.searchParams.delete(param);const canonical=url.toString();if(seen.has(canonical))continue;seen.add(canonical);results.push({title:row.title,url:canonical,snippet:row.description??row.snippet??"",source:url.hostname.replace(/^www\./,"")});}catch{/* Ignore invalid source URLs. */}
    }
    return {results,error:null,creditsUsed:result.creditsUsed??0};
  });
export const listDiscoveredJobs=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  await assertAdmin(context);
  const {data,error}=await context.supabase.from("jobs").select("id,title,company,location,type,description,salary,apply_url,whatsapp,source_url,source_name,expires_at,urgent,active,status,discovered").order("created_at",{ascending:false}).limit(200);
  if(error)throw new Error(error.message);return data??[];
});
export const saveJobDraft=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>jobDraftSchema.parse(input)).handler(async({data,context})=>{
  await assertAdmin(context);const {id,...fields}=data;
  const payload={...fields,status:"draft" as const,discovered:true};
  const query=id?context.supabase.from("jobs").update(payload).eq("id",id):context.supabase.from("jobs").insert({...payload,submitted_by:context.userId});
  const {data:saved,error}=await query.select("id").single();
  if(error)throw new Error(error.code==="23505"?"Esta fonte já foi selecionada. Abra a vaga na lista abaixo.":error.message);
  return {id:saved.id as string};
});
export const publishDiscoveredJob=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({id:z.string().uuid()}).parse(input)).handler(async({data,context})=>{
  await assertAdmin(context);
  const {data:row,error:readError}=await context.supabase.from("jobs").select("*").eq("id",data.id).eq("discovered",true).single();
  if(readError)throw new Error(readError.message);
  const draft=jobDraftSchema.parse({...row,description:row.description??"",salary:row.salary??"",whatsapp:row.whatsapp??""});
  if(!canPublishJob(draft))throw new Error("Revise título, empresa, local, descrição, contato e validade antes de publicar.");
  const {error}=await context.supabase.from("jobs").update({status:"approved",active:true,posted_at:new Date().toISOString(),approved_by:context.userId,approved_at:new Date().toISOString(),rejection_reason:null}).eq("id",data.id).select("id").single();
  if(error)throw new Error(error.message);return {ok:true};
});
export const deleteDiscoveredJob=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({id:z.string().uuid()}).parse(input)).handler(async({data,context})=>{
  await assertAdmin(context);const {error}=await context.supabase.from("jobs").delete().eq("id",data.id);if(error)throw new Error(error.message);return {ok:true};
});