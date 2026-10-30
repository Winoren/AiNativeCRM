-- 0409 · GLM embedding-3 vira o contrato único do RAG (1024 dimensões).
--
-- Vetores de modelos diferentes não são comparáveis. Quando este forward-fix
-- encontra o contrato antigo, invalida os índices antigos antes de trocar o
-- tipo; a interface passa a mostrar a necessidade de nova indexação.
do $$
declare
  v_tipo text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into v_tipo
    from pg_attribute a
   where a.attrelid = 'public.ai_chunks'::regclass
     and a.attname = 'embedding'
     and not a.attisdropped;

  if v_tipo is distinct from 'vector(1024)' then
    update public.ai_knowledge_sources
       set active_kb_version_id = null,
           last_index_status = 'failed',
           last_index_error = 'O modelo de embedding mudou para GLM embedding-3 (1024 dimensões). Reindexe este material.',
           chunks_count = 0,
           updated_at = now()
     where active_kb_version_id is not null
        or chunks_count <> 0;

    update public.ai_knowledge_versions
       set is_active = false,
           status = 'failed',
           error_message = 'Índice antigo invalidado pela migração para GLM embedding-3 (1024 dimensões).'
     where is_active
        or total_chunks <> 0;

    delete from public.ai_chunks;
    drop index if exists public.ai_chunks_embedding_ivfflat_idx;

    alter table public.ai_chunks
      alter column embedding type public.vector(1024)
      using null::public.vector(1024);
  end if;
end $$;

create index if not exists ai_chunks_embedding_ivfflat_idx
  on public.ai_chunks
  using ivfflat (embedding public.vector_cosine_ops)
  with (lists = 100);

update public.ai_models
   set supports_embedding = false
 where provider = 'openai'
   and model_id = 'text-embedding-3-small';

insert into public.ai_models
  (provider, model_id, display_name, description,
   input_price_per_million_cents, output_price_per_million_cents,
   supports_tools, supports_embedding, embedding_dims)
values
  ('zhipu', 'embedding-3', 'GLM Embedding 3',
   'Modelo fixo do acervo semântico. A instalação usa 1024 dimensões; trocar exige reindexar o material.',
   null, null, false, true, 1024)
on conflict (provider, model_id) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  supports_tools = excluded.supports_tools,
  supports_embedding = excluded.supports_embedding,
  embedding_dims = excluded.embedding_dims;

notify pgrst, 'reload schema';
