import { fallbackColorFor, type Plant } from "@/entities/plant";
import {
  DEFAULT_ZONE_SIZE,
  ZONE_KIND_DEFAULT_COLOR,
  ZONE_KIND_LABEL_KEYS,
  ZONE_KINDS,
  type Zone,
  type ZoneKind,
} from "@/entities/zone";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { Selection } from "../model/types";
import styles from "../styles/PropertiesPanel.module.scss";

interface PropertiesPanelProps {
  selection: Selection;
  plants: Plant[];
  zones: Zone[];
  onWaterNow: (id: string) => void;
  onDeletePlant: (id: string) => void;
  onPhotoChange: (id: string, photoUrl: string) => void;
  onPlantNameChange: (id: string, name: string) => void;
  onPlantColorChange: (id: string, color: string) => void;
  onPlantSpeciesChange: (id: string, species: string) => void;
  onPlantNotesChange: (id: string, notes: string) => void;
  onZoneLabelChange: (id: string, label: string) => void;
  onZoneColorChange: (id: string, color: string) => void;
  onZoneNotesChange: (id: string, notes: string) => void;
  onDeleteZone: (id: string) => void;
  onAddPlant: (row: number, col: number, name: string, width: number, height: number) => boolean;
  onAddZone: (
    row: number,
    col: number,
    kind: ZoneKind,
    label: string,
    color: string,
    width: number,
    height: number
  ) => boolean;
}

function occupantOf(row: number, col: number, plants: Plant[]): Plant | undefined {
  return plants.find(
    (p) => row >= p.startRow && row < p.startRow + p.height && col >= p.startCol && col < p.startCol + p.width
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>{children}</div>
    </div>
  );
}

function AddPlantForm({
  row,
  col,
  onAddPlant,
}: {
  row: number;
  col: number;
  onAddPlant: PropertiesPanelProps["onAddPlant"];
}) {
  const t = useTranslations("Editor");
  const [name, setName] = useState("");
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [error, setError] = useState(false);

  function submit() {
    if (!name.trim()) return;
    const ok = onAddPlant(row, col, name.trim(), Math.max(1, width), Math.max(1, height));
    if (!ok) {
      setError(true);
      return;
    }
    setName("");
    setWidth(1);
    setHeight(1);
    setError(false);
  }

  return (
    <div className={styles.formSection}>
      <h3 className={styles.formHeading}>{t("addPlant")}</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(false);
        }}
        placeholder={t("name")}
        className={styles.textField}
      />
      <div className={styles.sizeRow}>
        <input
          type="number"
          min={1}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className={styles.numberInput}
        />
        <span className={styles.times}>×</span>
        <input
          type="number"
          min={1}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className={styles.numberInput}
        />
        <span className={styles.cellsLabel}>{t("cells")}</span>
      </div>
      {error && <p className={styles.errorText}>{t("invalidPlacement")}</p>}
      <button onClick={submit} disabled={!name.trim()} className={styles.submitButton}>
        {t("addPlant")}
      </button>
    </div>
  );
}

function AddZoneForm({
  row,
  col,
  onAddZone,
}: {
  row: number;
  col: number;
  onAddZone: PropertiesPanelProps["onAddZone"];
}) {
  const t = useTranslations("Editor");
  const [kind, setKind] = useState<ZoneKind>(ZONE_KINDS[0]);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(ZONE_KIND_DEFAULT_COLOR[ZONE_KINDS[0]]);
  const [width, setWidth] = useState(DEFAULT_ZONE_SIZE);
  const [height, setHeight] = useState(DEFAULT_ZONE_SIZE);
  const [error, setError] = useState(false);

  function handleKindChange(nextKind: ZoneKind) {
    setKind(nextKind);
    setColor(ZONE_KIND_DEFAULT_COLOR[nextKind]);
  }

  function submit() {
    const finalLabel = label.trim() || t(ZONE_KIND_LABEL_KEYS[kind]);
    const ok = onAddZone(row, col, kind, finalLabel, color, Math.max(1, width), Math.max(1, height));
    if (!ok) {
      setError(true);
      return;
    }
    setLabel("");
    setError(false);
  }

  return (
    <div className={styles.formSection}>
      <h3 className={styles.formHeading}>{t("addZone")}</h3>
      <input
        type="text"
        value={label}
        onChange={(e) => {
          setLabel(e.target.value);
          setError(false);
        }}
        placeholder={t(ZONE_KIND_LABEL_KEYS[kind])}
        className={styles.textField}
      />
      <select
        value={kind}
        onChange={(e) => handleKindChange(e.target.value as ZoneKind)}
        title={t("kind")}
        className={styles.textField}
      >
        {ZONE_KINDS.map((k) => (
          <option key={k} value={k}>
            {t(ZONE_KIND_LABEL_KEYS[k])}
          </option>
        ))}
      </select>
      <div className={styles.sizeRow}>
        <input
          type="number"
          min={1}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className={styles.numberInput}
        />
        <span className={styles.times}>×</span>
        <input
          type="number"
          min={1}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className={styles.numberInput}
        />
        <span className={styles.cellsLabel}>{t("cells")}</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className={styles.colorInputAuto}
          title={t("color")}
        />
      </div>
      {error && <p className={styles.errorText}>{t("invalidPlacement")}</p>}
      <button onClick={submit} className={styles.submitButton}>
        {t("addZone")}
      </button>
    </div>
  );
}

