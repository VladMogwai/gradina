import {
  addPlantPhoto,
  analyzePlantPhoto,
  removePlantPhoto,
  fallbackColorFor,
  type IdentificationConfidence,
  type Plant,
  type PlantPhoto,
} from "@/entities/plant";
import type { Species } from "@/entities/species";
import { ZONE_KIND_LABEL_KEYS, type Zone } from "@/entities/zone";
import { createClient } from "@/shared/api/supabase/client";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { GardenSettings } from "../model/useHistory";
import type { Selection } from "../model/types";
import styles from "../styles/PropertiesPanel.module.scss";

interface PropertiesPanelProps {
  userId: string;
  selection: Selection;
  plants: Plant[];
  zones: Zone[];
  gardenSettings: GardenSettings;
  onClose: () => void;
  onDeletePlant: (id: string) => void;
  onSaveNow: () => Promise<void>;
  onAddPhoto: (id: string, photo: PlantPhoto) => void;
  onRemovePhoto: (id: string, photoId: string) => void;
  onPlantNameChange: (id: string, name: string) => void;
  onPlantColorChange: (id: string, color: string) => void;
  onPlantNotesChange: (id: string, notes: string) => void;
  onAnalysisChange: (id: string, species: Species, confidence: IdentificationConfidence, analyzedAt: string) => void;
  onZoneLabelChange: (id: string, label: string) => void;
  onZoneColorChange: (id: string, color: string) => void;
  onZoneNotesChange: (id: string, notes: string) => void;
  onDeleteZone: (id: string) => void;
}

const CONFIDENCE_KEYS: Record<IdentificationConfidence, string> = {
  low: "confidenceLow",
  medium: "confidenceMedium",
  high: "confidenceHigh",
};

