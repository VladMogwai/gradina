// PostgREST column-alias list, shared between resolveSpecies.ts
// (server-only) and gardenPlanApi.ts (also used from client code) - kept
// in its own file with zero dependencies so importing it never risks
// pulling server-only secrets into a client bundle.
export const SPECIES_COLUMNS =
  "id, scientificName:scientific_name, dataSource:data_source, perenualId:perenual_id, " +
  "commonName:common_name, watering, wateringBenchmarkValue:watering_benchmark_value, " +
  "wateringBenchmarkUnit:watering_benchmark_unit, sunlight, pruningMonth:pruning_month, " +
  "hardinessMin:hardiness_min, hardinessMax:hardiness_max, soil, " +
  "pestSusceptibility:pest_susceptibility, droughtTolerant:drought_tolerant, " +
  "poisonousToHumans:poisonous_to_humans, poisonousToPets:poisonous_to_pets, " +
  "careLevel:care_level, growthRate:growth_rate, description, " +
  "fallbackDescription:fallback_description, fallbackCare:fallback_care";
