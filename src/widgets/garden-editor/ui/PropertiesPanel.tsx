import {
  PlantPhotoImage,
  addPlantPhoto,
  analyzePlantPhoto,
  removePlantPhoto,
  ConfidenceBadge,
  type IdentificationConfidence,
  type Plant,
  type PlantPhoto,
} from "@/entities/plant";
import {
  localizeEnum,
  localizeEnumList,
  type Locale,
  type Species,
} from "@/entities/species";
import { ZONE_KIND_LABEL_KEYS, type Zone } from "@/entities/zone";
import { createClient } from "@/shared/api/supabase/client";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  Button,
  Chip,
  CircularProgress,
  IconButton,
  SwipeableDrawer,
  TextField,
  Typography,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { GardenSettings } from "../model/useHistory";
import type { Selection } from "../model/types";
import styles from "../styles/PropertiesPanel.module.scss";

interface PropertiesPanelProps {
  userId: string;
  selection: Selection;
  plants: Plant[];
  zones: Zone[];
  gardenSettings: GardenSettings;
  /** Plant whose photo is uploading via the create-from-photo flow, if any. */
  uploadingPhotoFor?: string | null;
  onClose: () => void;
  onDeletePlant: (id: string) => void;
  onSaveNow: () => Promise<void>;
  onAddPhoto: (id: string, photo: PlantPhoto) => void;
  onRemovePhoto: (id: string, photoId: string) => void;
  onPlantNotesChange: (id: string, notes: string) => void;
  onAnalysisChange: (
    id: string,
    species: Species,
    confidence: IdentificationConfidence,
    analyzedAt: string,
  ) => void;
  onZoneLabelChange: (id: string, label: string) => void;
  onZoneColorChange: (id: string, color: string) => void;
  onZoneNotesChange: (id: string, notes: string) => void;
  onDeleteZone: (id: string) => void;
}

// null = unknown (garden zone or species hardiness not set) - callers show
// nothing in that case, only an explicit false triggers the warning.
function isSurvivable(
  hardinessZone: string | null,
  hardinessMin: number | null,
): boolean | null {
  if (!hardinessZone || hardinessMin == null) return null;
  const zoneNum = parseInt(hardinessZone, 10);
  if (Number.isNaN(zoneNum)) return null;
  return zoneNum >= hardinessMin;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>{children}</div>
    </div>
  );
}

// Below this length a clamp+toggle would just be UI noise for no reason -
// only plants with a real paragraph get the collapse. Give this its own
// key={plant.id} at the call site so switching plants resets `expanded`
// instead of carrying over the previous plant's state.
const DESCRIPTION_CLAMP_THRESHOLD = 180;

function ExpandableText({ text }: { text: string }) {
  const t = useTranslations("Editor");
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > DESCRIPTION_CLAMP_THRESHOLD;
  return (
    <div className={styles.descriptionBlock}>
      <p
        className={
          !expanded && needsToggle ? styles.descriptionClamped : styles.descriptionText
        }
      >
        {text}
      </p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={styles.expandToggle}
        >
          {expanded ? t("collapse") : t("showMore")}
        </button>
      )}
    </div>
  );
}

