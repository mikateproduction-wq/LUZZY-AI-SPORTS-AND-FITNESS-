/**
 * Les 193 États membres de l'ONU, avec code ISO 3166-1 alpha-2 et découpage
 * continental selon le géoschéma M49 de l'ONU (Afrique, Amériques, Asie, Europe, Océanie).
 * Source du découpage : https://unstats.un.org/unsd/methodology/m49/
 */

export type Continent = 'africa' | 'americas' | 'asia' | 'europe' | 'oceania';

export interface Country {
  code: string;
  name: string;
  continent: Continent;
}

export const CONTINENTS: Continent[] = ['africa', 'americas', 'asia', 'europe', 'oceania'];

export const CONTINENT_LABELS_FR: Record<Continent, string> = {
  africa: 'Afrique',
  americas: 'Amériques',
  asia: 'Asie',
  europe: 'Europe',
  oceania: 'Océanie',
};

const AFRICA: [string, string][] = [
  ['DZ', 'Algérie'], ['AO', 'Angola'], ['BJ', 'Bénin'], ['BW', 'Botswana'], ['BF', 'Burkina Faso'],
  ['BI', 'Burundi'], ['CV', 'Cap-Vert'], ['CM', 'Cameroun'], ['CF', 'République centrafricaine'],
  ['TD', 'Tchad'], ['KM', 'Comores'], ['CG', 'Congo'], ['CD', 'République démocratique du Congo'],
  ['CI', "Côte d'Ivoire"], ['DJ', 'Djibouti'], ['EG', 'Égypte'], ['GQ', 'Guinée équatoriale'],
  ['ER', 'Érythrée'], ['SZ', 'Eswatini'], ['ET', 'Éthiopie'], ['GA', 'Gabon'], ['GM', 'Gambie'],
  ['GH', 'Ghana'], ['GN', 'Guinée'], ['GW', 'Guinée-Bissau'], ['KE', 'Kenya'], ['LS', 'Lesotho'],
  ['LR', 'Liberia'], ['LY', 'Libye'], ['MG', 'Madagascar'], ['MW', 'Malawi'], ['ML', 'Mali'],
  ['MA', 'Maroc'], ['MU', 'Maurice'], ['MR', 'Mauritanie'], ['MZ', 'Mozambique'], ['NA', 'Namibie'],
  ['NE', 'Niger'], ['NG', 'Nigeria'], ['RW', 'Rwanda'], ['ST', 'Sao Tomé-et-Principe'],
  ['SN', 'Sénégal'], ['SC', 'Seychelles'], ['SL', 'Sierra Leone'], ['SO', 'Somalie'],
  ['ZA', 'Afrique du Sud'], ['SS', 'Soudan du Sud'], ['SD', 'Soudan'], ['TZ', 'Tanzanie'],
  ['TG', 'Togo'], ['TN', 'Tunisie'], ['UG', 'Ouganda'], ['ZM', 'Zambie'], ['ZW', 'Zimbabwe'],
];

const AMERICAS: [string, string][] = [
  ['AG', 'Antigua-et-Barbuda'], ['AR', 'Argentine'], ['BS', 'Bahamas'], ['BB', 'Barbade'],
  ['BZ', 'Belize'], ['BO', 'Bolivie'], ['BR', 'Brésil'], ['CA', 'Canada'], ['CL', 'Chili'],
  ['CO', 'Colombie'], ['CR', 'Costa Rica'], ['CU', 'Cuba'], ['DM', 'Dominique'],
  ['DO', 'République dominicaine'], ['EC', 'Équateur'], ['SV', 'Salvador'], ['GD', 'Grenade'],
  ['GT', 'Guatemala'], ['GY', 'Guyana'], ['HT', 'Haïti'], ['HN', 'Honduras'], ['JM', 'Jamaïque'],
  ['MX', 'Mexique'], ['NI', 'Nicaragua'], ['PA', 'Panama'], ['PY', 'Paraguay'], ['PE', 'Pérou'],
  ['KN', 'Saint-Christophe-et-Niévès'], ['LC', 'Sainte-Lucie'],
  ['VC', 'Saint-Vincent-et-les-Grenadines'], ['SR', 'Suriname'], ['TT', 'Trinité-et-Tobago'],
  ['US', 'États-Unis'], ['UY', 'Uruguay'], ['VE', 'Venezuela'],
];

