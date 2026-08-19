import type { SpeciesLocalized } from "../model/types";

export type Locale = keyof SpeciesLocalized; // "ro" | "en" | "ru"

// Perenual's fixed-vocabulary fields (watering, sunlight, care_level,
// growth_rate, soil, and the common pest names) come back as English
// strings. They're translated here with a static table rather than through
// Gemini: deterministic, no API quota, and no risk of the same value
// drifting to different wording between species.
//
// Perenual doesn't publish a closed vocabulary, so this covers the values
// actually observed from the API. Anything unrecognized falls through to
// the raw English string (see localizeEnum) - no worse than the current
// behavior, and it never blanks a field.
const ENUM_LABELS: Record<string, SpeciesLocalized> = {
  // watering
  frequent: { en: "Frequent", ro: "Frecventă", ru: "Частый" },
  average: { en: "Average", ro: "Moderată", ru: "Умеренный" },
  minimum: { en: "Minimum", ro: "Minimă", ru: "Минимальный" },
  none: { en: "None", ro: "Deloc", ru: "Не требуется" },

  // sunlight
  "full sun": { en: "Full sun", ro: "Soare deplin", ru: "Полное солнце" },
  "part shade": { en: "Partial shade", ro: "Semiumbră", ru: "Полутень" },
  "part sun/part shade": { en: "Partial sun / partial shade", ro: "Semisoare / semiumbră", ru: "Полусолнце / полутень" },
  "sun-part shade": { en: "Sun to partial shade", ro: "Soare până la semiumbră", ru: "От солнца до полутени" },
  "full shade": { en: "Full shade", ro: "Umbră deplină", ru: "Полная тень" },
  "filtered shade": { en: "Filtered shade", ro: "Umbră filtrată", ru: "Рассеянная тень" },
  "deep shade": { en: "Deep shade", ro: "Umbră adâncă", ru: "Глубокая тень" },

  // care_level / growth_rate (share Low/Moderate/High wording)
  easy: { en: "Easy", ro: "Ușoară", ru: "Простой" },
  low: { en: "Low", ro: "Scăzut", ru: "Низкий" },
  medium: { en: "Medium", ro: "Mediu", ru: "Средний" },
  moderate: { en: "Moderate", ro: "Moderat", ru: "Умеренный" },
  high: { en: "High", ro: "Ridicat", ru: "Высокий" },
  fast: { en: "Fast", ro: "Rapid", ru: "Быстрый" },
  slow: { en: "Slow", ro: "Lent", ru: "Медленный" },

  // soil
  loam: { en: "Loam", ro: "Lut", ru: "Суглинок" },
  sand: { en: "Sand", ro: "Nisip", ru: "Песок" },
  clay: { en: "Clay", ro: "Argilă", ru: "Глина" },
  chalk: { en: "Chalk", ro: "Cretă", ru: "Известняк" },
  silt: { en: "Silt", ro: "Mâl", ru: "Ил" },
  "well-drained": { en: "Well-drained", ro: "Bine drenat", ru: "Хорошо дренированная" },

  // type (growth form)
  tree: { en: "Tree", ro: "Copac", ru: "Дерево" },
  shrub: { en: "Shrub", ro: "Arbust", ru: "Кустарник" },
  herb: { en: "Herb", ro: "Plantă erbacee", ru: "Травянистое" },
  grass: { en: "Grass", ro: "Iarbă", ru: "Злак" },
  vine: { en: "Vine", ro: "Liană", ru: "Лиана" },
  fern: { en: "Fern", ro: "Ferigă", ru: "Папоротник" },
  succulent: { en: "Succulent", ro: "Suculentă", ru: "Суккулент" },
  bamboo: { en: "Bamboo", ro: "Bambus", ru: "Бамбук" },
  perennial: { en: "Perennial", ro: "Perenă", ru: "Многолетнее" },
  annual: { en: "Annual", ro: "Anuală", ru: "Однолетнее" },
  biennial: { en: "Biennial", ro: "Bienală", ru: "Двулетнее" },
  biannual: { en: "Biannual", ro: "Bianuală", ru: "Двулетнее" },

  // propagation
  cutting: { en: "Cutting", ro: "Butași", ru: "Черенкование" },
  seed: { en: "Seed", ro: "Semințe", ru: "Семенами" },
  "seed propagation": { en: "Seed", ro: "Semințe", ru: "Семенами" },
  layering: { en: "Layering", ro: "Marcotaj", ru: "Отводками" },
  "layering propagation": { en: "Layering", ro: "Marcotaj", ru: "Отводками" },
  "grafting propagation": { en: "Grafting", ro: "Altoire", ru: "Прививкой" },
  grafting: { en: "Grafting", ro: "Altoire", ru: "Прививкой" },
  division: { en: "Division", ro: "Divizare", ru: "Делением" },
  "division propagation": { en: "Division", ro: "Divizare", ru: "Делением" },
  "root cutting": { en: "Root cutting", ro: "Butași de rădăcină", ru: "Корневыми черенками" },
  "stem cutting": { en: "Stem cutting", ro: "Butași de tulpină", ru: "Стеблевыми черенками" },
  "leaf cutting": { en: "Leaf cutting", ro: "Butași de frunză", ru: "Листовыми черенками" },
  budding: { en: "Budding", ro: "Înmugurire", ru: "Окулировкой" },
  "tissue culture": { en: "Tissue culture", ro: "Cultură de țesuturi", ru: "Меристемное" },

  // seasons (flowering_season / harvest_season)
  spring: { en: "Spring", ro: "Primăvara", ru: "Весна" },
  summer: { en: "Summer", ro: "Vara", ru: "Лето" },
  fall: { en: "Autumn", ro: "Toamna", ru: "Осень" },
  autumn: { en: "Autumn", ro: "Toamna", ru: "Осень" },
  winter: { en: "Winter", ro: "Iarna", ru: "Зима" },

  // dimensions / pruning_count vocabulary
  height: { en: "Height", ro: "Înălțime", ru: "Высота" },
  spread: { en: "Spread", ro: "Lățime", ru: "Ширина" },
  feet: { en: "ft", ro: "ft", ru: "фут" },
  inches: { en: "in", ro: "in", ru: "дюйм" },
  cm: { en: "cm", ro: "cm", ru: "см" },
  yearly: { en: "per year", ro: "pe an", ru: "в год" },
  monthly: { en: "per month", ro: "pe lună", ru: "в месяц" },

  // plant_anatomy parts
  leaves: { en: "Leaves", ro: "Frunze", ru: "Листья" },
  stem: { en: "Stem", ro: "Tulpină", ru: "Стебель" },
  flower: { en: "Flower", ro: "Floare", ru: "Цветок" },
  fruit: { en: "Fruit", ro: "Fruct", ru: "Плод" },
  bark: { en: "Bark", ro: "Scoarță", ru: "Кора" },

  // common pest_susceptibility values
  aphids: { en: "Aphids", ro: "Afide", ru: "Тля" },
  "spider mites": { en: "Spider mites", ro: "Acarieni", ru: "Паутинный клещ" },
  mealybugs: { en: "Mealybugs", ro: "Păduchi lânoși", ru: "Мучнистый червец" },
  whiteflies: { en: "Whiteflies", ro: "Muște albe", ru: "Белокрылка" },
  scale: { en: "Scale insects", ro: "Insecte cu scut", ru: "Щитовка" },
  thrips: { en: "Thrips", ro: "Tripși", ru: "Трипсы" },
  slugs: { en: "Slugs", ro: "Limacși", ru: "Слизни" },
  snails: { en: "Snails", ro: "Melci", ru: "Улитки" },
};

// Falls back to the raw English value when it isn't in the table above -
// an unknown value shows as Perenual returned it rather than blank.
export function localizeEnum(value: string, locale: Locale): string {
  return ENUM_LABELS[value.trim().toLowerCase()]?.[locale] ?? value;
}

export function localizeEnumList(values: string[], locale: Locale): string {
  return values.map((v) => localizeEnum(v, locale)).join(", ");
}