export function PropertiesPanel({
  userId,
  selection,
  plants,
  zones,
  gardenSettings,
  uploadingPhotoFor = null,
  onClose,
  onDeletePlant,
  onSaveNow,
  onAddPhoto,
  onRemovePhoto,
  onPlantNotesChange,
  onAnalysisChange,
  onZoneLabelChange,
  onZoneColorChange,
  onZoneNotesChange,
  onDeleteZone,
}: PropertiesPanelProps) {
  const t = useTranslations("Editor");
  const locale = useLocale() as Locale;
  const supabaseRef = useRef(createClient());
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErrorId, setUploadErrorId] = useState<string | null>(null);
  const [removeErrorId, setRemoveErrorId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzeErrorId, setAnalyzeErrorId] = useState<string | null>(null);

  const open = selection?.kind === "plant" || selection?.kind === "zone";
  // Keeps showing the last real plant/zone while the sheet slides shut, so
  // it doesn't go blank mid-close-animation the instant selection clears.
  const [pinned, setPinned] = useState<Selection>(null);
  useEffect(() => {
    if (open) setPinned(selection);
  }, [open, selection]);
  const effective = open ? selection : pinned;

  // Takes the file directly so both entry points (the plain input on
  // desktop and the camera/gallery menu on touch) share one upload path.
  async function handlePhotoSelected(plant: Plant, file: File) {
    setUploadingId(plant.id);
    setUploadErrorId(null);
    try {
      // plant_photos' RLS requires the plant's own row to already exist in
      // garden_plants. A just-created plant only gets there via the
      // debounced autosave, so a photo picked right after creating it can
      // otherwise race ahead of that save and get rejected - forcing the
      // pending save through first closes that window.
      await onSaveNow();
      const photo = await addPlantPhoto(
        supabaseRef.current,
        userId,
        plant.id,
        file,
        plant.photos.length,
      );
      onAddPhoto(plant.id, photo);
    } catch {
      setUploadErrorId(plant.id);
    } finally {
      setUploadingId(null);
    }
  }

  async function handleRemovePhotoClick(plant: Plant, photo: PlantPhoto) {
    setRemoveErrorId(null);
    try {
      await removePlantPhoto(supabaseRef.current, photo.id, photo.url);
      onRemovePhoto(plant.id, photo.id);
    } catch {
      setRemoveErrorId(photo.id);
    }
  }

  async function handleAnalyze(plant: Plant) {
    setAnalyzingId(plant.id);
    setAnalyzeErrorId(null);
    const result = await analyzePlantPhoto(plant.id);
    if (result.ok) {
      onAnalysisChange(plant.id, result.species, result.confidence, result.analyzedAt);
    } else {
      setAnalyzeErrorId(plant.id);
    }
    setAnalyzingId(null);
  }

  let body: React.ReactNode = null;

  if (effective?.kind === "plant") {
    const plant = plants.find((p) => p.id === effective.id);
    if (plant) {
      const primaryPhoto = plant.photos[0] ?? null;
      // Two sources: a photo added from this sheet, or the create-from-photo
      // flow, which opens this sheet while its upload is still running.
      const photoBusy = uploadingId === plant.id || uploadingPhotoFor === plant.id;
      const species = plant.species;
      const survivable = species
        ? isSurvivable(gardenSettings.hardinessZone, species.hardinessMin)
        : null;

      // Localized description+care pair when the Gemini grounding pass
      // ran, else the raw (English-only) Perenual description alone - same
      // fallback chain as before, just combined into one flowing block
      // instead of two separate Fields, since the new layout only has one
      // collapsible prose slot (item 4 in the spec) rather than a whole
      // free-standing "AI care" section.
      const combinedText =
        species?.fallbackDescription && species?.fallbackCare
          ? `${species.fallbackDescription[locale]}\n\n${species.fallbackCare[locale]}`
          : (species?.description ?? null);

      const metrics: { label: string; value: string }[] = [];
      if (species) {
        if (species.droughtTolerant !== null) {
          metrics.push({
            label: t("droughtTolerant"),
            value: species.droughtTolerant ? t("yes") : t("no"),
          });
        }
        if (species.watering) {
          metrics.push({
            label: t("watering"),
            value: localizeEnum(species.watering, locale),
          });
        }
        if (species.sunlight?.length) {
          metrics.push({
            label: t("sunlight"),
            value: localizeEnumList(species.sunlight, locale),
          });
        }
        if (species.hardinessMin !== null || species.hardinessMax !== null) {
          const value =
            species.hardinessMin !== null && species.hardinessMax !== null
              ? `${species.hardinessMin}–${species.hardinessMax}`
              : String(species.hardinessMin ?? species.hardinessMax);
          metrics.push({ label: t("hardinessZone"), value });
        }
        if (species.growthRate) {
          metrics.push({
            label: t("growthRate"),
            value: localizeEnum(species.growthRate, locale),
          });
        }
        if (species.careLevel) {
          metrics.push({
            label: t("careLevel"),
            value: localizeEnum(species.careLevel, locale),
          });
        }
        if (species.maintenance) {
          metrics.push({
            label: t("maintenance"),
            value: localizeEnum(species.maintenance, locale),
          });
        }
        if (species.type) {
          metrics.push({ label: t("plantType"), value: localizeEnum(species.type, locale) });
        }
        if (species.cycle) {
          metrics.push({ label: t("cycle"), value: localizeEnum(species.cycle, locale) });
        }
        if (species.dimensions?.length) {
          // "Height 18-24 ft" - min and max are often equal, so collapse
          // those to a single number instead of "60-60".
          const value = species.dimensions
            .map((d) => {
              const range =
                d.min_value === d.max_value
                  ? String(d.min_value)
                  : `${d.min_value}-${d.max_value}`;
              return `${localizeEnum(d.type, locale)} ${range} ${localizeEnum(d.unit, locale)}`;
            })
            .join(", ");
          metrics.push({ label: t("dimensions"), value });
        }
        if (species.floweringSeason) {
          metrics.push({
            label: t("floweringSeason"),
            value: localizeEnum(species.floweringSeason, locale),
          });
        }
        if (species.harvestSeason) {
          metrics.push({
            label: t("harvestSeason"),
            value: localizeEnum(species.harvestSeason, locale),
          });
        }
        if (species.soil?.length) {
          metrics.push({ label: t("soil"), value: localizeEnumList(species.soil, locale) });
        }
        if (species.propagation?.length) {
          metrics.push({
            label: t("propagation"),
            value: localizeEnumList(species.propagation, locale),
          });
        }
        if (species.pruningCount) {
          metrics.push({
            label: t("pruningFrequency"),
            value: `${species.pruningCount.amount}x ${localizeEnum(species.pruningCount.interval, locale)}`,
          });
        }
        if (species.pruningMonth?.length) {
          metrics.push({
            label: t("pruningMonths"),
            value: localizeEnumList(species.pruningMonth, locale),
          });
        }
        if (species.plantAnatomy?.length) {
          const value = species.plantAnatomy
            .filter((a) => a.color?.length)
            .map((a) => `${localizeEnum(a.part, locale)}: ${a.color.join(", ")}`)
            .join("; ");
          if (value) metrics.push({ label: t("anatomy"), value });
        }
        // Latin, so deliberately not run through localizeEnum.
        if (species.family) metrics.push({ label: t("family"), value: species.family });
        if (species.genus) metrics.push({ label: t("genus"), value: species.genus });
        if (species.origin?.length) {
          metrics.push({ label: t("origin"), value: species.origin.join(", ") });
        }
        if (species.otherName?.length) {
          metrics.push({ label: t("otherNames"), value: species.otherName.join(", ") });
        }
      }

      // Boolean traits, shown only when true: a list of fourteen "no"s
      // would bury the handful that actually say something about the plant.
      const traits: string[] = species
        ? (
            [
              [species.invasive, "traitInvasive"],
              [species.thorny, "traitThorny"],
              [species.medicinal, "traitMedicinal"],
              [species.cuisine, "traitCuisine"],
              [species.edibleFruit, "traitEdibleFruit"],
              [species.edibleLeaf, "traitEdibleLeaf"],
              [species.fruits, "traitFruits"],
              [species.flowers, "traitFlowers"],
              [species.cones, "traitCones"],
              [species.indoor, "traitIndoor"],
              [species.tropical, "traitTropical"],
              [species.saltTolerant, "traitSaltTolerant"],
              [species.seeds, "traitSeeds"],
            ] as const
          )
            .filter(([on]) => on === true)
            .map(([, key]) => t(key))
        : [];

      body = (
        <>
          <div className={styles.panelHeader}>
            <Typography variant="subtitle1" className={styles.heading}>
              {plant.name}
            </Typography>
            <IconButton onClick={onClose} title={t("close")} aria-label={t("close")}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <div className={styles.sectionLg}>
            <div className={styles.photoBox}>
              {primaryPhoto ? (
                <PlantPhotoImage
                  src={primaryPhoto.url}
                  alt={plant.name}
                  placeholder={primaryPhoto.placeholder}
                  // The hero of the sheet the user just opened - never lazy.
                  priority
                  sizes="(min-width: 600px) 560px, 100vw"
                />
              ) : (
                !photoBusy && <div className={styles.noPhotoText}>{t("noPhoto")}</div>
              )}

              {/* Resizing and hashing a full-size phone photo takes a
                  visible moment before the upload even starts, and during
                  the create flow this sheet opens with an empty photo box -
                  without this the app looks like it did nothing. */}
              {photoBusy && (
                <div className={styles.photoBusyOverlay}>
                  <CircularProgress size={28} />
                  <span className={styles.photoBusyLabel}>{t("uploadingPhoto")}</span>
                </div>
              )}
            </div>

            <div className={styles.photoThumbStrip}>
              {plant.photos.map((photo) => (
                <div key={photo.id} className={styles.photoThumbWrap}>
                  <PlantPhotoImage
                    src={photo.url}
                    alt=""
                    placeholder={photo.placeholder}
                    sizes="44px"
                    className={styles.photoThumb}
                  />
                  <IconButton
                    onClick={() => handleRemovePhotoClick(plant, photo)}
                    title={t("removePhoto")}
                    aria-label={t("removePhoto")}
                    size="small"
                    className={styles.photoThumbRemove}
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </div>
              ))}
              {/* No `capture`, so the OS offers both the camera and the
                  existing photo library. Plain label-wraps-input on
                  purpose - see AddPlantControl. */}
              <Button
                component="label"
                disabled={uploadingId === plant.id}
                title={t("addPhoto")}
                aria-label={t("addPhoto")}
                className={styles.addPhotoTile}
              >
                {uploadingId === plant.id ? (
                  <CircularProgress size={16} />
                ) : (
                  <AddIcon fontSize="small" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className={styles.hiddenFileInput}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) handlePhotoSelected(plant, file);
                  }}
                />
              </Button>
            </div>
            {removeErrorId && (
              <p className={styles.errorText}>{t("photoRemoveFailed")}</p>
            )}
            {uploadErrorId === plant.id && (
              <p className={styles.errorText}>{t("photoUploadFailed")}</p>
            )}

            <div className={styles.nameRow}>
              <div className={styles.nameCol}>
                <span className={styles.nameProminent}>{plant.name}</span>
                {species?.commonName && (
                  <span className={styles.scientificName}>{species.scientificName}</span>
                )}
              </div>
              {/* {species && plant.identificationConfidence && (
                <ConfidenceBadge confidence={plant.identificationConfidence} />
              )} */}
            </div>

            {primaryPhoto && (
              <Button
                onClick={() => handleAnalyze(plant)}
                disabled={analyzingId === plant.id}
                size="small"
                variant="outlined"
                color="info"
                className={styles.analyzeButtonSm}
              >
                {analyzingId === plant.id
                  ? t("analyzing")
                  : species
                    ? t("reanalyze")
                    : t("analyze")}
              </Button>
            )}
            {analyzeErrorId === plant.id && (
              <p className={styles.errorText}>{t("analysisFailed")}</p>
            )}

            {species && (
              <>
                {combinedText ? (
                  <ExpandableText key={plant.id} text={combinedText} />
                ) : (
                  <p className={styles.muted}>{t("noCareDataAvailable")}</p>
                )}

                {metrics.length > 0 && (
                  <div className={styles.metricsGrid}>
                    {metrics.map((m) => (
                      <div key={m.label} className={styles.metricTile}>
                        <div className={styles.metricLabel}>{m.label}</div>
                        <div className={styles.metricValue}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {traits.length > 0 && (
                  <div className={styles.traitsBlock}>
                    <div className={styles.metricLabel}>{t("traits")}</div>
                    <div className={styles.traitsRow}>
                      {traits.map((label) => (
                        <Chip key={label} size="small" label={label} className={styles.traitChip} />
                      ))}
                    </div>
                  </div>
                )}

                {(species.poisonousToHumans || species.poisonousToPets) && (
                  <p className={styles.errorText}>{t("poisonousWarning")}</p>
                )}
                {survivable === false && (
                  <p className={styles.errorText}>{t("mayNotSurvive")}</p>
                )}

                <p className={styles.aiDisclaimer}>
                  {species.dataSource === "perenual"
                    ? t("perenualDisclaimer")
                    : t("aiDisclaimer")}
                </p>
              </>
            )}

            <Field label={t("notes")}>
              <textarea
                value={plant.notes ?? ""}
                onChange={(e) => onPlantNotesChange(plant.id, e.target.value)}
                placeholder={t("noNotes")}
                rows={2}
                className={styles.textarea}
              />
            </Field>

            <div className={styles.deleteSection}>
              <Button
                onClick={() => onDeletePlant(plant.id)}
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                fullWidth
              >
                {t("delete")}
              </Button>
            </div>
          </div>
        </>
      );
    }
  } else if (effective?.kind === "zone") {
    const zone = zones.find((z) => z.id === effective.id);
    if (zone) {
      body = (
        <>
          <div className={styles.panelHeader}>
            <Typography variant="subtitle1" className={styles.heading}>
              {t("properties")}
            </Typography>
            <IconButton onClick={onClose} title={t("close")} aria-label={t("close")}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <div className={styles.sectionLg}>
            <Field label={t("kind")}>{t(ZONE_KIND_LABEL_KEYS[zone.kind])}</Field>
            <Field label={t("label")}>
              <TextField
                value={zone.label}
                onChange={(e) => onZoneLabelChange(zone.id, e.target.value)}
                size="small"
                fullWidth
              />
            </Field>
            <Field label={t("color")}>
              <div className={styles.colorRow}>
                <input
                  type="color"
                  value={zone.color}
                  onChange={(e) => onZoneColorChange(zone.id, e.target.value)}
                  className={styles.colorInput}
                />
                <span className={styles.mono}>{zone.color}</span>
              </div>
            </Field>
            <Field label={t("notes")}>
              <textarea
                value={zone.notes ?? ""}
                onChange={(e) => onZoneNotesChange(zone.id, e.target.value)}
                placeholder={t("noNotes")}
                rows={2}
                className={styles.textarea}
              />
            </Field>

            <div className={styles.deleteSection}>
              <Button
                onClick={() => onDeleteZone(zone.id)}
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                fullWidth
              >
                {t("delete")}
              </Button>
            </div>
          </div>
        </>
      );
    }
  }

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      slotProps={{ paper: { className: styles.panel } }}
    >
      <div className={styles.dragHandle} />
      {body}
    </SwipeableDrawer>
  );
}
