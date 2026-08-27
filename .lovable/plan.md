# Módulo de Reivindicação de Empresa (Business Claim)

Sistema completo para que proprietários assumam empresas já cadastradas, com arquitetura multi-usuário preparada para filiais, funções e permissões granulares.

Dado o tamanho, proponho entregar em **5 fases sequenciais**, cada uma testável e utilizável de forma independente. Assim você pode validar cada etapa antes da próxima.

---

## Fase 1 — Fundação (Banco + Reivindicação básica)

**Tabelas novas** (migration única, com GRANT + RLS):

- `business_members` — vínculo N:N usuário↔empresa
  - `business_id`, `user_id`, `role`, `status` (active/suspended), `is_primary_owner`
- `business_roles` — funções configuráveis (proprietario, admin_empresa, gerente, marketing, financeiro, editor, atendimento, leitura)
- `business_permissions` — permissões por função (edit_business, edit_products, edit_hours, manage_team, view_stats, etc.)
- `business_claims` — solicitações de reivindicação
  - dados do solicitante (nome, cpf, cargo, telefone, whatsapp, email)
  - `status` (pending, in_review, awaiting_docs, approved, rejected, already_claimed, canceled)
  - `verification_method` (manual, email_code, whatsapp_code, sms_code, domain)
  - notas internas
- `business_claim_documents` — uploads (cartão CNPJ, contrato social, vínculo, identidade)
- `business_audit_log` — histórico (usuário, empresa, campo, valor antigo, valor novo, IP, dispositivo)

**Storage:** novo bucket privado `business-claims` com RLS (dono da claim + admin).

**RLS chave:**

- Empresa é "reivindicável" quando não tem `business_members` com `is_primary_owner=true`.
- Solicitante vê apenas as próprias claims. Admin vê tudo (via `has_role('admin')`).

**Interface Fase 1:**

- Botão **"Sou o proprietário desta empresa"** em `src/routes/empresa.$id.tsx` (só aparece se empresa não tem dono).
- Página de solicitação `/empresa/$id/reivindicar` com formulário + upload multi-arquivo (validação de tipo/tamanho: PDF/JPG/PNG até 10MB).
- Se não logado → redireciona para `/auth` guardando o destino.

---

## Fase 2 — Painel Administrativo de Claims

Nova rota `/_authenticated/admin.reivindicacoes.tsx` com:

- Lista com filtros: empresa, solicitante, cidade, data, status, busca livre
- Ficha detalhada por claim: dados empresa + solicitante + docs (preview) + histórico + observações internas
- Ações: **Aprovar**, **Recusar**, **Solicitar novos documentos**, **Reabrir**, **Transferir propriedade**, **Suspender vínculo**, **Excluir**
- Ao aprovar: cria `business_members` com `role='proprietario'` e `is_primary_owner=true` — não altera `businesses`
- Item de menu no `dashboard-nav.ts` na categoria Comercial

---

## Fase 3 — Painel do Proprietário (Painel Empresa)

Reformular `src/routes/_authenticated/painel-empresa.tsx` para trabalhar com `business_members`:

- Selector de empresa (usuário pode ter várias)
- Edição de todos os campos listados (logo, capa, galeria, descrição, categorias, produtos, promoções, cupons, horário, contatos, redes sociais, localização, formas de pagamento, PIX, FAQ, SEO)
- Guard por permissão: cada ação verifica `business_permissions` da função do usuário
- Server functions em `src/lib/business-members.functions.ts` com `requireSupabaseAuth` + checagem de permissão

---

## Fase 4 — Equipe, Convites e Moderação

- Aba **Equipe** no painel: listar membros, convidar por email, alterar função, suspender, remover
- Tabela `business_invitations` com token único (expira em 7 dias)
- Página pública `/convite/$token` para aceitar convite
- **Parâmetro global de moderação** (em `businesses` ou tabela `system_settings`):
  - Modo 1: alterações vão ao ar direto
  - Modo 2: alterações ficam em `business_pending_changes` com diff (valor antigo → novo) para aprovação
- Tela admin de pending changes com aprovar/recusar/editar

---

## Fase 5 — Notificações, Filiais e Auditoria completa

- Notificações in-app (tabela existente) para: nova reivindicação, aprovação, recusa, novo membro, alteração aprovada/recusada, troca de proprietário
- Estrutura de filiais: coluna `parent_business_id` em `businesses` + UI para vincular
- Auditoria completa: trigger em `businesses`, `business_members` e conteúdos filhos gravando em `business_audit_log` com IP/dispositivo
- Códigos de verificação por email (usando resend/lovable email) — estrutura preparada para WhatsApp/SMS quando o conector for adicionado

---

## Detalhes técnicos

- **Stack:** TanStack Start + Lovable Cloud (Supabase). Zero edge functions — tudo via `createServerFn`.
- **Segurança:** RLS em todas as tabelas, `has_role()` para admins, função `has_business_permission(user_id, business_id, permission)` SECURITY DEFINER para checagens de permissão sem recursão.
- **Uploads:** bucket privado + signed URLs curtas (5 min) só para admin e dono da claim.
- **Soft delete:** coluna `deleted_at` em `business_members`, `business_claims`, `business_invitations`.
- **Índices:** em `business_id`, `user_id`, `status`, `created_at` de todas as tabelas transacionais.
- **Reuso:** aproveita `ImageUploader`, `AdminContentTable`, `AppShell`, componentes shadcn e o padrão de aprovações existente (`src/lib/approvals.ts`).
- **Rate limit:** infra atual não tem primitivo — deixarei documentado; não implemento manualmente.

## Fora de escopo (assumido para depois)

Marketplace, delivery, chat cliente↔empresa, agendamentos, integrações externas (Google Business, Meta, ERP). A arquitetura de `business_members` + `business_permissions` já suporta esses módulos futuros.

---

**Confirma o plano e a divisão em 5 fases?** Se sim, começo pela **Fase 1** (migration + botão + formulário de reivindicação).