// null = unknown (garden zone or species hardiness not set) - callers show
// nothing in that case, only an explicit false triggers the warning.
function isSurvivable(hardinessZone: string | null, hardinessMin: number | null): boolean | null {
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

export function PropertiesPanel({
  userId,
  selection,
  plants,
  zones,
  gardenSettings,
  onClose,
  onDeletePlant,
  onSaveNow,
  onAddPhoto,
  onRemovePhoto,
  onPlantNameChange,
  onPlantColorChange,
  onPlantNotesChange,
  onAnalysisChange,
  onZoneLabelChange,
  onZoneColorChange,
  onZoneNotesChange,
  onDeleteZone,
}: PropertiesPanelProps) {
  const t = useTranslations("Editor");
  const locale = useLocale() as "ro" | "en" | "ru";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(createClient());
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErrorId, setUploadErrorId] = useState<string | null>(null);
  const [removeErrorId, setRemoveErrorId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzeErrorId, setAnalyzeErrorId] = useState<string | null>(null);

  async function handlePhotoSelected(plant: Plant, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingId(plant.id);
    setUploadErrorId(null);
    try {
      // plant_photos' RLS requires the plant's own row to already exist in
      // garden_plants. A just-created plant only gets there via the
      // debounced autosave, so a photo picked right after creating it can
      // otherwise race ahead of that save and get rejected - forcing the
      // pending save through first closes that window.
      await onSaveNow();
      const photo = await addPlantPhoto(supabaseRef.current, userId, plant.id, file, plant.photos.length);
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

  if (selection?.kind === "plant") {
    const plant = plants.find((p) => p.id === selection.id);
    if (!plant) return null;
    const plantColor = plant.color ?? fallbackColorFor(plant.species?.scientificName ?? plant.name);
    const primaryPhoto = plant.photos[0] ?? null;
    const species = plant.species;
    const survivable = species ? isSurvivable(gardenSettings.hardinessZone, species.hardinessMin) : null;

    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.heading}>{t("properties")}</h2>
          <button onClick={onClose} title={t("close")} className={styles.closeButton}>
            ×
          </button>
        </div>
        <div className={styles.sectionLg}>
          <div className={styles.photoBox}>
            {primaryPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primaryPhoto.url} alt={plant.name} className={styles.photoImg} />
            ) : (
              <div className={styles.noPhotoText}>{t("noPhoto")}</div>
            )}
          </div>

          {plant.photos.length > 0 && (
            <div className={styles.photoThumbStrip}>
              {plant.photos.map((photo) => (
                <div key={photo.id} className={styles.photoThumbWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className={styles.photoThumb} />
                  <button
                    onClick={() => handleRemovePhotoClick(plant, photo)}
                    title={t("removePhoto")}
                    className={styles.photoThumbRemove}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {removeErrorId && <p className={styles.errorText}>{t("photoRemoveFailed")}</p>}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={(e) => handlePhotoSelected(plant, e)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingId === plant.id}
            className={styles.photoButton}
          >
            {uploadingId === plant.id ? t("uploadingPhoto") : t("addPhoto")}
          </button>
          {uploadErrorId === plant.id && <p className={styles.errorText}>{t("photoUploadFailed")}</p>}

          {primaryPhoto && (
            <div className={styles.analysisSection}>
              <button
                onClick={() => handleAnalyze(plant)}
                disabled={analyzingId === plant.id}
                className={styles.analyzeButton}
              >
                {analyzingId === plant.id ? t("analyzing") : species ? t("reanalyze") : t("analyze")}
              </button>
              {analyzeErrorId === plant.id && <p className={styles.errorText}>{t("analysisFailed")}</p>}

              {species && plant.identificationConfidence && (
                <div className={styles.analysisResult}>
                  <div className={styles.confidenceRow}>
                    <span className={styles.scientificName}>{species.scientificName}</span>
                    <span className={styles.confidenceBadge}>
                      {t(CONFIDENCE_KEYS[plant.identificationConfidence])}
                    </span>
                  </div>
                  {species.commonName && <p className={styles.analysisCommonName}>{species.commonName}</p>}

                  <p className={styles.aiDisclaimer}>
                    {species.dataSource === "perenual" ? t("perenualDisclaimer") : t("aiDisclaimer")}
                  </p>

                  {species.fallbackDescription && species.fallbackCare ? (
                    <>
                      <Field label={t("description")}>{species.fallbackDescription[locale]}</Field>
                      <Field label={t("aiCare")}>{species.fallbackCare[locale]}</Field>
                    </>
                  ) : species.description ? (
                    // Localization pass didn't run or failed - the raw
                    // (English-only) Perenual description is still real,
                    // verified data, so show it rather than nothing.
                    <Field label={t("description")}>{species.description}</Field>
                  ) : (
                    <p className={styles.muted}>{t("noCareDataAvailable")}</p>
                  )}

                  {species.droughtTolerant !== null && (
                    <Field label={t("droughtTolerant")}>{species.droughtTolerant ? t("yes") : t("no")}</Field>
                  )}
                  {(species.poisonousToHumans || species.poisonousToPets) && (
                    <p className={styles.errorText}>{t("poisonousWarning")}</p>
                  )}

                  {survivable === false && <p className={styles.errorText}>{t("mayNotSurvive")}</p>}
                </div>
              )}
            </div>
          )}

          <Field label={t("name")}>
            <input
              type="text"
              value={plant.name}
              onChange={(e) => onPlantNameChange(plant.id, e.target.value)}
              className={styles.textField}
            />
          </Field>
          <Field label={t("color")}>
            <input
              type="color"
              value={plantColor}
              onChange={(e) => onPlantColorChange(plant.id, e.target.value)}
              className={styles.colorInput}
            />
          </Field>
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
            <button onClick={() => onDeletePlant(plant.id)} className={styles.deleteButton}>
              {t("delete")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selection?.kind === "zone") {
    const zone = zones.find((z) => z.id === selection.id);
    if (!zone) return null;

    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.heading}>{t("properties")}</h2>
          <button onClick={onClose} title={t("close")} className={styles.closeButton}>
            ×
          </button>
        </div>
        <div className={styles.sectionLg}>
          <Field label={t("kind")}>{t(ZONE_KIND_LABEL_KEYS[zone.kind])}</Field>
          <Field label={t("label")}>
            <input
              type="text"
              value={zone.label}
              onChange={(e) => onZoneLabelChange(zone.id, e.target.value)}
              className={styles.textField}
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
            <button onClick={() => onDeleteZone(zone.id)} className={styles.deleteButton}>
              {t("delete")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