export function PropertiesPanel({
  selection,
  plants,
  zones,
  onWaterNow,
  onDeletePlant,
  onPhotoChange,
  onPlantNameChange,
  onPlantColorChange,
  onPlantSpeciesChange,
  onPlantNotesChange,
  onZoneLabelChange,
  onZoneColorChange,
  onZoneNotesChange,
  onDeleteZone,
  onAddPlant,
  onAddZone,
}: PropertiesPanelProps) {
  const t = useTranslations("Editor");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function formatDate(iso: string | null): string {
    if (!iso) return t("never");
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function handlePhotoSelected(plant: Plant, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // Prototype only: the photo lives in memory as an object URL for this
    // tab session. In production this would be resized to ~1024px WebP,
    // uploaded to Supabase Storage, its path saved to photoUrl, and AI
    // species recognition would run on it.
    if (plant.photoUrl) URL.revokeObjectURL(plant.photoUrl);
    onPhotoChange(plant.id, URL.createObjectURL(file));
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>{t("properties")}</h2>

      {!selection && <p className={styles.hint}>{t("selectHint")}</p>}

      {selection?.kind === "cell" &&
        (() => {
          const occupant = occupantOf(selection.row, selection.col, plants);
          return (
            <div className={styles.sectionSm}>
              <Field label={t("position")}>
                ({selection.row}, {selection.col})
              </Field>
              <Field label={t("cell")}>{occupant ? t("occupied") : t("empty")}</Field>
              {occupant && <Field label={t("occupiedBy")}>{occupant.name}</Field>}
              {!occupant && (
                <>
                  <p className={styles.emptyCellHint}>{t("emptyCellHint")}</p>
                  <AddPlantForm
                    key={`plant-${selection.row}-${selection.col}`}
                    row={selection.row}
                    col={selection.col}
                    onAddPlant={onAddPlant}
                  />
                  <AddZoneForm
                    key={`zone-${selection.row}-${selection.col}`}
                    row={selection.row}
                    col={selection.col}
                    onAddZone={onAddZone}
                  />
                </>
              )}
            </div>
          );
        })()}

      {selection?.kind === "plant" &&
        (() => {
          const plant = plants.find((p) => p.id === selection.id);
          if (!plant) return null;
          const plantColor = plant.color ?? fallbackColorFor(plant.species ?? plant.name);
          return (
            <div className={styles.sectionLg}>
              <div className={styles.photoBox}>
                {plant.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={plant.photoUrl} alt={plant.name} className={styles.photoImg} />
                ) : (
                  <div className={styles.noPhotoText}>{t("noPhoto")}</div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenFileInput}
                onChange={(e) => handlePhotoSelected(plant, e)}
              />
              <button onClick={() => fileInputRef.current?.click()} className={styles.photoButton}>
                {plant.photoUrl ? t("changePhoto") : t("addPhoto")}
              </button>

              <Field label={t("name")}>
                <input
                  type="text"
                  value={plant.name}
                  onChange={(e) => onPlantNameChange(plant.id, e.target.value)}
                  className={styles.textField}
                />
              </Field>
              <Field label={t("id")}>
                <span className={styles.mono}>{plant.id}</span>
              </Field>
              <Field label={t("position")}>
                ({plant.startRow}, {plant.startCol})
              </Field>
              <Field label={t("size")}>
                {plant.width} × {plant.height} {t("cells")}
              </Field>
              <Field label={t("color")}>
                <input
                  type="color"
                  value={plantColor}
                  onChange={(e) => onPlantColorChange(plant.id, e.target.value)}
                  className={styles.colorInput}
                />
              </Field>
              <Field label={t("species")}>
                <input
                  type="text"
                  value={plant.species ?? ""}
                  onChange={(e) => onPlantSpeciesChange(plant.id, e.target.value)}
                  placeholder={t("unknown")}
                  className={styles.textField}
                />
                {plant.speciesUncertain && <span className={styles.uncertainBadge}>{t("uncertain")}</span>}
              </Field>
              <Field label={t("lastWatered")}>
                <div className={styles.waterRow}>
                  <span>{formatDate(plant.lastWateredAt)}</span>
                  <button onClick={() => onWaterNow(plant.id)} className={styles.waterButton}>
                    {t("waterNow")}
                  </button>
                </div>
              </Field>
              <Field label={t("careAdvice")}>
                {plant.careAdvice ?? <span className={styles.muted}>{t("noAdviceYet")}</span>}
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
          );
        })()}

      {selection?.kind === "zone" &&
        (() => {
          const zone = zones.find((z) => z.id === selection.id);
          if (!zone) return null;
          return (
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
              <Field label={t("position")}>
                ({zone.startRow}, {zone.startCol})
              </Field>
              <Field label={t("size")}>
                {zone.width} × {zone.height} {t("cells")}
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
          );
        })()}
    </div>
  );
}
