-- ============================================================================
-- 002 — SECURITY HARDENING (Supabase / Postgres)
-- LUZZY AI — durcissement backend (OWASP vibecoding #1, #2, #3, #12, #33, #35, #45)
--
-- À exécuter dans le SQL Editor de Supabase (https://fssmvqhfxxwizegftflk.supabase.co)
-- en une seule fois. Idempotent : peut être relancé sans erreur.
--
-- Contenu :
--   1. RLS forcée sur public.profiles (FORCE = même le propriétaire de la
--      table ne peut pas contourner les policies).
--   2. Policies SELECT/INSERT/UPDATE/DELETE strictement liées à user_id()
--      (jamais d'accès inter-utilisateurs, jamais d'IDOR — CWE-639).
--   3. Trigger anti-mass-assignment : id et created_at sont immuables,
--      updated_at est géré par la base (CWE-915).
--   4. Contraintes CHECK de longueur/format (miroir des limites frontend).
--   5. search_path verrouillé sur user_id() (anti hijack de schéma — CWE-45).
--   6. Privilèges moindres pour anon (lecture seule applicative).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Activer et FORCER la RLS (idempotent)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- ---------------------------------------------------------------------------
-- 2. Recréer les policies proprement : on supprime TOUTES les policies
--    existantes sur profiles (noms inconnus possibles) puis on recrée un
--    ensemble minimal, strict et testable.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
end $$;

-- Chaque utilisateur ne voit que sa ligne (IDOR impossible par construction).
create policy "profiles_select_own"
  on public.profiles for select
  using (id = public.user_id());

-- Insertion : uniquement sa propre ligne, id fourni = user_id().
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = public.user_id());

-- Mise à jour : uniquement sa propre ligne, ET la ligne modifiée reste
-- la sienne (avec check empêche de "déplacer" une ligne vers un autre id).
create policy "profiles_update_own"
  on public.profiles for update
  using (id = public.user_id())
  with check (id = public.user_id());

-- Suppression : uniquement sa propre ligne (droit à l'oubli RGPD).
create policy "profiles_delete_own"
  on public.profiles for delete
  using (id = public.user_id());

-- ---------------------------------------------------------------------------
-- 3. Anti mass-assignment : colonnes protégées côté serveur.
--    Le client ne peut ni changer d'id, ni falsifier created_at.
--    updated_at est recalculé par la base, sans confiance dans le client.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profiles.id is immutable';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'profiles.created_at is immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- 4. Contraintes de validation (CWE-20) — même limites que le frontend.
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_email_len;
alter table public.profiles drop constraint if exists profiles_name_len;
alter table public.profiles drop constraint if exists profiles_avatar_len;

alter table public.profiles
  add constraint profiles_email_len  check (email      is null or char_length(email)      <= 254),
  add constraint profiles_name_len   check (name       is null or char_length(name)       <= 60),
  add constraint profiles_avatar_len check (avatar_url is null or char_length(avatar_url) <= 2048);

-- ---------------------------------------------------------------------------
-- 5. user_id() : verrouiller le search_path (CWE-45 — SECURITY DEFINER durci).
--    On réapplique la définition avec un search_path figé. Si la fonction
--    n'existe pas encore, la créer (auth tierce : sub => user id).
-- ---------------------------------------------------------------------------
create or replace function public.user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::text
$$;

-- ---------------------------------------------------------------------------
-- 6. Moindre privilège pour le rôle anon (CWE-276).
--    anon = requêtes sans JWT valide : aucune écriture ne doit être possible.
--    La RLS bloque déjà les lignes, ceci est la défense en profondeur.
-- ---------------------------------------------------------------------------
revoke insert, update, delete on public.profiles from anon;

-- ============================================================================
-- Vérifications post-migration (à exécuter manuellement) :
--   1. Avec un JWT utilisateur : SELECT * FROM profiles → une seule ligne.
--   2. UPDATE profiles SET id = '<autre>' → erreur "immutable".
--   3. UPDATE d'un autre utilisateur (id connu) → 0 ligne modifiée.
--   4. INSERT sans JWT → erreur (anon n'a plus le privilège).
--
-- Storage (si un bucket est créé plus tard) : ne JAMAIS le laisser public —
-- policies storage.files limitées au dossier auth.uid()/user_id() du propriétaire
-- et URLs signées pour l'affichage (doc #41).
-- ============================================================================