const ASIA: [string, string][] = [
  ['AF', 'Afghanistan'], ['SA', 'Arabie saoudite'], ['BH', 'Bahreïn'], ['BD', 'Bangladesh'],
  ['BT', 'Bhoutan'], ['BN', 'Brunei'], ['MM', 'Myanmar'], ['KH', 'Cambodge'], ['CN', 'Chine'],
  ['KR', 'Corée du Sud'], ['KP', 'Corée du Nord'], ['AE', 'Émirats arabes unis'],
  ['PH', 'Philippines'], ['IN', 'Inde'], ['ID', 'Indonésie'], ['IR', 'Iran'], ['IQ', 'Irak'],
  ['IL', 'Israël'], ['JP', 'Japon'], ['JO', 'Jordanie'], ['KZ', 'Kazakhstan'], ['KW', 'Koweït'],
  ['LA', 'Laos'], ['LB', 'Liban'], ['MY', 'Malaisie'], ['MV', 'Maldives'], ['MN', 'Mongolie'],
  ['NP', 'Népal'], ['OM', 'Oman'], ['UZ', 'Ouzbékistan'], ['PK', 'Pakistan'], ['QA', 'Qatar'],
  ['SG', 'Singapour'], ['LK', 'Sri Lanka'], ['SY', 'Syrie'], ['TJ', 'Tadjikistan'],
  ['TH', 'Thaïlande'], ['TM', 'Turkménistan'], ['TR', 'Turquie'], ['VN', 'Viêt Nam'],
  ['YE', 'Yémen'], ['TL', 'Timor-Oriental'], ['KG', 'Kirghizistan'], ['AZ', 'Azerbaïdjan'],
  ['AM', 'Arménie'], ['GE', 'Géorgie'], ['CY', 'Chypre'],
];

const EUROPE: [string, string][] = [
  ['AL', 'Albanie'], ['DE', 'Allemagne'], ['AD', 'Andorre'], ['AT', 'Autriche'],
  ['BY', 'Biélorussie'], ['BE', 'Belgique'], ['BA', 'Bosnie-Herzégovine'], ['BG', 'Bulgarie'],
  ['HR', 'Croatie'], ['DK', 'Danemark'], ['ES', 'Espagne'], ['EE', 'Estonie'], ['FI', 'Finlande'],
  ['FR', 'France'], ['GR', 'Grèce'], ['HU', 'Hongrie'], ['IE', 'Irlande'], ['IS', 'Islande'],
  ['IT', 'Italie'], ['LV', 'Lettonie'], ['LI', 'Liechtenstein'], ['LT', 'Lituanie'],
  ['LU', 'Luxembourg'], ['MK', 'Macédoine du Nord'], ['MT', 'Malte'], ['MD', 'Moldavie'],
  ['MC', 'Monaco'], ['ME', 'Monténégro'], ['NO', 'Norvège'], ['NL', 'Pays-Bas'], ['PL', 'Pologne'],
  ['PT', 'Portugal'], ['CZ', 'Tchéquie'], ['RO', 'Roumanie'], ['GB', 'Royaume-Uni'],
  ['RU', 'Russie'], ['SM', 'Saint-Marin'], ['RS', 'Serbie'], ['SK', 'Slovaquie'], ['SI', 'Slovénie'],
  ['SE', 'Suède'], ['CH', 'Suisse'], ['UA', 'Ukraine'],
];

const OCEANIA: [string, string][] = [
  ['AU', 'Australie'], ['FJ', 'Fidji'], ['KI', 'Kiribati'], ['MH', 'Îles Marshall'],
  ['FM', 'États fédérés de Micronésie'], ['NR', 'Nauru'], ['NZ', 'Nouvelle-Zélande'],
  ['PW', 'Palaos'], ['PG', 'Papouasie-Nouvelle-Guinée'], ['WS', 'Samoa'],
  ['SB', 'Îles Salomon'], ['TO', 'Tonga'], ['TV', 'Tuvalu'], ['VU', 'Vanuatu'],
];

const toCountries = (rows: [string, string][], continent: Continent): Country[] =>
  rows.map(([code, name]) => ({ code, name, continent }));

export const UN_COUNTRIES: Country[] = [
  ...toCountries(AFRICA, 'africa'),
  ...toCountries(AMERICAS, 'americas'),
  ...toCountries(ASIA, 'asia'),
  ...toCountries(EUROPE, 'europe'),
  ...toCountries(OCEANIA, 'oceania'),
].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

const BY_CODE = new Map(UN_COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string | null | undefined): Country | null {
  if (!code) return null;
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

export function continentOf(code: string | null | undefined): Continent | null {
  return getCountry(code)?.continent ?? null;
}
