-- LUZZY AI — profils publics, pays ONU, XP monotone et classements par continent/monde.
-- Sécurité : RLS activée partout, aucun accès anon aux données personnelles.

-- 1. Référentiel des pays (193 États membres de l'ONU, géoschéma M49).
create table if not exists public.countries (
  code char(2) primary key check (code ~ '^[A-Z]{2}$'),
  name_fr text not null check (char_length(name_fr) between 2 and 80),
  continent text not null check (continent in ('africa', 'americas', 'asia', 'europe', 'oceania'))
);

alter table public.countries enable row level security;

drop policy if exists countries_read_all on public.countries;
create policy countries_read_all on public.countries
  for select to anon, authenticated using (true);

-- Référentiel en lecture seule pour les clients : aucune policy d'écriture.
revoke all on public.countries from anon, authenticated;
grant select on public.countries to anon, authenticated;

insert into public.countries (code, name_fr, continent) values
  ('DZ','Algérie','africa'),('AO','Angola','africa'),('BJ','Bénin','africa'),('BW','Botswana','africa'),
  ('BF','Burkina Faso','africa'),('BI','Burundi','africa'),('CV','Cap-Vert','africa'),('CM','Cameroun','africa'),
  ('CF','République centrafricaine','africa'),('TD','Tchad','africa'),('KM','Comores','africa'),('CG','Congo','africa'),
  ('CD','République démocratique du Congo','africa'),('CI','Côte d''Ivoire','africa'),('DJ','Djibouti','africa'),
  ('EG','Égypte','africa'),('GQ','Guinée équatoriale','africa'),('ER','Érythrée','africa'),('SZ','Eswatini','africa'),
  ('ET','Éthiopie','africa'),('GA','Gabon','africa'),('GM','Gambie','africa'),('GH','Ghana','africa'),('GN','Guinée','africa'),
  ('GW','Guinée-Bissau','africa'),('KE','Kenya','africa'),('LS','Lesotho','africa'),('LR','Liberia','africa'),('LY','Libye','africa'),
  ('MG','Madagascar','africa'),('MW','Malawi','africa'),('ML','Mali','africa'),('MA','Maroc','africa'),('MU','Maurice','africa'),
  ('MR','Mauritanie','africa'),('MZ','Mozambique','africa'),('NA','Namibie','africa'),('NE','Niger','africa'),('NG','Nigeria','africa'),
  ('RW','Rwanda','africa'),('ST','Sao Tomé-et-Principe','africa'),('SN','Sénégal','africa'),('SC','Seychelles','africa'),
  ('SL','Sierra Leone','africa'),('SO','Somalie','africa'),('ZA','Afrique du Sud','africa'),('SS','Soudan du Sud','africa'),
  ('SD','Soudan','africa'),('TZ','Tanzanie','africa'),('TG','Togo','africa'),('TN','Tunisie','africa'),('UG','Ouganda','africa'),
  ('ZM','Zambie','africa'),('ZW','Zimbabwe','africa'),
  ('AG','Antigua-et-Barbuda','americas'),('AR','Argentine','americas'),('BS','Bahamas','americas'),('BB','Barbade','americas'),
  ('BZ','Belize','americas'),('BO','Bolivie','americas'),('BR','Brésil','americas'),('CA','Canada','americas'),('CL','Chili','americas'),
  ('CO','Colombie','americas'),('CR','Costa Rica','americas'),('CU','Cuba','americas'),('DM','Dominique','americas'),
  ('DO','République dominicaine','americas'),('EC','Équateur','americas'),('SV','Salvador','americas'),('GD','Grenade','americas'),
  ('GT','Guatemala','americas'),('GY','Guyana','americas'),('HT','Haïti','americas'),('HN','Honduras','americas'),('JM','Jamaïque','americas'),
  ('MX','Mexique','americas'),('NI','Nicaragua','americas'),('PA','Panama','americas'),('PY','Paraguay','americas'),('PE','Pérou','americas'),
  ('KN','Saint-Christophe-et-Niévès','americas'),('LC','Sainte-Lucie','americas'),('VC','Saint-Vincent-et-les-Grenadines','americas'),
  ('SR','Suriname','americas'),('TT','Trinité-et-Tobago','americas'),('US','États-Unis','americas'),('UY','Uruguay','americas'),
  ('VE','Venezuela','americas'),
  ('AF','Afghanistan','asia'),('SA','Arabie saoudite','asia'),('BH','Bahreïn','asia'),('BD','Bangladesh','asia'),('BT','Bhoutan','asia'),
  ('BN','Brunei','asia'),('MM','Myanmar','asia'),('KH','Cambodge','asia'),('CN','Chine','asia'),('KR','Corée du Sud','asia'),
  ('KP','Corée du Nord','asia'),('AE','Émirats arabes unis','asia'),('PH','Philippines','asia'),('IN','Inde','asia'),
  ('ID','Indonésie','asia'),('IR','Iran','asia'),('IQ','Irak','asia'),('IL','Israël','asia'),('JP','Japon','asia'),('JO','Jordanie','asia'),
  ('KZ','Kazakhstan','asia'),('KW','Koweït','asia'),('LA','Laos','asia'),('LB','Liban','asia'),('MY','Malaisie','asia'),
  ('MV','Maldives','asia'),('MN','Mongolie','asia'),('NP','Népal','asia'),('OM','Oman','asia'),('UZ','Ouzbékistan','asia'),
  ('PK','Pakistan','asia'),('QA','Qatar','asia'),('SG','Singapour','asia'),('LK','Sri Lanka','asia'),('SY','Syrie','asia'),
  ('TJ','Tadjikistan','asia'),('TH','Thaïlande','asia'),('TM','Turkménistan','asia'),('TR','Turquie','asia'),('VN','Viêt Nam','asia'),
  ('YE','Yémen','asia'),('TL','Timor-Oriental','asia'),('KG','Kirghizistan','asia'),('AZ','Azerbaïdjan','asia'),('AM','Arménie','asia'),
  ('GE','Géorgie','asia'),('CY','Chypre','asia'),
  ('AL','Albanie','europe'),('DE','Allemagne','europe'),('AD','Andorre','europe'),('AT','Autriche','europe'),('BY','Biélorussie','europe'),
  ('BE','Belgique','europe'),('BA','Bosnie-Herzégovine','europe'),('BG','Bulgarie','europe'),('HR','Croatie','europe'),
  ('DK','Danemark','europe'),('ES','Espagne','europe'),('EE','Estonie','europe'),('FI','Finlande','europe'),('FR','France','europe'),
  ('GR','Grèce','europe'),('HU','Hongrie','europe'),('IE','Irlande','europe'),('IS','Islande','europe'),('IT','Italie','europe'),
  ('LV','Lettonie','europe'),('LI','Liechtenstein','europe'),('LT','Lituanie','europe'),('LU','Luxembourg','europe'),
  ('MK','Macédoine du Nord','europe'),('MT','Malte','europe'),('MD','Moldavie','europe'),('MC','Monaco','europe'),
  ('ME','Monténégro','europe'),('NO','Norvège','europe'),('NL','Pays-Bas','europe'),('PL','Pologne','europe'),('PT','Portugal','europe'),
  ('CZ','Tchéquie','europe'),('RO','Roumanie','europe'),('GB','Royaume-Uni','europe'),('RU','Russie','europe'),('SM','Saint-Marin','europe'),
  ('RS','Serbie','europe'),('SK','Slovaquie','europe'),('SI','Slovénie','europe'),('SE','Suède','europe'),('CH','Suisse','europe'),
  ('UA','Ukraine','europe'),
  ('AU','Australie','oceania'),('FJ','Fidji','oceania'),('KI','Kiribati','oceania'),('MH','Îles Marshall','oceania'),
  ('FM','États fédérés de Micronésie','oceania'),('NR','Nauru','oceania'),('NZ','Nouvelle-Zélande','oceania'),('PW','Palaos','oceania'),
  ('PG','Papouasie-Nouvelle-Guinée','oceania'),('WS','Samoa','oceania'),('SB','Îles Salomon','oceania'),('TO','Tonga','oceania'),
  ('TV','Tuvalu','oceania'),('VU','Vanuatu','oceania')
on conflict (code) do nothing;

-- 2. Profils publics et privés (une ligne par utilisateur authentifié).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  pseudo text not null check (pseudo ~ '^[a-z0-9](?:[._-]?[a-z0-9])*$' and char_length(pseudo) between 3 and 20),
  country_code char(2) not null references public.countries (code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_pseudo_key on public.profiles (pseudo);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

revoke all on public.profiles from anon, authenticated;
grant select, insert, update (first_name, last_name, pseudo, country_code, updated_at) on public.profiles to authenticated;

-- Pseudo en minuscules, pays en majuscules, horodatage géré par trigger (le client ne le fixe pas).
create or replace function public.profiles_normalize()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.pseudo := lower(trim(new.pseudo));
  new.country_code := upper(new.country_code);
  new.first_name := trim(new.first_name);
  new.last_name := trim(new.last_name);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_normalize_trg on public.profiles;
create trigger profiles_normalize_trg
  before insert or update on public.profiles
  for each row execute function public.profiles_normalize();

-- 3. XP : monotone (ne peut jamais baisser), une ligne par utilisateur.
create table if not exists public.user_xp (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp integer not null default 0 check (xp between 0 and 1000000),
  updated_at timestamptz not null default now()
);

alter table public.user_xp enable row level security;

drop policy if exists user_xp_select_own on public.user_xp;
create policy user_xp_select_own on public.user_xp
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists user_xp_insert_own on public.user_xp;
create policy user_xp_insert_own on public.user_xp
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists user_xp_update_own on public.user_xp;
create policy user_xp_update_own on public.user_xp
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.user_xp from anon, authenticated;
grant select, insert, update (xp, updated_at) on public.user_xp to authenticated;

create or replace function public.user_xp_monotonic()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.xp < old.xp then
    new.xp := old.xp;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_xp_monotonic_trg on public.user_xp;
create trigger user_xp_monotonic_trg
  before insert or update on public.user_xp
  for each row execute function public.user_xp_monotonic();

-- 4. Disponibilité d'un pseudo, sans exposer les profils.
create or replace function public.is_pseudo_available(p_pseudo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles where pseudo = lower(trim(p_pseudo))
  );
$$;

revoke all on function public.is_pseudo_available(text) from public, anon;
grant execute on function public.is_pseudo_available(text) to authenticated;

-- 5. Classements : seuls pseudo, pays, continent et XP sont exposés.
create or replace function public.get_leaderboard(
  p_scope text,
  p_continent text default null,
  p_country text default null,
  p_limit integer default 50
)
returns table (rank bigint, pseudo text, country_code char(2), continent text, xp integer)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select
      p.pseudo,
      p.country_code,
      c.continent,
      x.xp,
      row_number() over (order by x.xp desc, p.pseudo asc) as rank
    from public.profiles p
    join public.countries c on c.code = p.country_code
    join public.user_xp x on x.user_id = p.id
    where
      (p_scope = 'world')
      or (p_scope = 'continent' and c.continent = p_continent)
      or (p_scope = 'country' and p.country_code = upper(p_country))
  )
  select rank, pseudo, country_code, continent, xp
  from ranked
  where (select auth.uid()) is not null
  order by rank
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

revoke all on function public.get_leaderboard(text, text, text, integer) from public, anon;
grant execute on function public.get_leaderboard(text, text, text, integer) to authenticated;
